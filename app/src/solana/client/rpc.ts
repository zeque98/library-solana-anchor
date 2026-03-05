import {
  type Connection,
  type PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { LIBRARY_PROGRAM_ID } from '../shared/constants';
import type { Book, LibraryAccount } from '../shared/types';

// -----------------------------------------------------------------------------
// Mock: program not initialized; builders return mock objects.
// Replace with Anchor program.methods.* when integrating real client.
// -----------------------------------------------------------------------------

/** Minimal builder interface for mock; real impl returns Anchor MethodsBuilder. */
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
  _owner: PublicKey,
  args: { name: string },
  _remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
): MockMethodsBuilder {
  void _owner;
  void args;
  return mockBuilder();
}

export async function createLibrarySendAndConfirm(
  _owner: PublicKey,
  args: { name: string },
  _preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  void _owner;
  void args;
  void _preInstructions;
  return createLibraryBuilder(_owner, args).rpc();
}

// ---------- add_book ----------

export function addBookBuilder(
  _owner: PublicKey,
  args: { name: string; pages: number },
  _remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
): MockMethodsBuilder {
  void _owner;
  void args;
  return mockBuilder();
}

export async function addBookSendAndConfirm(
  _owner: PublicKey,
  args: { name: string; pages: number },
  _preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  void _owner;
  void args;
  void _preInstructions;
  return addBookBuilder(_owner, args).rpc();
}

// ---------- remove_book ----------

export function removeBookBuilder(
  _owner: PublicKey,
  args: { name: string },
  _remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
): MockMethodsBuilder {
  void _owner;
  void args;
  return mockBuilder();
}

export async function removeBookSendAndConfirm(
  _owner: PublicKey,
  args: { name: string },
  _preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  void _owner;
  void args;
  void _preInstructions;
  return removeBookBuilder(_owner, args).rpc();
}

// ---------- view_books (read-only; use getLibrary for UI) ----------

export function viewBooksBuilder(
  _owner: PublicKey,
  _remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
): MockMethodsBuilder {
  void _owner;
  return mockBuilder();
}

// ---------- toggle_availability ----------

export function toggleAvailabilityBuilder(
  _owner: PublicKey,
  args: { name: string },
  _remainingAccounts: {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[] = [],
): MockMethodsBuilder {
  void _owner;
  void args;
  return mockBuilder();
}

export async function toggleAvailabilitySendAndConfirm(
  _owner: PublicKey,
  args: { name: string },
  _preInstructions: TransactionInstruction[] = [],
): Promise<string> {
  void _owner;
  void args;
  void _preInstructions;
  return toggleAvailabilityBuilder(_owner, args).rpc();
}

// ---------- Read-only: getLibrary ----------

/**
 * Fetches the Library account for an owner. Returns null if the account does not exist.
 * Hooks may call this directly (get*).
 */
export async function getLibrary(
  _connection: Connection,
  ownerPubkey: PublicKey,
  _programId: PublicKey = LIBRARY_PROGRAM_ID,
): Promise<LibraryAccount | null> {
  void _connection;
  void _programId;
  // Mock: return a fake library for the given owner.
  const mockBooks: Book[] = [
    { name: 'Mock Book', pages: 100, available: true },
  ];
  return {
    owner: ownerPubkey,
    name: 'Mock Library',
    books: mockBooks,
  };
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
