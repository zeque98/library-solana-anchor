import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LIBRARY_PROGRAM_ID } from '../solana/shared/constants';

export interface ConnectionStatusResult {
  /** RPC responds (e.g. local validator is reachable). */
  rpcConnected: boolean;
  /** Library program account exists and is executable. */
  programDeployed: boolean;
  /** Status is being checked. */
  isLoading: boolean;
}

/**
 * Checks connection to the RPC (validator) and whether the library program is deployed.
 */
export function useConnectionStatus(): ConnectionStatusResult {
  const { connection } = useConnection();
  const [rpcConnected, setRpcConnected] = useState(false);
  const [programDeployed, setProgramDeployed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      setIsLoading(true);
      setRpcConnected(false);
      setProgramDeployed(false);

      try {
        await connection.getVersion();
        if (cancelled) return;
        setRpcConnected(true);
      } catch {
        if (!cancelled) setRpcConnected(false);
      }

      try {
        const accountInfo = await connection.getAccountInfo(
          LIBRARY_PROGRAM_ID,
          {
            commitment: 'confirmed',
          },
        );
        if (cancelled) return;
        setProgramDeployed(!!(accountInfo && accountInfo.executable));
      } catch {
        if (!cancelled) setProgramDeployed(false);
      }

      if (!cancelled) setIsLoading(false);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [connection]);

  return { rpcConnected, programDeployed, isLoading };
}
