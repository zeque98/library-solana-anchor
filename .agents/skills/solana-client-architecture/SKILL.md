---
name: solana-client-architecture
description: Enforces the Solana client architecture for app/solana and hooks that call it. Use when adding or modifying RPC client, actions, utils, or transaction/query flows. Reference: docs/ANCHOR_UI_ARCHITECTURE.md.
---

# Solana Client Architecture

## When to use

- Work in `app/solana/**` (client/, actions/, utils/, shared/, providers/, SolanaProvider) or in hooks that call actions/client (e.g. app/hooks/useStake.ts, useConfig.ts)
- Add or change program instructions, RPC helpers, actions, or validation
- Add read-only queries or transaction flows

Full reference: `docs/ANCHOR_UI_ARCHITECTURE.md`.

---

## Folder responsibilities

- **client/**: Instruction builders, `*SendAndConfirm`, read-only query helpers (get*, fetch*, list\*). Chain only; no validation, no UI. Imports from pda and shared (or app-level types/constants); not from utils.
- **actions/**: Writes only. Validate (wallet, SOL, optional domain checks), derive accounts, build pre-instructions, call `*SendAndConfirm` or `*Builder(...).instruction()`. No toasts, no React. Prefer signature `(ctx: ActionContext, args)`; legacy `(connection, walletPubKey, args)` allowed if connection matches provider.
- **utils/**: Pure helpers (validation, ATA, formatting). Return results/errors; actions throw. May import client/pda or shared; not actions or React.
- **shared/**: Optional. Types, constants, pure helpers used by client and utils. No chain reads, no UI. Keeps client from depending on utils.
- **hooks/**: Call **actions** for writes. For reads, may import from **client** only: `get*`, `fetch*`, `list*`, `derive*` (pda), and setup (`initializeClient`, `getProgram`). **Must not** import any `*Builder` or `*SendAndConfirm`. May use solana/utils for pure helpers. Handle UI (loading, toasts, query invalidation).

---

## Allowed imports

| From     | May import                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| client/  | pda, shared (or app types/constants), Solana/Anchor. Not: actions, utils.                                                                                                      |
| actions/ | client (rpc, pda), utils, shared, types, constants. Not: hooks, React.                                                                                                         |
| utils/   | client/pda or client only if needed (e.g. getProvider), shared, types, Solana. Not: actions, React.                                                                            |
| hooks/   | solana/actions (writes). From solana/client only: get*, fetch*, list*, derive*, initializeClient, getProgram. From solana/utils: pure helpers. Not: *Builder, *SendAndConfirm. |

---

## Connection and ActionContext (single source of truth)

- **Preferred:** Use an `ActionContext` type `{ connection, walletPubKey }` and pass `(ctx, args)` to every action. Build ctx in the hook from `useConnection()` and `useAnchorWallet()`; use the same connection to build the Anchor provider and pass to `initializeClient(programId?, provider)`.
- **Allowed:** Legacy `(connection, walletPubKey, args)`. If used, connection must be the same as the one used to create the provider. Never use one connection for pre-checks and another for sending.

---

## RPC: two exports per instruction (default)

For each instruction:

1. **`{instructionName}Builder`** — Returns MethodsBuilder; derive PDAs from pda.ts; `.accountsStrict()`; accept `remainingAccounts?`. Use for raw instruction or custom tx.
2. **`{instructionName}SendAndConfirm`** — Check program init; accept `(args, remainingAccounts?, preInstructions?)`; call builder then `.rpc()`. Call from **actions only**; never from hooks.

Raw instruction when needed: `await {instructionName}Builder(args).instruction()`.

**Escape hatch:** Add a third export `{instructionName}` (instruction only) **only when** (a) multiple call sites build composite transactions and (b) repeating `builder(args).instruction()` reduces readability. That export must not be used for sending; sends still go through actions. Prefer two exports.

Queries: name helpers `get*`, `fetch*`, or `list*`; check init; return typed data. Hooks may import and call them.

---

## Hooks: enforceable read boundary

- **Writes:** call `*Action(ctx, args)` or `*Action(connection, wallet.publicKey, args)` only.
- **Reads from client:** hooks may import only symbols named `get*`, `fetch*`, `list*`, or `derive*` (from pda), plus `initializeClient` and `getProgram` for setup. Hooks **must not** import any `*Builder` or `*SendAndConfirm`.
- **Reads from utils:** hooks may call pure helpers (e.g. parseError, formatting). Naming makes the rule easy to enforce: if it’s not get/fetch/list/derive and it’s from client, don’t use it in a hook for writes.

---

## Actions

- Preferred signature: `(ctx: ActionContext, args) => Promise<ActionResult>`. Allowed: `(connection, walletPubKey, args)` with connection rule above.
- Baseline validation: wallet connected; SOL balance for fees (e.g. checkSolBalance; throw if insufficient).
- Optional: ATA existence, token ownership/amount, domain rules. Prefer enforcing in the action; hooks may do extra reads for UX.
- Validation helpers in utils **return** results (e.g. `{ sufficient, error? }`); actions **throw** with a user-facing message.

---

## Naming (strict)

| Layer   | Pattern                                                                   | Examples                                                    |
| ------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| RPC     | `{instructionName}Builder`, `{instructionName}SendAndConfirm`             | stakeBuilder, stakeSendAndConfirm                           |
| RPC     | get*, fetch*, list\*                                                      | getConfig, getUser, getStakeAccount, getStakeAccountsByUser |
| Context | ActionContext                                                             | { connection, walletPubKey }                                |
| Actions | `{operation}Action`, `{Operation}ActionParams`, `{Operation}ActionResult` | stakeAction, StakeActionParams                              |
| Hooks   | `use{Operation}`, `use{Resource}`                                         | useStake, useConfig                                         |

---

## Checklist: new instruction

**RPC:** Add `{instructionName}Builder` and `{instructionName}SendAndConfirm`; PDAs in pda.ts. Add third export only per escape hatch (composite tx, readability).

**Action:** Add `{operation}Action(ctx, args)` or `(connection, walletPubKey, args)` with wallet + SOL validation, derive accounts, pre-instructions, call `*SendAndConfirm` (or builder for pre-ixs), return result.

**Hook:** Call `{operation}Action` only for the write; for reads import from client only get*/fetch*/list*/derive*. Never import *Builder or *SendAndConfirm in hooks.

**Shared:** Use shared/ (or one place) for types/constants used by both client and utils; client does not import utils.

**Defaults:** Two RPC exports; ActionContext preferred; validation in actions with utils returning results; writes via actions only; hooks import from client only read-style names; one connection source of truth.

**Exceptions:** Third RPC export only when composite tx + readability; validation depth project-specific; legacy action signature allowed with connection rule.
