import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  MAX_NAME_LEN,
  MAX_BOOKS,
  MAX_PAGES,
  MIN_PAGES,
} from '../types/library';

interface AddBookFormProps {
  onAdd: (name: string, pages: number) => void;
  disabled?: boolean;
}

export function AddBookForm({ onAdd, disabled = false }: AddBookFormProps) {
  const [name, setName] = useState('');
  const [pagesInput, setPagesInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Book name is required.');
      return;
    }
    if (trimmed.length > MAX_NAME_LEN) {
      setError(`Name must be at most ${MAX_NAME_LEN} characters.`);
      return;
    }
    const pages = parseInt(pagesInput, 10);
    if (Number.isNaN(pages) || pages < MIN_PAGES || pages > MAX_PAGES) {
      setError(`Pages must be between ${MIN_PAGES} and ${MAX_PAGES}.`);
      return;
    }
    onAdd(trimmed, pages);
    setName('');
    setPagesInput('');
  };

  return (
    <section className="add-book-section" aria-labelledby="add-book-heading">
      <h2 id="add-book-heading">Add book</h2>
      {disabled && (
        <p className="add-book-max-msg" role="status">
          Maximum number of books ({MAX_BOOKS}) reached.
        </p>
      )}
      <form className="add-book-form" onSubmit={handleSubmit}>
        <label htmlFor="book-name">Book name</label>
        <input
          id="book-name"
          type="text"
          placeholder="Book title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LEN}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? 'add-book-error' : undefined}
        />
        <span className="char-count" aria-hidden="true">
          {name.length}/{MAX_NAME_LEN}
        </span>
        <label htmlFor="book-pages">Pages</label>
        <input
          id="book-pages"
          type="number"
          min={MIN_PAGES}
          max={MAX_PAGES}
          placeholder="0"
          value={pagesInput}
          onChange={(e) => setPagesInput(e.target.value)}
          disabled={disabled}
        />
        {error && (
          <p id="add-book-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={disabled}>
          Add book
        </button>
      </form>
    </section>
  );
}
