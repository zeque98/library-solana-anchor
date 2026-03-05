import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { LIBRARY_PROGRAM_ID } from '../shared/constants';

const LIBRARY_SEED = 'library';

/**
 * Derives the Library PDA for an owner.
 * Seeds: ["library", owner.key()]
 *
 * @param owner - Library owner public key
 * @param programId - Program ID (defaults to LIBRARY_PROGRAM_ID)
 * @returns [libraryPda, bump]
 */
export function deriveLibraryPDA(
  owner: PublicKey,
  programId: PublicKey = LIBRARY_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(LIBRARY_SEED, 'utf8'), owner.toBuffer()],
    programId,
  );
}
