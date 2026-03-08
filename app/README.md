# Library web app

React + TypeScript + Vite frontend for the **Library** Solana program. Connect a wallet, create an on-chain library, and add/remove books or toggle their availability.

## Stack

- **React 19** + **TypeScript**
- **Vite 7** (dev server, build)
- **@solana/wallet-adapter-react** (+ base, react-ui, wallets)
- **@solana/web3.js** + **@coral-xyz/anchor** for RPC and program calls

## Scripts

| Command       | Description |
|---------------|-------------|
| `pnpm dev`    | Start dev server (e.g. http://localhost:5173) |
| `pnpm build`  | TypeScript check + production build |
| `pnpm preview`| Serve production build locally |
| `pnpm lint`   | Run ESLint |

## Project layout (app)

- **`src/solana/`** — Program-facing code (no React in `client/` or `actions/`):
  - `client/` — RPC builders, `*SendAndConfirm`, `getLibrary`, `listLibrariesByOwner`, PDA derivation
  - `actions/` — `createLibraryAction`, `addBookAction`, `removeBookAction`, `toggleAvailabilityAction`
  - `utils/` — Validation (e.g. SOL balance)
  - `shared/` — Types (`ActionContext`, `LibraryAccount`, `Book`), constants (program ID)
- **`src/hooks/`** — `useLibrary`, `useCreateLibrary`, `useAddBook`, `useRemoveBook`, `useToggleAvailability`, etc.
- **`src/components/`** — `WalletConnect`, `LibraryView`, `AddBookForm`, `BookCard`, `NoLibraryView`, `LibrariesListView`, etc.
- **`src/App.tsx`** — Root: wallet/connection, ActionContext, library fetch and mutation hooks, routing between no-wallet / no-library / library views.

The app follows the [Anchor ↔ UI architecture](../docs/ANCHOR_UI_ARCHITECTURE.md): all writes go through actions; hooks use only read-style client APIs (`get*`, `fetch*`, `list*`, `derive*`).

## Running from repo root

From the monorepo root:

```bash
cd app && pnpm install && pnpm dev
```

Ensure the Library program is built (`anchor build`) and, for a real cluster, deployed and its program ID matches `src/solana/shared/constants.ts`.
