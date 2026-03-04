import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Library } from '../types/library';
import { MAX_NAME_LEN } from '../types/library';

interface CreateLibraryFormProps {
  onSubmit: (library: Library) => void;
  /** Optional intro text above the form (e.g. for "Add a new library" flow). */
  intro?: string;
}

export function CreateLibraryForm({ onSubmit, intro }: CreateLibraryFormProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Library name is required.');
      return;
    }
    if (trimmed.length > MAX_NAME_LEN) {
      setError(`Name must be at most ${MAX_NAME_LEN} characters.`);
      return;
    }
    onSubmit({ name: trimmed, books: [] });
  };

  return (
    <div className="no-library-view">
      {intro && <p className="no-library-intro">{intro}</p>}
      <form className="create-library-form" onSubmit={handleSubmit}>
        <label htmlFor="library-name">Library name</label>
        <input
          id="library-name"
          type="text"
          placeholder="My Library"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={MAX_NAME_LEN}
          aria-invalid={!!error}
          aria-describedby={error ? 'library-name-error' : undefined}
        />
        <span className="char-count" aria-hidden="true">
          {name.length}/{MAX_NAME_LEN}
        </span>
        {error && (
          <p id="library-name-error" className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit">Create library</button>
      </form>
    </div>
  );
}
