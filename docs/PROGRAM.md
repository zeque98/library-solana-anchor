# Library program reference

Reference for the Anchor program `library`: accounts, instructions, PDAs, and errors.

## Program ID

- **Default (localnet)**: `97p8D5pjdWFcq25FcPgEEQaLvfk48HrYFuqZzihUCpto`
- Defined in `programs/library/src/lib.rs` (`declare_id!`) and in the app at `app/src/solana/shared/constants.ts`.

## PDAs

| Account   | Seeds                    | Description |
|-----------|--------------------------|-------------|
| **Library** | `[b"library", owner]`  | One library per wallet (owner). |

- **Bump**: Stored and validated by Anchor via `seeds` + `bump` in the account constraints.
- Client derivation: `deriveLibraryPDA(owner, programId?)` in `app/src/solana/client/pda.ts`.

## State (accounts and data)

### Library (account)

On-chain account storing a user's library and its books.

| Field   | Type        | Description |
|---------|-------------|-------------|
| `owner` | `Pubkey`    | Library owner (signer for all mutations). |
| `name`  | `String`    | Max length 60. |
| `books` | `Vec<Book>` | Max 10 books. |

- **Space**: `Library::INIT_SPACE + 8` (Anchor 8-byte discriminator).
- **Payer**: `owner` (on init).

### Book (embedded struct)

Stored inside `Library.books`; not a separate account.

| Field       | Type    | Description |
|-------------|---------|-------------|
| `name`      | `String`| Max length 60. |
| `pages`     | `u16`   | Page count. |
| `available` | `bool`  | Whether the book is available (toggleable). |

## Instructions

### create_library

Creates a new library for the signer (owner). Fails if a library PDA for this owner already exists.

| Argument | Type     | Description |
|----------|----------|-------------|
| `name`   | `String` | Library name (max 60). |

**Accounts (NewLibrary)**:

| Account        | Writable | Signer | Description |
|----------------|----------|--------|-------------|
| `owner`        | ✓        | ✓      | Payer and library owner. |
| `library`      | ✓ (init) |        | Library PDA `["library", owner]`. |
| `system_program` |        |        | Required for `init`. |

---

### add_book

Adds a book to the owner's library. Only the library owner may call.

| Argument | Type   | Description |
|----------|--------|-------------|
| `name`   | `String` | Book name (max 60). |
| `pages`  | `u16`  | Page count. |

**Accounts (BookContext)**:

| Account  | Writable | Signer | Description |
|----------|----------|--------|-------------|
| `owner`  |          | ✓      | Must match `library.owner`. |
| `library`| ✓        |        | Library PDA; `has_one = owner`. |

New book is appended with `available: true`.

---

### remove_book

Removes a book by name. Only the library owner may call.

| Argument | Type   | Description |
|----------|--------|-------------|
| `name`   | `String` | Exact book name to remove. |

**Accounts**: Same as [add_book](#add_book) (BookContext).

**Errors**: Returns `BookDoesNotExist` if no book with that name exists.

---

### toggle_availability

Toggles the `available` flag of a book by name. Only the library owner may call.

| Argument | Type   | Description |
|----------|--------|-------------|
| `name`   | `String` | Exact book name. |

**Accounts**: Same as [add_book](#add_book) (BookContext).

**Errors**: Returns `BookDoesNotExist` if no book with that name exists.

## Errors

| Error             | Message |
|-------------------|---------|
| `NotOwner`        | You are not the owner of the library you are trying to modify. |
| `BookDoesNotExist`| The book you are trying to interact with does not exist. |

- `NotOwner`: Enforced by `has_one = owner` on `BookContext.library`.
- `BookDoesNotExist`: Returned by `remove_book` and `toggle_availability` when no matching book name is found.

## Client usage (app)

- **Builders**: `createLibraryBuilder`, `addBookBuilder`, `removeBookBuilder`, `toggleAvailabilityBuilder` — return Anchor `MethodsBuilder` for custom tx building.
- **Send and confirm**: `createLibrarySendAndConfirm`, `addBookSendAndConfirm`, etc. — used only from **actions**.
- **Read-only**: `getLibrary(connection, ownerPubkey)`, `listLibrariesByOwner(connection, ownerPubkey)` — hooks may call these directly.

All writes from the UI go through **actions** (`createLibraryAction`, `addBookAction`, etc.), which perform validation (e.g. SOL balance) and then call the corresponding `*SendAndConfirm`. See [ANCHOR_UI_ARCHITECTURE.md](ANCHOR_UI_ARCHITECTURE.md).
