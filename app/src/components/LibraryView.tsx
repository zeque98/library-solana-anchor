import type { Library } from '../types/library';
import { LibraryHeader } from './LibraryHeader';
import { BookList } from './BookList';
import { AddBookForm } from './AddBookForm';
import { ConfirmDialog } from './ConfirmDialog';
import { useState, useCallback } from 'react';
import { MAX_BOOKS } from '../types/library';

interface LibraryViewProps {
  library: Library;
  onLibraryChange: (library: Library) => void;
  onBackToLibraries: () => void;
  /** When provided, add book is sent on-chain and library is refetched by the parent. */
  onAddBookChain?: (name: string, pages: number) => void | Promise<void>;
  addBookPending?: boolean;
  addBookError?: Error | null;
}

export function LibraryView({
  library,
  onLibraryChange,
  onBackToLibraries,
  onAddBookChain,
  addBookPending = false,
  addBookError = null,
}: LibraryViewProps) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleAddBook = useCallback(
    (name: string, pages: number) => {
      if (onAddBookChain) {
        onAddBookChain(name, pages);
        return;
      }
      onLibraryChange({
        ...library,
        books: [...library.books, { name, pages, available: true }],
      });
    },
    [library, onLibraryChange, onAddBookChain],
  );

  const handleRemoveBook = useCallback(
    (name: string) => {
      onLibraryChange({
        ...library,
        books: library.books.filter((b) => b.name !== name),
      });
      setConfirmRemove(null);
    },
    [library, onLibraryChange]
  );

  const handleToggleAvailability = useCallback(
    (name: string) => {
      onLibraryChange({
        ...library,
        books: library.books.map((b) =>
          b.name === name ? { ...b, available: !b.available } : b
        ),
      });
    },
    [library, onLibraryChange]
  );

  const requestRemove = useCallback((name: string) => setConfirmRemove(name), []);

  const atMaxBooks = library.books.length >= MAX_BOOKS;
  const addFormDisabled = atMaxBooks || addBookPending;

  return (
    <div className="library-view">
      <button
        type="button"
        className="back-to-libraries"
        onClick={onBackToLibraries}
      >
        ← Back to libraries
      </button>
      <LibraryHeader name={library.name} />
      {addBookError && (
        <p className="form-error" role="alert">
          {addBookError.message}
        </p>
      )}
      <BookList
        books={library.books}
        onToggleAvailability={handleToggleAvailability}
        onRemove={requestRemove}
      />
      <AddBookForm onAdd={handleAddBook} disabled={addFormDisabled} />
      {confirmRemove !== null && (
        <ConfirmDialog
          title="Remove book?"
          message={`Remove "${confirmRemove}"?`}
          confirmLabel="Remove"
          onConfirm={() => handleRemoveBook(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  );
}
