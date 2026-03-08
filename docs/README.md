# Documentation index

Documentation for the **Library** Solana Anchor project: program reference and frontend architecture.

## Quick links

| Document | Description |
|----------|-------------|
| [ANCHOR_UI_ARCHITECTURE.md](ANCHOR_UI_ARCHITECTURE.md) | **Anchor ↔ UI architecture**: folder layout (`client/`, `actions/`, `utils/`, `shared/`), dependency rules, connection as single source of truth, RPC pattern (Builder + SendAndConfirm), actions and validation, hooks and naming. Use this when adding instructions or wiring new UI flows. |
| [PROGRAM.md](PROGRAM.md) | **Program reference**: program ID, PDAs, state (Library, Book), all instructions and accounts, errors, and how the app client/actions use them. |

## Root README

The [repository README](../README.md) covers:

- Features and tech stack
- Prerequisites and setup (install, build, test, run app)
- Project structure
- Program summary
- Deployment notes and root scripts

## App README

The [app README](../app/README.md) covers:

- Web app dependencies and scripts (`pnpm dev`, `build`, `lint`, `preview`)
- How the app fits into the monorepo
