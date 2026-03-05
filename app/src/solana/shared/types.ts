import type { Connection, PublicKey } from "@solana/web3.js";

/**
 * Context passed into every action. Single source of truth for connection and wallet.
 * Use the same connection to build the Anchor provider and to call actions.
 */
export interface ActionContext {
  connection: Connection;
  walletPubKey: PublicKey;
}

/** On-chain Book (mirrors program struct). */
export interface Book {
  name: string;
  pages: number;
  available: boolean;
}

/** On-chain Library account (mirrors program struct). */
export interface LibraryAccount {
  owner: PublicKey;
  name: string;
  books: Book[];
}
