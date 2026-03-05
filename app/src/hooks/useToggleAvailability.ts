import { useState, useCallback } from "react";
import { toggleAvailabilityAction } from "../solana/actions/libraryActions";
import type { ActionContext } from "../solana/shared/types";
import type {
  ToggleAvailabilityActionParams,
  ToggleAvailabilityActionResult,
} from "../solana/actions/libraryActions";

export interface UseToggleAvailabilityResult {
  toggleAvailability: (args: ToggleAvailabilityActionParams) => Promise<ToggleAvailabilityActionResult>;
  isPending: boolean;
  error: Error | null;
  resetError: () => void;
}

/**
 * Mutation: toggle book availability. Calls toggleAvailabilityAction only (no *Builder/*SendAndConfirm).
 */
export function useToggleAvailability(ctx: ActionContext | null): UseToggleAvailabilityResult {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const toggleAvailability = useCallback(
    async (args: ToggleAvailabilityActionParams) => {
      if (!ctx) throw new Error("Wallet not connected");
      setIsPending(true);
      setError(null);
      try {
        const result = await toggleAvailabilityAction(ctx, args);
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

  return { toggleAvailability, isPending, error, resetError };
}
