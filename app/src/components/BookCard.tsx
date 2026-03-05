import type { Book } from '../types/library';

interface BookCardProps {
  book: Book;
  onToggleAvailability: (name: string) => void;
  onRemove: (name: string) => void;
  disabled?: boolean;
}

export function BookCard({
  book,
  onToggleAvailability,
  onRemove,
  disabled = false,
}: BookCardProps) {
  return (
    <article className="book-card">
      <div className="book-card-main">
        <h3 className="book-title">{book.name}</h3>
        <p className="book-pages">{book.pages} pages</p>
        <span
          className={`availability-badge ${book.available ? 'available' : 'unavailable'}`}
          aria-label={book.available ? 'Available' : 'Unavailable'}
        >
          {book.available ? 'Available' : 'Unavailable'}
        </span>
      </div>
      <div className="book-card-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => onToggleAvailability(book.name)}
          disabled={disabled}
        >
          Toggle availability
        </button>
        <button
          type="button"
          className="btn-danger"
          onClick={() => onRemove(book.name)}
          disabled={disabled}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
