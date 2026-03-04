# Solana Client Architecture — Context for ChatGPT

**Purpose of this doc:** Use this in a fresh ChatGPT session to discuss and improve the architecture and patterns used in `app/solana` (RPC client, actions, staking). The goal is to evaluate whether the current approach is optimal and what best practices or alternatives to consider.

**What you need to do:** Paste your real code in **Section 5 (Code to review)** before sending to ChatGPT:
- Full contents of `app/solana/actions/stakingActions.ts`
- Lines 471–597 of `app/solana/client/rpc.ts` (staking-related RPC: builders, instruction, sendAndConfirm)

---

## 1. Project context

- **Stack:** Solana + Anchor (programs) + TypeScript client in `app/solana`.
- **Architecture:** Layered — **RPC client** (low-level instruction building) → **Actions** (business logic, validation, orchestration) → **UI** (calls actions, handles state/logging).
- **Current doubt:** Whether the split between `stakingActions.ts` and `client/rpc.ts` (and the three-layer RPC pattern) is the best design or if it can be simplified/improved.

---

## 2. Intended `app/solana` folder structure

```
app/solana/
├── client/                 # Low-level program client (RPC)
│   ├── rpc.ts              # Instruction builders + instruction() + *SendAndConfirm
│   ├── pda.ts              # Program Derived Address derivation
│   └── index.ts            # Public exports
├── actions/                # High-level business logic
│   ├── escrowActions.ts    # (example from guidelines)
│   └── stakingActions.ts   # Staking flows
├── utils/
│   ├── utils.ts            # ATAs, formatting, seeds, balances, etc.
│   ├── validation.ts       # Input validation (return errors, don’t throw)
│   ├── ataHelpers.ts       # ATA existence, prepareATAInstructions, etc.
│   └── errors.ts           # Error helpers
├── hooks/                  # React hooks for UI
├── providers/              # React context
└── SolanaProvider.tsx      # Main provider
```

- **client:** Only builds instructions and sends transactions; derives PDAs via `pda.ts`; no business rules.
- **actions:** Validation, account derivation, pre-instructions (e.g. ATAs), then call RPC; throw user-friendly errors; return structured results.
- **utils:** Reusable pure helpers; validation utils typically return error arrays/objects.

---

## 3. Cursor skill we follow: `solana-client-architecture`

We use a Cursor agent skill to keep this architecture consistent. Below is the skill content (path in project: `.agents/skills/solana-client-architecture/SKILL.md`).

### 3.1 Skill frontmatter and description

```yaml
---
name: solana-client-architecture
description: Solana client architecture guidelines for this project. Use when adding or modifying code under app/solana (client, actions, utils, hooks, providers) to keep RPC layers, actions, and utilities consistent with the documented three-layer RPC, actions, and utils architecture.
---
```

### 3.2 When to apply

- Adding or changing code under `app/solana/**`
- Adding a new on-chain instruction to the client
- Adding or refactoring business-logic actions
- Creating/updating Solana-related utils (accounts, ATAs, PDAs, validation)

### 3.3 Core architecture (from skill)

**RPC client (`client/rpc.ts`)**

- For each instruction, implement **three layers**:
  - `{instructionName}Builder` → returns `MethodsBuilder` (flexibility: pre/post instructions, remaining accounts, custom tx building).
  - `{instructionName}` → returns `TransactionInstruction` (e.g. `builder.instruction()`).
  - `{instructionName}SendAndConfirm` → build + send + confirm (simple API).
- Rules:
  - Derive PDAs in builders using `client/pda.ts`.
  - Use `accountsStrict()` (not `accounts()`).
  - Accept `remainingAccounts` for extensibility.
  - In `*SendAndConfirm`, check `_program` is initialized.

**Actions (`actions/*.ts`)**

- Pure business logic:
  - Validate (wallet, SOL, inputs, on-chain where needed).
  - Derive accounts (PDAs, ATAs).
  - Prepare instructions (e.g. ATA creation as pre-instructions).
  - Call RPC (usually `*SendAndConfirm`).
  - Return structured result (e.g. `{ signature, … }`).
- Do **not** handle UI state or logging.

**Utils**

- Small, focused helpers; validation often returns errors instead of throwing; accept `Connection` when doing on-chain reads.

### 3.4 Implementation checklist (from skill)

**RPC**

- [ ] `{instruction}Builder()`: derive PDAs, `accountsStrict`, `remainingAccounts`, return `MethodsBuilder`.
- [ ] `{instruction}()`: call builder, return `.instruction()`.
- [ ] `{instruction}SendAndConfirm()`: check `_program`, accept `preInstructions`, call builder with `.preInstructions(...).rpc()`.
- [ ] Types in `types/solana.ts`, JSDoc on all three.

**Action**

- [ ] Validate wallet → SOL balance → parse/validate inputs → derive accounts → run validation utils → prepare pre-instructions → call RPC → return result.

### 3.5 Best practices (from skill)

- **Errors:** Actions = user-friendly throws; RPC = technical throws; Utils = prefer return error structures.
- **Types:** Shared types; validate before `new PublicKey(...)`; careful BN ↔ bigint.
- **Transactions:** Prefer pre-instructions for ATA creation; bundle related instructions; optional double-check balances before send to reduce race conditions.

---

## 4. Full guideline summary (for deep context)

The project also has a long-form guideline: `GUIDELINES/Solana_Client_Architecture.md`. Condensed points that matter for the “is this the best pattern?” discussion:

### 4.1 Three-layer RPC pattern

| Layer | Name pattern | Returns | Use when |
|-------|----------------|--------|----------|
| 1 | `{instruction}Builder` | `MethodsBuilder` | You need pre/post instructions, remaining accounts, or custom tx. |
| 2 | `{instruction}` | `TransactionInstruction` | You want only the instruction (e.g. to compose tx manually). |
| 3 | `{instruction}SendAndConfirm` | `TransactionSignature` | You want one call that builds, sends, and confirms. |

Example pattern:

```typescript
// Layer 1
export const stakeBuilder = (args: StakeArgs, remainingAccounts: AccountMeta[] = []): MethodsBuilder<...> => {
  const [userPda] = pda.deriveUserPDA(args.user, _program!.programId);
  return _program!.methods.stake(...).accountsStrict({ ... }).remainingAccounts(remainingAccounts);
};
// Layer 2
export const stake = (args: StakeArgs, remainingAccounts = []): Promise<TransactionInstruction> =>
  stakeBuilder(args, remainingAccounts).instruction();
// Layer 3
export const stakeSendAndConfirm = async (args: StakeArgs, remainingAccounts = [], preInstructions: TransactionInstruction[] = []): Promise<TransactionSignature> => {
  if (!_program) throw new Error('Program not initialized...');
  return stakeBuilder(args, remainingAccounts).preInstructions(preInstructions).rpc();
};
```

### 4.2 Action pattern (high level)

```typescript
export async function stakeAction(
  connection: Connection,
  walletPubKey: PublicKey,
  args: StakeParams,
): Promise<{ signature: string }> {
  if (!walletPubKey) throw new Error('Wallet not connected');
  const solCheck = await checkSolBalance(connection, walletPubKey);
  if (!solCheck.sufficient) throw new Error(solCheck.error || 'Insufficient SOL');
  // Parse/validate inputs, derive PDAs/ATAs, run validateStake(...), prepare ATAs, then:
  const signature = await programClient.stakeSendAndConfirm(args, [], ataInstructions);
  return { signature };
}
```

### 4.3 Data flow

```
UI → actions/stakingActions.ts (validation, derivation, preInstructions) → client/rpc.ts (*SendAndConfirm / Builder) → Anchor program
```

### 4.4 Common patterns (from guideline)

- **ATA creation:** Use `prepareATAInstructions(connection, wallet, [{ owner, mint }, ...])`, pass result as `preInstructions` to `*SendAndConfirm`.
- **Validation:** Validate format first, then on-chain (e.g. mint/account checks); validation utils return `ValidationError[]` instead of throwing.
- **BN vs bigint:** Normalize with something like `typeof x === 'bigint' ? x : BigInt(x.toString())` when crossing program boundary.

---

## 5. Code to review (paste your real code here)

**Instructions:** Paste the actual content of the following files (or the relevant parts) so ChatGPT can suggest concrete improvements.

### 5.1 `app/solana/actions/stakingActions.ts`

```
[PASTE FULL FILE CONTENTS HERE]
```

### 5.2 `app/solana/client/rpc.ts` (lines 471–597, staking-related)

Include:
- Staking `*Builder` function(s)
- Staking `*()` instruction function(s)
- Staking `*SendAndConfirm` function(s)
- Any staking-related types or helpers in that range

```
[PASTE LINES 471–597 HERE]
```

---

## 6. Questions to discuss with ChatGPT

Use these as a starting point; you can add more once you paste your code.

1. **Three-layer RPC:** Is having Builder + instruction + SendAndConfirm for every instruction the right level of abstraction, or does it add unnecessary boilerplate for your staking flows? When would you drop to two layers (e.g. only Builder + SendAndConfirm)?

2. **Actions vs RPC:** Is the current split correct — all validation and “orchestration” in actions, and RPC only building/sending? Or would moving some validation (e.g. balance checks) into the client or into shared utils improve clarity or reuse?

3. **Staking-specific patterns:** For staking (lock, unlock, claim, etc.), are there better patterns than the generic “action → RPC SendAndConfirm with preInstructions”? For example: multi-step flows, composable instructions, or different error-handling strategies.

4. **File organization:** Is one `rpc.ts` with all instructions sustainable, or should staking (and other domains) live in separate client modules (e.g. `client/stakingRpc.ts`) that re-export from `client/rpc.ts` or a shared program instance?

5. **Types and reuse:** Where should staking-specific types live (`types/solana.ts` vs `actions/stakingActions.ts` vs a dedicated `types/staking.ts`), and how to avoid duplication between RPC args and action params?

6. **Testing and mocking:** Given this architecture, what’s the best way to unit test actions (mock RPC? mock connection?) and to test RPC builders in isolation?

7. **Skill vs reality:** Does the Cursor skill (`solana-client-architecture`) match how you actually want to work? Should the skill be updated to allow fewer layers or a different action/RPC boundary for certain instructions?

---

## 7. Quick reference: skill file location

- **Skill path:** `.agents/skills/solana-client-architecture/SKILL.md`
- **Full guideline:** `GUIDELINES/Solana_Client_Architecture.md`

Once you paste your staking code into Section 5, you can send this whole document to ChatGPT and ask it to suggest improvements to the architecture and patterns, or to align the code with the skill and guideline.
