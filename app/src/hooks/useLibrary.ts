import { useState, useEffect, useCallback } from "react";
import { getLibrary } from "../solana/client/rpc";
import type { ActionContext } from "../solana/shared/types";
import type { LibraryAccount } from "../solana/shared/types";

export interface UseLibraryResult {
  library: LibraryAccount | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches the library account for the wallet in ctx.
 * Uses client getLibrary only (read-style API).
 */
export function useLibrary(ctx: ActionContext | null): UseLibraryResult {
  const [library, setLibrary] = useState<LibraryAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!ctx) {
      setLibrary(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLibrary(ctx.connection, ctx.walletPubKey);
      setLibrary(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setLibrary(null);
    } finally {
      setIsLoading(false);
    }
  }, [ctx]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { library, isLoading, error, refetch };
}
