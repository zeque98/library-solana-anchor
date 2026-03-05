import { useState, useEffect, useCallback, useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { initializeClient } from './solana/client';
import { useLibrary, useCreateLibrary, useAddBook } from './hooks';
import type { Library } from './types/library';
import type { ActionContext } from './solana/shared/types';
import { NoLibraryView } from './components/NoLibraryView';
import { LibrariesListView } from './components/LibrariesListView';
import { LibraryView } from './components/LibraryView';
import { WalletConnect } from './components/WalletConnect';
import { ConnectionStatusBar } from './components/ConnectionStatusBar';
import './App.css';

function App() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [localLibraries, setLocalLibraries] = useState<Library[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const actionContext = useMemo<ActionContext | null>(
    () =>
      connection && wallet.publicKey
        ? { connection, walletPubKey: wallet.publicKey }
        : null,
    [connection, wallet.publicKey],
  );

  useEffect(() => {
    if (
      connection &&
      wallet.publicKey &&
      wallet.signTransaction &&
      wallet.signAllTransactions
    ) {
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction.bind(wallet),
          signAllTransactions: wallet.signAllTransactions!.bind(wallet),
        },
        { commitment: 'confirmed' },
      );
      initializeClient(provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connection,
    wallet.publicKey,
    wallet.signTransaction,
    wallet.signAllTransactions,
  ]);

  const { library: libraryFromChain, refetch } = useLibrary(actionContext);
  const {
    createLibrary,
    isPending,
    error: createError,
  } = useCreateLibrary(actionContext);
  const { addBook, isPending: addBookPending, error: addBookError } = useAddBook(actionContext);

  const handleCreateLibraryOnChain = useCallback(
    async (library: Library) => {
      await createLibrary({ name: library.name });
      await refetch();
    },
    [createLibrary, refetch],
  );

  const handleCreateFirstLibraryLocal = useCallback((library: Library) => {
    setLocalLibraries([library]);
    setSelectedIndex(0);
  }, []);

  const handleCreateLibraryLocal = useCallback(
    (library: Library) => {
      setLocalLibraries((prev) => [...prev, library]);
      setSelectedIndex(localLibraries.length);
    },
    [localLibraries.length],
  );

  const handleAddBookOnChain = useCallback(
    async (name: string, pages: number) => {
      await addBook({ name, pages });
      await refetch();
    },
    [addBook, refetch],
  );

  const handleLibraryChange = useCallback(
    (library: Library) => {
      if (selectedIndex === null) return;
      setLocalLibraries((prev) => {
        const next = [...prev];
        next[selectedIndex] = library;
        return next;
      });
    },
    [selectedIndex],
  );

  const selectedLibrary =
    selectedIndex !== null ? localLibraries[selectedIndex] ?? null : null;

  const hasWallet = !!wallet.publicKey;
  const hasLibraryFromChain = libraryFromChain !== null;
  const chainLibraryAsLibrary: Library | null = libraryFromChain
    ? { name: libraryFromChain.name, books: libraryFromChain.books }
    : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-main">
          <h1 className="app-title">Library</h1>
          <WalletConnect />
        </div>
        <ConnectionStatusBar />
      </header>
      <div className="app">
        {hasWallet ? (
          hasLibraryFromChain && chainLibraryAsLibrary ? (
            <LibraryView
              library={chainLibraryAsLibrary}
              onLibraryChange={() => {}}
              onBackToLibraries={() => {}}
              onAddBookChain={handleAddBookOnChain}
              addBookPending={addBookPending}
              addBookError={addBookError}
            />
          ) : (
            <NoLibraryView
              onCreateLibrary={handleCreateLibraryOnChain}
              isChainMode={true}
              isPending={isPending}
              chainError={createError}
            />
          )
        ) : localLibraries.length === 0 ? (
          <NoLibraryView
            onCreateLibrary={handleCreateFirstLibraryLocal}
            isChainMode={false}
          />
        ) : selectedIndex !== null && selectedLibrary ? (
          <LibraryView
            library={selectedLibrary}
            onLibraryChange={handleLibraryChange}
            onBackToLibraries={() => setSelectedIndex(null)}
          />
        ) : (
          <LibrariesListView
            libraries={localLibraries}
            onSelectLibrary={setSelectedIndex}
            onCreateLibrary={handleCreateLibraryLocal}
          />
        )}
      </div>
    </div>
  );
}

export default App;
