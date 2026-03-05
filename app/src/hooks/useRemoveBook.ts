import { useState, useCallback } from "react";
import { removeBookAction } from "../solana/actions/libraryActions";
import type { ActionContext } from "../solana/shared/types";
import type { RemoveBookActionParams, RemoveBookActionResult } from "../solana/actions/libraryActions";

export interface UseRemoveBookResult {
  removeBook: (args: RemoveBookActionParams) => Promise<RemoveBookActionResult>;
  isPending: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Mutation: remove book. Calls removeBookAction only (no *Builder/*SendAndConfirm).
 */
export function useRemoveBook(ctx: ActionContext | null): UseRemoveBookResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const removeBook = useCallback(
    async (args: RemoveBookActionParams) => {
      if (!ctx) throw new Error("Wallet not connected");
      setIsPending(true);
      setError(null);
      try {
        const result = await removeBookAction(ctx, args);
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

  return { removeBook, isPending, error, resetError };
}
