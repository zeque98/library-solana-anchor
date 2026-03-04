# Anchor ↔ UI Architecture

A reusable architecture for connecting an Anchor program to a React frontend: clear boundaries, one source of truth for connection, and minimal code. Suited to short-lived projects (e.g. 2–4 weeks) that start from scratch.

---

## 1. Folder structure

All program-facing code lives under a single root (e.g. `app/solana/`). Hooks and components live outside that root.

```
app/
├── solana/                    # Program boundary — no React/UI here
│   ├── client/                # Low-level: program client
│   │   ├── rpc.ts             # Builders, SendAndConfirm, read-only queries
│   │   ├── pda.ts             # PDA derivation
│   │   └── index.ts           # Public exports
│   ├── actions/               # High-level: one entry per write operation
│   │   └── *.ts               # e.g. stakingActions.ts
│   ├── utils/                 # Optional: validation, ATA, formatting, errors
│   │   ├── validation.ts
│   │   └── ...
│   └── shared/                # Optional: cross-layer types, constants, pure helpers (no chain, no UI)
│       ├── types.ts
│       └── constants.ts
├── hooks/                     # UI boundary
│   └── use*.ts
└── ...
```

| Folder    | Responsibility |
|-----------|----------------|
| **client/** | Build instructions, derive PDAs, send/confirm, expose read-only queries. No validation, no UI. Imports from `pda` and `shared` (or app-level types/constants); not from `utils`. |
| **actions/** | Orchestrate writes: validate, derive accounts, build pre-instructions, call RPC. No toasts, no React state. |
| **utils/**   | Pure helpers (validation, ATA, formatting). Return results/errors; do not throw by default. May import from `client/pda` or `shared`; not from `client/rpc` write API. |
| **shared/**  | Types, constants, and pure helpers used by both client and utils. No chain reads, no UI. Keeps client from depending on utils. |
| **hooks/**   | Get connection and wallet, call actions for writes; call only read-only client/utils helpers (see §7). Handle UI (loading, toasts, query invalidation). |

---

## 2. Allowed dependencies (who may import whom)

| Layer        | May import from |
|-------------|------------------|
| **client/** | `pda`, `shared` (or app-level types/constants), Solana/Anchor libs. Not: actions, utils. |
| **actions/**| `client` (rpc, pda), `utils`, `shared`, types, constants. Not: hooks, React, UI. |
| **utils/**  | `client/pda` or `client` only if needed (e.g. getProvider), `shared`, types, Solana libs. Not: actions, React. |
| **hooks/**  | `solana/actions` (writes). From `solana/client`: only symbols named `get*`, `fetch*`, `list*`, or `derive*` (PDA derivation). From `solana/utils`: pure helpers. Not: any `*Builder` or `*SendAndConfirm`; all writes go through actions. |

**Rules:** (1) Writes (transactions) always go through an action. (2) Hooks may call client only for read-style APIs: `get*`, `fetch*`, `list*`, `derive*`. (3) Use `shared/` (or a single app-level types/constants place) so client never needs to import utils.

---

## 3. Connection and program initialization (source of truth)

Use one connection for both validation and sending. Two patterns are supported.

### Preferred: ActionContext

Pass a single context object into every action so connection and wallet cannot get out of sync.

```ts
// In shared/ or types: define the context used by all actions
export interface ActionContext {
  connection: Connection;      // Canonical; must be the same as used to build the provider
  walletPubKey: PublicKey;
  // Optional: program or provider if you inject it
}

// Action signature (preferred)
export async function stakeAction(
  ctx: ActionContext,
  args: StakeActionParams
): Promise<StakeActionResult> {
  const { connection, walletPubKey } = ctx;
  // ... validate, derive, call stakeSendAndConfirm
}

// In a hook: build context once from wallet adapter
const ctx = { connection, walletPubKey: wallet.publicKey };
await stakeAction(ctx, { mint, initializeUser });
```

Ensure the same `connection` is used to build the Anchor provider (e.g. in `useProgram`: `new AnchorProvider(connection, wallet, opts)` then `initializeClient(programId?, provider)`). Then pass that `connection` (and `walletPubKey`) into every action call.

### Allowed: Legacy signature

You may keep the signature `(connection: Connection, walletPubKey: PublicKey, args: ActionParams)`. If so, **strict rule:** the `connection` argument must be the same instance (or same endpoint) as the one used to create the provider passed to `initializeClient`. Do not use one connection for pre-checks and another for sending.

---

## 4. RPC client pattern (client/rpc.ts)

### Instruction API: two exports per instruction (default)

For each on-chain **instruction**, expose exactly two exports:

| Export | Purpose |
|--------|--------|
| **`{instructionName}Builder`** | Returns an Anchor `MethodsBuilder`. Use for the raw instruction (`.instruction()`) or custom tx building (e.g. `.preInstructions(...).rpc()`). |
| **`{instructionName}SendAndConfirm`** | Build + send + confirm. Accepts `(args, remainingAccounts?, preInstructions?)`. Use from actions only. |

Raw instruction when needed: `await {instructionName}Builder(args).instruction()`.

Example:

```ts
// In client/rpc.ts

export const stakeBuilder = (
  args: StakeArgs,
  remainingAccounts: web3.AccountMeta[] = []
) => {
  const [configPda] = pda.deriveConfigPDA(programId);
  const [stakeRecordPda] = pda.deriveStakeAccountPDA(args.authority, args.mint, programId);
  return program.methods.stake().accountsStrict({ authority: args.authority, config: configPda, stakeRecord: stakeRecordPda, ... }).remainingAccounts(remainingAccounts);
};

export const stakeSendAndConfirm = async (
  args: StakeArgs,
  remainingAccounts: web3.AccountMeta[] = [],
  preInstructions: web3.TransactionInstruction[] = []
): Promise<string> => {
  if (!_program) throw new Error('Program not initialized. Call initializeClient() first.');
  return stakeBuilder(args, remainingAccounts).preInstructions(preInstructions).rpc();
};
```

- Builders: derive PDAs from `pda.ts`, use `.accountsStrict()`, accept `remainingAccounts?`.
- `*SendAndConfirm`: check program initialized, accept `preInstructions?`, call builder then `.rpc()`. Called only from actions.
- No UI, no validation in the client.

### Escape hatch: third export (instruction-only)

Allow a third export `{instructionName}` that returns only the instruction **only when** (a) multiple call sites build composite transactions and (b) repeating `builder(args).instruction()` reduces readability. That export **must not** be used for sending; all sends go through `*SendAndConfirm` from actions. Prefer two exports as the default.

### Read-only queries

Expose helpers for account fetches, e.g. `getConfig()`, `getUser(walletPubKey)`, `getStakeAccount(walletPubKey, mint)`, `getStakeAccountsByUser(walletPubKey)`. Name them `get*`, `fetch*`, or `list*`. Check client/program initialization and return typed data. Hooks may import and call these directly.

---

## 5. Actions pattern (actions/)

- **Naming:** `{operation}Action`, e.g. `stakeAction`, `unstakeAction`.
- **Signature (preferred):** `(ctx: ActionContext, args: ActionParams) => Promise<ActionResult>`. **Allowed:** `(connection, walletPubKey, args) => Promise<ActionResult>` with the connection rule in §3.
- **Responsibilities:** Validate (§6), derive accounts, build pre-instructions, call `*SendAndConfirm` (or `*Builder(...).instruction()` for pre-instructions), return e.g. `{ signature }`. Throw on failure with a user-facing message.
- **No UI:** No toasts, no queryClient, no React.

---

## 6. Validation responsibilities

- **Where:** In the **action** layer (and in **utils** as pure helpers). Not in the client; optional early checks in hooks for UX only.

- **Baseline (every action that sends a tx):**
  - Wallet connected.
  - SOL balance sufficient for fees (e.g. `checkSolBalance(connection, walletPubKey)`; action throws if insufficient).

- **Optional (project-specific):**
  - ATA existence / create-if-missing instructions.
  - Token account ownership and amount.
  - Domain rules (e.g. “already staked”, “freeze period not passed”). Prefer in the **action**; hooks may do extra reads for UX.

- **Convention:** Validation **helpers** in utils **return** a result (e.g. `{ sufficient: boolean; error?: string }`). **Actions** call them and **throw** with a user-facing message when validation fails.

---

## 7. Hooks

- **Naming:** `use{Operation}` (mutations), `use{Resource}` (reads).
- **Writes:** Call `*Action(ctx, args)` or `*Action(connection, wallet.publicKey, args)` only. Do not call `*SendAndConfirm` or `*Builder` from hooks.
- **Reads (enforceable by naming):**
  - Hooks **may** import from `client` only: `get*`, `fetch*`, `list*`, and `derive*` (from pda, for address derivation). They may also use `initializeClient` / `getProgram` for one-time setup.
  - Hooks **must not** import any `*Builder` or `*SendAndConfirm` from client.
- **Utils:** Hooks may call pure helpers from `solana/utils` (e.g. formatting, parseError).
- **UI:** Handle loading, success, error (toasts, query invalidation, local state). No business logic beyond calling action/query and reacting.

---

## 8. Naming summary

| Layer   | Pattern | Examples |
|---------|---------|----------|
| RPC     | `{instructionName}Builder`, `{instructionName}SendAndConfirm` | `stakeBuilder`, `stakeSendAndConfirm` |
| RPC     | Query helpers: `get*`, `fetch*`, `list*` | `getConfig`, `getUser`, `getStakeAccount`, `getStakeAccountsByUser` |
| Actions | `{operation}Action`, `{Operation}ActionParams`, `{Operation}ActionResult` | `stakeAction`, `StakeActionParams`, `StakeActionResult` |
| Context | `ActionContext` (optional but recommended) | `{ connection, walletPubKey }` |
| Hooks   | `use{Operation}` (mutations), `use{Resource}` (reads) | `useStake`, `useConfig` |

---

## 9. Checklist: adding a new instruction

1. **RPC (client/rpc.ts, client/pda.ts)**  
   Add `{instructionName}Builder` and `{instructionName}SendAndConfirm`; PDA helpers in `pda.ts` if needed. Add a third export only per the escape hatch in §4.

2. **Action (actions/)**  
   Add `{operation}Action(ctx, args)` or `(connection, walletPubKey, args)`: baseline validation (wallet, SOL), derive accounts, pre-instructions, call `*SendAndConfirm` or builder, return result.

3. **Hook (hooks/)**  
   Add or reuse a hook that calls `{operation}Action` and handles loading/success/error. For reads, import only `get*` / `fetch*` / `list*` / `derive*` from client.

4. **Shared (optional)**  
   If types or constants are used by both client and utils, put them in `shared/` (or a single app-level place) so client does not import utils.

---

## Summary

- **Folders:** `app/solana/{client, actions, utils?, shared?}`; hooks outside.
- **Dependencies:** Client does not import utils; use shared for cross-layer types/constants. Writes only via actions; hooks may import from client only read-style APIs (`get*`, `fetch*`, `list*`, `derive*`), never `*Builder` or `*SendAndConfirm`.
- **Connection:** Single source of truth; preferred pattern is `ActionContext`; legacy signature allowed if connection matches provider.
- **RPC:** Two exports per instruction (Builder + SendAndConfirm); third export only under precise escape-hatch conditions; queries named get*/fetch*/list*.
- **Validation:** In actions (utils return results, actions throw).
- **Naming:** Follow the table in §8.
