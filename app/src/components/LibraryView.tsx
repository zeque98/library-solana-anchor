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
}

export function LibraryView({ library, onLibraryChange, onBackToLibraries }: LibraryViewProps) {
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleAddBook = useCallback(
    (name: string, pages: number) => {
      onLibraryChange({
        ...library,
        books: [...library.books, { name, pages, available: true }],
      });
    },
    [library, onLibraryChange]
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
      <BookList
        books={library.books}
        onToggleAvailability={handleToggleAvailability}
        onRemove={requestRemove}
      />
      <AddBookForm onAdd={handleAddBook} disabled={atMaxBooks} />
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
