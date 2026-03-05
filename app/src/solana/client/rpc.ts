import {
  type Connection,
  type PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { LIBRARY_PROGRAM_ID } from '../shared/constants';
import type { Book, LibraryAccount } from '../shared/types';
import { getProgram } from './program';
import { deriveLibraryPDA } from './pda';

/** Mock builder for instructions not yet implemented (add_book, remove_book, etc.). */
interface MockMethodsBuilder {
  rpc(): Promise<string>;
  instruction(): Promise<TransactionInstruction>;
}

function mockBuilder(rpcSig = 'mock-signature'): MockMethodsBuilder {
  return {
    rpc: () => Promise.resolve(rpcSig),
    instruction: () =>
      Promise.resolve(
        new TransactionInstruction({
          keys: [],
          programId: LIBRARY_PROGRAM_ID,
          data: Buffer.from([]),
        }),
      ),
  };
}

// ---------- create_library ----------

export function createLibraryBuilder(
  owner: PublicKey,
  args: { name: string },
  _remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
) {
  const prog = getProgram();
  if (!prog)
    throw new Error(
      'Program not initialized. Call initializeClient(provider) first.',
    );
  const [library] = deriveLibraryPDA(owner);
  return prog.methods
    .createLibrary(args.name)
    .accountsStrict({
      owner,
      library,
      systemProgram: SystemProgram.programId,
    })
    .remainingAccounts(_remainingAccounts);
}

export async function createLibrarySendAndConfirm(
  owner: PublicKey,
  args: { name: string },
  preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  return createLibraryBuilder(owner, args)
    .preInstructions(preInstructions)
    .rpc();
}

// ---------- add_book ----------

export function addBookBuilder(
  owner: PublicKey,
  args: { name: string; pages: number },
  remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
) {
  const prog = getProgram();
  if (!prog)
    throw new Error(
      'Program not initialized. Call initializeClient(provider) first.',
    );
  const [library] = deriveLibraryPDA(owner);
  return prog.methods
    .addBook(args.name, args.pages)
    .accountsStrict({
      owner,
      library,
    })
    .remainingAccounts(remainingAccounts);
}

export async function addBookSendAndConfirm(
  owner: PublicKey,
  args: { name: string; pages: number },
  preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  return addBookBuilder(owner, args)
    .preInstructions(preInstructions)
    .rpc();
}

// ---------- remove_book ----------

export function removeBookBuilder(
  owner: PublicKey,
  args: { name: string },
  remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
) {
  const prog = getProgram();
  if (!prog)
    throw new Error(
      'Program not initialized. Call initializeClient(provider) first.',
    );
  const [library] = deriveLibraryPDA(owner);
  return prog.methods
    .removeBook(args.name)
    .accountsStrict({
      owner,
      library,
    })
    .remainingAccounts(remainingAccounts);
}

export async function removeBookSendAndConfirm(
  owner: PublicKey,
  args: { name: string },
  preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  return removeBookBuilder(owner, args)
    .preInstructions(preInstructions)
    .rpc();
}

// ---------- view_books (read-only; use getLibrary for UI) ----------

export function viewBooksBuilder(
  _owner: PublicKey,
  remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
): MockMethodsBuilder {
  void _owner;
  void remainingAccounts;
  return mockBuilder();
}

// ---------- toggle_availability ----------

export function toggleAvailabilityBuilder(
  owner: PublicKey,
  args: { name: string },
  remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
) {
  const prog = getProgram();
  if (!prog)
    throw new Error(
      'Program not initialized. Call initializeClient(provider) first.',
    );
  const [library] = deriveLibraryPDA(owner);
  return prog.methods
    .toggleAvailability(args.name)
    .accountsStrict({
      owner,
      library,
    })
    .remainingAccounts(remainingAccounts);
}

export async function toggleAvailabilitySendAndConfirm(
  owner: PublicKey,
  args: { name: string },
  preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  return toggleAvailabilityBuilder(owner, args)
    .preInstructions(preInstructions)
    .rpc();
}

// ---------- Read-only: getLibrary ----------

/**
 * Fetches the Library account for an owner. Returns null if the account does not exist.
 * Hooks may call this directly (get*).
 */
export async function getLibrary(
  _connection: Connection,
  ownerPubkey: PublicKey,
): Promise<LibraryAccount | null> {
  const prog = getProgram();
  if (!prog) return null;
  const [libraryPda] = deriveLibraryPDA(ownerPubkey);
  try {
    const account = await (
      prog.account as {
        library?: {
          fetch: (
            addr: PublicKey,
          ) => Promise<{ owner: PublicKey; name: string; books: Book[] }>;
        };
      }
    ).library?.fetch(libraryPda);
    if (!account) return null;
    return {
      owner: account.owner,
      name: account.name,
      books: account.books,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches multiple libraries (e.g. by owner list). Mock: returns empty or single mock.
 * Hooks may call this (list*).
 */
export async function listLibrariesByOwner(
  _connection: Connection,
  ownerPubkey: PublicKey,
): Promise<LibraryAccount[]> {
  const lib = await getLibrary(_connection, ownerPubkey);
  return lib ? [lib] : [];
}
