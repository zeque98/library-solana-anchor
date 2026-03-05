import type { Connection, PublicKey } from "@solana/web3.js";

export interface SolBalanceResult {
  sufficient: boolean;
  error?: string;
}

/**
 * Checks if the wallet has enough SOL for transaction fees.
 * Mock: always returns sufficient. Real impl: getBalance and compare to threshold.
 */
export function checkSolBalance(
  _connection: Connection,
  _walletPubKey: PublicKey,
  _minLamports = 5_000_000
): SolBalanceResult {
  return { sufficient: true };
}
