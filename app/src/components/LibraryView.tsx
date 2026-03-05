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
  /** When provided, remove book is sent on-chain and library is refetched by the parent. */
  onRemoveBookChain?: (name: string) => void | Promise<void>;
  removeBookPending?: boolean;
  removeBookError?: Error | null;
  /** When provided, toggle availability is sent on-chain and library is refetched by the parent. */
  onToggleAvailabilityChain?: (name: string) => void | Promise<void>;
  toggleAvailabilityPending?: boolean;
  toggleAvailabilityError?: Error | null;
}

export function LibraryView({
  library,
  onLibraryChange,
  onBackToLibraries,
  onAddBookChain,
  addBookPending = false,
  addBookError = null,
  onRemoveBookChain,
  removeBookPending = false,
  removeBookError = null,
  onToggleAvailabilityChain,
  toggleAvailabilityPending = false,
  toggleAvailabilityError = null,
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
      if (onRemoveBookChain) {
        onRemoveBookChain(name);
        setConfirmRemove(null);
        return;
      }
      onLibraryChange({
        ...library,
        books: library.books.filter((b) => b.name !== name),
      });
      setConfirmRemove(null);
    },
    [library, onLibraryChange, onRemoveBookChain],
  );

  const handleToggleAvailability = useCallback(
    (name: string) => {
      if (onToggleAvailabilityChain) {
        onToggleAvailabilityChain(name);
        return;
      }
      onLibraryChange({
        ...library,
        books: library.books.map((b) =>
          b.name === name ? { ...b, available: !b.available } : b
        ),
      });
    },
    [library, onLibraryChange, onToggleAvailabilityChain],
  );

  const requestRemove = useCallback((name: string) => setConfirmRemove(name), []);

  const atMaxBooks = library.books.length >= MAX_BOOKS;
  const addFormDisabled = atMaxBooks || addBookPending;
  const chainMutationPending =
    addBookPending || removeBookPending || toggleAvailabilityPending;
  const chainError = addBookError ?? removeBookError ?? toggleAvailabilityError;

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
      {chainError && (
        <p className="form-error" role="alert">
          {chainError.message}
        </p>
      )}
      <BookList
        books={library.books}
        onToggleAvailability={handleToggleAvailability}
        onRemove={requestRemove}
        disabled={chainMutationPending}
      />
      <AddBookForm onAdd={handleAddBook} disabled={addFormDisabled} />
      {confirmRemove !== null && (
        <ConfirmDialog
          title="Remove book?"
          message={`Remove "${confirmRemove}"?`}
          confirmLabel="Remove"
          onConfirm={() => handleRemoveBook(confirmRemove)}
          onCancel={() => setConfirmRemove(null)}
          confirmDisabled={removeBookPending}
        />
      )}
    </div>
  );
}
