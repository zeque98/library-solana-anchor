import type { Book } from '../types/library';
import { BookCard } from './BookCard';

interface BookListProps {
  books: Book[];
  onToggleAvailability: (name: string) => void;
  onRemove: (name: string) => void;
  /** When true, toggle and remove buttons are disabled (e.g. while a chain mutation is pending). */
  disabled?: boolean;
}

export function BookList({
  books,
  onToggleAvailability,
  onRemove,
  disabled = false,
}: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="book-list-empty">
        <p>No books yet.</p>
        <p className="book-list-empty-cta">Add your first book below.</p>
      </div>
    );
  }

  return (
    <ul className="book-list" aria-label="Books">
      {books.map((book) => (
        <li key={book.name}>
          <BookCard
            book={book}
            onToggleAvailability={onToggleAvailability}
            onRemove={onRemove}
            disabled={disabled}
          />
        </li>
      ))}
    </ul>
  );
}
