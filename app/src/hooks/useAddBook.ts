import { useState, useCallback } from "react";
import { addBookAction } from "../solana/actions/libraryActions";
import type { ActionContext } from "../solana/shared/types";
import type { AddBookActionParams, AddBookActionResult } from "../solana/actions/libraryActions";

export interface UseAddBookResult {
  addBook: (args: AddBookActionParams) => Promise<AddBookActionResult>;
  isPending: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Mutation: add book. Calls addBookAction only (no *Builder/*SendAndConfirm).
 */
export function useAddBook(ctx: ActionContext | null): UseAddBookResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addBook = useCallback(
    async (args: AddBookActionParams) => {
      if (!ctx) throw new Error("Wallet not connected");
      setIsPending(true);
      setError(null);
      try {
        const result = await addBookAction(ctx, args);
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

  return { addBook, isPending, error, resetError };
}
