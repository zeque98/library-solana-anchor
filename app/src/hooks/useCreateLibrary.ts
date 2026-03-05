import { useState, useCallback } from "react";
import { createLibraryAction } from "../solana/actions/libraryActions";
import type { ActionContext } from "../solana/shared/types";
import type { CreateLibraryActionParams, CreateLibraryActionResult } from "../solana/actions/libraryActions";

export interface UseCreateLibraryResult {
  createLibrary: (args: CreateLibraryActionParams) => Promise<CreateLibraryActionResult>;
  isPending: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Mutation: create library. Calls createLibraryAction only (no *Builder/*SendAndConfirm).
 */
export function useCreateLibrary(ctx: ActionContext | null): UseCreateLibraryResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createLibrary = useCallback(
    async (args: CreateLibraryActionParams) => {
      if (!ctx) throw new Error("Wallet not connected");
      setIsPending(true);
      setError(null);
      try {
        const result = await createLibraryAction(ctx, args);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [ctx]
  );

  const resetError = useCallback(() => setError(null), []);

  return { createLibrary, isPending, error, resetError };
}
