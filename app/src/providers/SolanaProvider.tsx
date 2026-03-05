'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css';

export interface SolanaProviderProps {
  children: ReactNode;
}

/**
 * Provides Solana connection and wallet context for the app.
 * Uses devnet by default; set VITE_SOLANA_RPC_URL for a custom endpoint.
 * Phantom and Solflare are included; add more from @solana/wallet-adapter-wallets as needed.
 */
export function SolanaProvider({ children }: SolanaProviderProps) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => {
    const env = import.meta.env.VITE_SOLANA_RPC_URL;
    if (env) return env;

    // In dev (e.g. pnpm dev), default to local validator so "Program deployed" matches anchor deploy
    if (import.meta.env.DEV) return 'http://127.0.0.1:8899';

    return clusterApiUrl(network);
  }, [network]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
