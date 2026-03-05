import { Program } from '@coral-xyz/anchor';
import type { AnchorProvider } from '@coral-xyz/anchor';
import type { Idl } from '@coral-xyz/anchor';

import libraryProgramIdl from '@idl/library_program.json';
import { LIBRARY_PROGRAM_ID } from '../shared/constants';

let program: Program | null = null;
let currentProvider: AnchorProvider | null = null;

/**
 * Initialize the Anchor program with the given provider.
 * Uses LIBRARY_PROGRAM_ID from constants (deployed program on cluster).
 */
export function initializeClient(provider: AnchorProvider): void {
  currentProvider = provider;
  const idlWithDeployedId = {
    ...libraryProgramIdl,
    address: LIBRARY_PROGRAM_ID.toBase58(),
  };
  program = new Program(idlWithDeployedId as Idl, provider);
}

/**
 * Get the current program instance. Returns null until initializeClient has been called.
 */
export function getProgram(): Program | null {
  return program;
}

/**
 * Get the provider passed to initializeClient.
 */
export function getProvider(): AnchorProvider | null {
  return currentProvider;
}
