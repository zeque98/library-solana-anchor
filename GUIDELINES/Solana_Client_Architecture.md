# Solana Client Architecture Guidelines

## Overview

The `app/solana` folder contains the complete client-side infrastructure for interacting with Solana programs. It follows a layered architecture that separates low-level RPC calls, business logic, and utility functions for maintainability, testability, and reusability.

## Folder Structure

```
app/solana/
├── client/           # Low-level program client (RPC calls)
│   ├── rpc.ts        # Instruction builders and RPC methods
│   ├── pda.ts        # Program Derived Address derivation
│   └── index.ts      # Public exports
├── actions/          # High-level business logic
│   └── escrowActions.ts  # Escrow operation actions
├── utils/            # Utility functions
│   ├── utils.ts      # General utilities (ATA derivation, formatting, etc.)
│   ├── validation.ts # Input validation functions
│   ├── ataHelpers.ts # ATA creation and management
│   └── errors.ts     # Error handling utilities
├── hooks/            # React hooks for UI integration
├── providers/        # React context providers
└── SolanaProvider.tsx # Main Solana provider component
```

---

## 1. RPC Client Pattern (`client/rpc.ts`)

### Three-Layer Pattern

For each program instruction, we implement **three levels of abstraction**:

#### Layer 1: Builder Function (`*Builder`)
Returns a `MethodsBuilder` for maximum flexibility. Use when you need to:
- Add pre/post instructions
- Modify accounts or add remaining accounts
- Chain multiple operations
- Get the raw instruction for custom transaction building

**Naming Convention:** `{instructionName}Builder`

**Example:**
```typescript
export const makeBuilder = (
  args: MakeArgs,
  remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<AnchorEscrow, never> => {
  const [escrowPubkey] = pda.deriveEscrowPDA(
    { maker: args.maker, seed: args.seed },
    _program!.programId,
  );
  // ... derive other PDAs

  return _program!.methods
    .make(/* instruction args */)
    .accountsStrict({ /* accounts */ })
    .remainingAccounts(remainingAccounts);
};
```

**Usage:**
```typescript
// Custom transaction building
const builder = makeBuilder(args);
const instruction = await builder.instruction();
tx.add(instruction);

// Or send with pre-instructions
const signature = await makeBuilder(args)
  .preInstructions([createAtaIx])
  .rpc();
```

#### Layer 2: Instruction Function (`*`)
Returns only the `TransactionInstruction`. Use when you:
- Want to build the transaction manually
- Need to combine multiple instructions
- Want full control over transaction construction

**Naming Convention:** `{instructionName}` (same as instruction name)

**Example:**
```typescript
export const make = (
  args: MakeArgs,
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
  makeBuilder(args, remainingAccounts).instruction();
```

**Usage:**
```typescript
const instruction = await make(args);
const tx = new Transaction().add(instruction);
const signature = await sendTransaction(tx, connection, [wallet]);
```

#### Layer 3: Send and Confirm Function (`*SendAndConfirm`)
Handles everything: building, signing, sending, and confirming. Use when you:
- Want the simplest API
- Don't need custom transaction logic
- Are okay with default confirmation behavior

**Naming Convention:** `{instructionName}SendAndConfirm`

**Example:**
```typescript
export const makeSendAndConfirm = async (
  args: MakeArgs,
  remainingAccounts: Array<web3.AccountMeta> = [],
  preInstructions: Array<web3.TransactionInstruction> = [],
): Promise<web3.TransactionSignature> => {
  if (!_program) {
    throw new Error('Program not initialized. Call initializeClient first.');
  }

  return makeBuilder(args, remainingAccounts)
    .preInstructions(preInstructions)
    .rpc();
};
```

**Usage:**
```typescript
const signature = await makeSendAndConfirm(
  args,
  [],
  [createAtaInstruction] // Pre-instructions
);
```

### RPC Client Guidelines

1. **Always implement all three layers** for each instruction
2. **Builder functions must derive PDAs** using functions from `pda.ts`
3. **Use `accountsStrict()`** for type safety (not `accounts()`)
4. **Accept `remainingAccounts`** as optional parameter for extensibility
5. **Accept optional program IDs** (systemProgram, tokenProgram, etc.) with defaults
6. **Check `_program` initialization** in `*SendAndConfirm` functions
7. **Document each function** with JSDoc including:
   - Purpose and use cases
   - When to use vs alternatives
   - Parameter descriptions
   - Return value description
   - Example usage

### Query Functions

For read-only operations (fetching accounts), use a simpler pattern:

```typescript
export const getAllEscrows = async (): Promise<Array<EscrowAccount>> => {
  if (!_program) {
    throw new Error('Program not initialized. Call initializeClient first.');
  }
  return _program.account.escrow.all();
};
```

**Guidelines:**
- Always check program initialization
- Return typed account arrays
- Use Anchor's built-in filters (memcmp, dataSize) for filtering
- Document filter offsets and logic

---

## 2. Actions Pattern (`actions/escrowActions.ts`)

### Purpose

Actions are **pure business logic functions** that:
- Orchestrate multiple RPC calls
- Perform validation before transactions
- Derive accounts and prepare instructions
- Handle error cases
- **Do NOT** handle UI state or logging (that's the component's responsibility)

### Action Function Structure

Each action function follows this pattern:

```typescript
export async function {actionName}Action(
  connection: Connection,
  walletPubKey: PublicKey,
  args: ActionParams,
): Promise<ActionResult> {
  // 1. Validate wallet connection
  if (!walletPubKey) {
    throw new Error('Wallet not connected');
  }

  // 2. Check SOL balance for transaction fees
  const solCheck = await checkSolBalance(connection, walletPubKey);
  if (!solCheck.sufficient) {
    throw new Error(solCheck.error || 'Insufficient SOL balance');
  }

  // 3. Parse and validate inputs (PublicKey conversion, format validation)
  // 4. Derive required accounts (ATAs, PDAs)
  // 5. Run comprehensive validation (on-chain checks, balances, etc.)
  // 6. Prepare instructions (ATA creation, etc.)
  // 7. Execute transaction via RPC client
  // 8. Return result

  return {
    signature,
    // ... other return values
  };
}
```

### Action Guidelines

1. **Pure functions** - No side effects except on-chain transactions
2. **Comprehensive validation** - Validate everything before sending transactions
3. **Use validation utilities** - Import from `utils/validation.ts`
4. **Derive accounts** - Use utilities from `utils.ts` and `client/pda.ts`
5. **Prepare instructions** - Use `prepareATAInstructions()` for ATA creation
6. **Throw descriptive errors** - User-friendly error messages
7. **Return structured results** - Include signature and any created accounts
8. **Document thoroughly** - Explain all validation steps and error cases

### Example: Make Escrow Action

```typescript
export async function makeEscrowAction(
  connection: Connection,
  walletPubKey: PublicKey,
  args: MakeEscrowParams,
): Promise<{ signature: string; seed: bigint }> {
  // 1. Validate wallet
  if (!walletPubKey) {
    throw new Error('Wallet not connected');
  }

  // 2. Basic input validation
  if (!args.mintA || !args.mintB || !args.receiveAmount) {
    throw new Error('Please fill in all required fields');
  }

  // 3. Check SOL balance
  const solCheck = await checkSolBalance(connection, walletPubKey);
  if (!solCheck.sufficient) {
    throw new Error(solCheck.error || 'Insufficient SOL balance');
  }

  // 4. Parse PublicKeys
  let mintAPubkey: PublicKey;
  try {
    mintAPubkey = new PublicKey(args.mintA);
  } catch {
    throw new Error('Invalid Mint A address');
  }

  // 5. Derive accounts
  const [makerAtaA] = getAssociatedTokenAddressSync(mintAPubkey, walletPubKey);

  // 6. Comprehensive validation
  const validationErrors = await validateMakeEscrow(connection, {
    mintA: args.mintA,
    mintB: args.mintB,
    // ... other params
  });
  if (validationErrors.length > 0) {
    throw new Error(validationErrors[0].message);
  }

  // 7. Generate seed
  const seed = generateEscrowSeed();

  // 8. Execute transaction
  const signature = await programClient.makeSendAndConfirm({
    maker: walletPubKey,
    mintA: mintAPubkey,
    // ... other args
  });

  return { signature, seed };
}
```

### Relationship: RPC ↔ Actions

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                        │
│  (handle state, logging, user feedback)                │
└────────────────────┬────────────────────────────────────┘
                     │ calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Actions (escrowActions.ts)                 │
│  • Validation                                           │
│  • Account derivation                                    │
│  • Instruction preparation                               │
│  • Error handling                                        │
└────────────────────┬────────────────────────────────────┘
                     │ calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│              RPC Client (client/rpc.ts)                 │
│  • Builder functions                                     │
│  • Instruction functions                                 │
│  • SendAndConfirm functions                              │
└────────────────────┬────────────────────────────────────┘
                     │ calls
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Anchor Program Client                      │
│  • On-chain program interaction                         │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- **Actions** call **RPC functions** (usually `*SendAndConfirm`)
- **Actions** handle all pre-transaction logic
- **RPC functions** handle transaction construction and execution
- **UI components** call **Actions** and handle state/logging

---

## 3. Utils Pattern

### Purpose

Utils provide reusable, pure functions for common operations. They are organized by domain:

#### `utils/utils.ts`
General-purpose utilities:
- `getAssociatedTokenAddressSync()` - Derive ATA addresses
- `generateEscrowSeed()` - Generate unique seeds
- `formatTokenAmount()` - Format token amounts for display
- `parseTokenAmount()` - Parse user input to raw units
- `shortenAddress()` - Format addresses for UI
- `checkATAExists()` - Check if ATA exists on-chain
- `getTokenBalance()` - Get token balance from ATA

#### `utils/validation.ts`
Input validation functions:
- `validateMakeEscrow()` - Validate escrow creation inputs
- `validateUpdateEscrow()` - Validate escrow update inputs
- `validateTakeEscrow()` - Validate escrow taking inputs
- `checkSolBalance()` - Check SOL balance for fees
- `validateMintAccount()` - Validate mint accounts on-chain

#### `utils/ataHelpers.ts`
ATA creation and management:
- `ataExists()` - Check if ATA exists
- `getATAInfo()` - Get ATA address and existence status
- `prepareATAInstructions()` - Prepare ATA creation instructions
- `validateATAsExist()` - Validate required ATAs exist
- `estimateATARent()` - Estimate rent for ATA creation

### Utils Guidelines

1. **Pure functions** - No side effects, deterministic outputs
2. **Well-documented** - JSDoc with examples
3. **Error handling** - Return errors gracefully, don't always throw
4. **Type safety** - Use proper TypeScript types
5. **Reusable** - Functions should work in multiple contexts
6. **On-chain aware** - Utils that query chain should accept `Connection`

### Example: Validation Utility

```typescript
export async function validateMakeEscrow(
  connection: Connection,
  params: {
    mintA: string;
    mintB: string;
    receiveAmount: string;
    // ... other params
  },
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Validate format first
  let mintAPubkey: PublicKey | null = null;
  try {
    mintAPubkey = new PublicKey(params.mintA);
  } catch {
    errors.push({
      field: 'mintA',
      message: 'Invalid Mint A address format',
    });
  }

  // Then validate on-chain (only if format is valid)
  if (mintAPubkey) {
    const mintAValidation = await validateMintAccount(connection, mintAPubkey);
    if (!mintAValidation.valid) {
      errors.push({
        field: 'mintA',
        message: mintAValidation.error || 'Invalid Mint A account',
      });
    }
  }

  // ... more validation

  return errors; // Return all errors, don't throw
}
```

---

## 4. Best Practices

### Error Handling

1. **Actions throw errors** - User-friendly messages
2. **RPC functions throw errors** - Technical messages (program initialization, transaction failures)
3. **Utils return errors** - Return error arrays/objects, don't throw (for validation)

### Type Safety

1. **Use TypeScript types** from `types/solana.ts`
2. **Use `accountsStrict()`** in RPC builders (not `accounts()`)
3. **Validate PublicKey format** before creating PublicKey objects
4. **Convert BN to bigint** when needed (check type first)

### Account Derivation

1. **Always derive PDAs** in builder functions
2. **Use functions from `pda.ts`** for PDA derivation
3. **Use `getAssociatedTokenAddressSync()`** for ATAs
4. **Check account existence** before using in transactions

### Transaction Building

1. **Use pre-instructions** for ATA creation (not `init_if_needed`)
2. **Bundle related instructions** in single transaction when possible
3. **Validate before sending** - Check balances, account existence, etc.
4. **Handle race conditions** - Double-check balances right before sending

### Documentation

1. **JSDoc for all public functions** - Include purpose, parameters, returns, examples
2. **Explain complex logic** - Document PDA offsets, account layouts, etc.
3. **Provide usage examples** - Show common patterns
4. **Document error cases** - When functions throw and why

### Testing Considerations

1. **Actions are testable** - Pure functions, easy to mock
2. **RPC functions are testable** - Can test builders independently
3. **Utils are testable** - Pure functions, no dependencies
4. **Separation of concerns** - UI logic separate from business logic

---

## 5. Implementation Checklist

When adding a new instruction:

### RPC Client (`client/rpc.ts`)

- [ ] Create `{instruction}Builder()` function
  - [ ] Derive all required PDAs
  - [ ] Use `accountsStrict()`
  - [ ] Accept `remainingAccounts` parameter
  - [ ] Return `MethodsBuilder`
- [ ] Create `{instruction}()` function
  - [ ] Call builder and return `.instruction()`
- [ ] Create `{instruction}SendAndConfirm()` function
  - [ ] Check program initialization
  - [ ] Accept `preInstructions` parameter
  - [ ] Call builder with `.preInstructions()` and `.rpc()`
- [ ] Add TypeScript types to `types/solana.ts`
- [ ] Document all three functions with JSDoc

### Action (`actions/escrowActions.ts`)

- [ ] Create `{action}Action()` function
  - [ ] Validate wallet connection
  - [ ] Check SOL balance
  - [ ] Parse and validate inputs
  - [ ] Derive required accounts
  - [ ] Run comprehensive validation
  - [ ] Prepare instructions (ATAs, etc.)
  - [ ] Execute transaction via RPC client
  - [ ] Return structured result
- [ ] Add TypeScript types for params and return
- [ ] Document function with JSDoc

### Utils (if needed)

- [ ] Create validation function in `utils/validation.ts` (if needed)
- [ ] Add utility functions to `utils/utils.ts` (if needed)
- [ ] Update `utils/ataHelpers.ts` (if ATA logic needed)

---

## 6. Common Patterns

### Pattern: ATA Creation Before Transaction

```typescript
// In action function
const { instructions: ataInstructions, missingATAs } =
  await prepareATAInstructions(connection, walletPubKey, [
    { owner: maker, mint: mintB }, // maker_ata_b
    { owner: taker, mint: mintA }, // taker_ata_a
  ]);

const signature = await programClient.takeSendAndConfirm(
  args,
  [],
  ataInstructions, // Pass as pre-instructions
);
```

### Pattern: Validation Before PublicKey Creation

```typescript
// Validate format first
let mintAPubkey: PublicKey | null = null;
if (!params.mintA || params.mintA.trim() === '') {
  throw new Error('Mint A is required');
}
try {
  mintAPubkey = new PublicKey(params.mintA);
} catch {
  throw new Error('Invalid Mint A address format');
}

// Then validate on-chain (only if format is valid)
if (mintAPubkey) {
  const validation = await validateMintAccount(connection, mintAPubkey);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
}
```

### Pattern: BN to BigInt Conversion

```typescript
const seedBigInt =
  typeof escrow.account.seed === 'bigint'
    ? escrow.account.seed
    : BigInt(escrow.account.seed.toString());
```

### Pattern: Balance Check Before Transaction

```typescript
const balance = await getTokenBalance(connection, ata);
const requiredAmount = BigInt(args.amount);

if (balance < requiredAmount) {
  throw new Error(
    `Insufficient balance. You have ${balance.toString()}, need ${requiredAmount.toString()}`,
  );
}

// Double-check right before sending (race condition protection)
const finalBalance = await getTokenBalance(connection, ata);
if (finalBalance < requiredAmount) {
  throw new Error('Balance changed, please try again');
}
```

---

## Summary

This architecture provides:

1. **Flexibility** - Three levels of RPC abstraction (Builder → Instruction → SendAndConfirm)
2. **Separation of Concerns** - RPC (low-level) vs Actions (business logic) vs Utils (helpers)
3. **Testability** - Pure functions, clear boundaries
4. **Maintainability** - Well-organized, documented code
5. **Reusability** - Utils can be used across the codebase
6. **Type Safety** - Strong TypeScript types throughout
7. **Error Handling** - Consistent error patterns
8. **Best Practices** - Follows Solana/Anchor conventions

Follow these guidelines when extending the Solana client codebase to maintain consistency and quality.
