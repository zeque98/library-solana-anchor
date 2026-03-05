import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

/**
 * Renders the standard wallet connect / account button (Phantom, etc.).
 * Place in the app shell so users can connect before using library actions.
 */
export function WalletConnect() {
  return (
    <div className="wallet-connect">
      <WalletMultiButton />
    </div>
  );
}
