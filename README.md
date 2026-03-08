# Library (Solana Anchor)

A Solana program and React web app for managing a personal **library** on-chain: create a library per wallet, add/remove books, and toggle book availability. Built with [Anchor](https://www.anchor-lang.com/) and a clear client/actions/hooks architecture.

## Features

- **On-chain library**: One library per wallet (PDA per owner); books stored in the library account.
- **Instructions**: Create library, add book, remove book, toggle book availability.
- **Web app**: React + Vite UI with wallet connect; create library and manage books with instant feedback.
- **Tests**: Anchor/TypeScript tests for all instructions (create, add, toggle, remove, error cases).
- **Architecture**: Documented separation between Solana client, actions, and React hooks (see [docs](docs/)).

## Tech stack

| Layer        | Stack |
|-------------|--------|
| Program     | Rust, Anchor 0.32 |
| Tests       | TypeScript, Mocha, ts-mocha |
| Frontend    | React 19, TypeScript, Vite 7 |
| Wallet / RPC| @solana/wallet-adapter-*, @solana/web3.js, @coral-xyz/anchor |

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)
- [Rust](https://www.rust-lang.org/) and [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (match program Anchor version, e.g. 0.32.x)

## Setup

### 1. Install dependencies

```bash
yarn install
cd app && pnpm install   # or npm install
cd ..
```

### 2. Build the program

```bash
anchor build
```

### 3. Run tests (localnet)

Start a local validator (in another terminal):

```bash
solana-test-validator
```

Then run the test suite:

```bash
anchor test
```

### 4. Run the web app

From the repo root:

```bash
cd app && pnpm dev
```

Then open the URL shown (e.g. `http://localhost:5173`). Connect a wallet (e.g. Phantom); the app uses devnet/mainnet depending on your wallet, so ensure the program is deployed to the cluster you use (see [Deployment](#deployment)).

## Project structure

```
library-solana-anchor/
├── Anchor.toml              # Anchor workspace config (program id, cluster, scripts)
├── Cargo.toml               # Workspace Cargo (programs/*)
├── package.json             # Root scripts & deps (Anchor, tests, lint)
├── programs/
│   └── library/             # Anchor program
│       └── src/
│           ├── lib.rs       # Program entry, instruction routing
│           ├── state.rs     # Library, Book accounts
│           ├── context.rs   # NewLibrary, BookContext
│           ├── error.rs     # Custom errors
│           ├── constants.rs
│           └── instructions/
│               ├── create_library.rs
│               ├── add_book.rs
│               ├── remove_book.rs
│               └── toggle_availability.rs
├── app/                     # React frontend
│   ├── src/
│   │   ├── solana/          # Program-facing code (no React in client/actions)
│   │   │   ├── client/      # RPC builders, SendAndConfirm, getLibrary, pda
│   │   │   ├── actions/     # createLibraryAction, addBookAction, etc.
│   │   │   ├── utils/       # validation (e.g. SOL balance)
│   │   │   └── shared/      # types, constants
│   │   ├── hooks/           # useLibrary, useCreateLibrary, useAddBook, ...
│   │   ├── components/      # LibraryView, AddBookForm, WalletConnect, ...
│   │   └── App.tsx
│   └── package.json
├── tests/
│   └── library.ts           # Anchor integration tests
├── migrations/
│   └── deploy.ts            # Deploy script (Anchor CLI)
└── docs/
    ├── README.md            # Documentation index
    ├── ANCHOR_UI_ARCHITECTURE.md  # Client / actions / hooks rules
    └── PROGRAM.md           # Program reference (instructions, accounts, PDAs)
```

## Program summary

- **Program ID**: `97p8D5pjdWFcq25FcPgEEQaLvfk48HrYFuqZzihUCpto` (localnet in `Anchor.toml`).
- **Library account**: PDA with seeds `["library", owner]`; holds `owner`, `name`, and `books: Vec<Book>`.
- **Book**: In-memory struct inside a library: `name`, `pages`, `available`.
- **Instructions**: `create_library(name)`, `add_book(name, pages)`, `remove_book(name)`, `toggle_availability(name)`.

See [docs/PROGRAM.md](docs/PROGRAM.md) for full instruction and account details.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/README.md](docs/README.md) | Documentation index and quick links |
| [docs/ANCHOR_UI_ARCHITECTURE.md](docs/ANCHOR_UI_ARCHITECTURE.md) | Anchor ↔ UI architecture (client, actions, hooks, validation) |
| [docs/PROGRAM.md](docs/PROGRAM.md) | Program reference (instructions, accounts, errors, PDAs) |
| [app/README.md](app/README.md) | Web app setup and scripts |

## Deployment

- **Localnet**: Program ID in `Anchor.toml` is used by `anchor deploy` and tests.
- **Devnet / Mainnet**: Update `[programs.localnet]` (or add `[programs.devnet]` etc.) in `Anchor.toml` if needed, deploy with `anchor deploy --provider.cluster <cluster>`, and set the same program ID in the app (e.g. `app/src/solana/shared/constants.ts`) so the frontend talks to the deployed program.

## Scripts (root)

| Command | Description |
|---------|-------------|
| `yarn lint` | Check Prettier on JS/TS |
| `yarn lint:fix` | Fix Prettier on JS/TS |
| `anchor build` | Build the program |
| `anchor test` | Run tests (uses `yarn run ts-mocha ...` from Anchor.toml) |

## License

ISC
