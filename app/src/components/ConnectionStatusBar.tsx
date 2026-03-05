import { useWallet } from '@solana/wallet-adapter-react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

/**
 * Shows wallet connection status, RPC (validator) connection, and whether the program is deployed.
 */
export function ConnectionStatusBar() {
  const wallet = useWallet();
  const { rpcConnected, programDeployed, isLoading } = useConnectionStatus();

  const walletLabel = wallet.publicKey
    ? `Connected: ${truncateAddress(wallet.publicKey.toBase58())}`
    : 'Not connected';

  return (
    <div className="connection-status-bar" role="status" aria-live="polite">
      <span
        className={`status-pill status-wallet ${wallet.connected ? 'status-ok' : 'status-off'}`}
        title={wallet.publicKey?.toBase58() ?? 'Wallet not connected'}
      >
        {walletLabel}
      </span>
      {isLoading ? (
        <span className="status-pill status-loading">Checking…</span>
      ) : (
        <>
          <span
            className={`status-pill status-rpc ${rpcConnected ? 'status-ok' : 'status-err'}`}
            title={rpcConnected ? 'RPC is reachable' : 'Cannot reach RPC (e.g. local validator)'}
          >
            {rpcConnected ? 'Validator connected' : 'Validator disconnected'}
          </span>
          <span
            className={`status-pill status-program ${programDeployed ? 'status-ok' : 'status-err'}`}
            title={
              programDeployed
                ? 'Library program is deployed'
                : 'Library program not found or not deployed'
            }
          >
            {programDeployed ? 'Program deployed' : 'Program not deployed'}
          </span>
        </>
      )}
    </div>
  );
}
