import { useState } from 'react';
import type { Library } from '../types/library';
import { CreateLibraryForm } from './CreateLibraryForm';

interface LibrariesListViewProps {
  libraries: Library[];
  onSelectLibrary: (index: number) => void;
  onCreateLibrary: (library: Library) => void;
}

export function LibrariesListView({
  libraries,
  onSelectLibrary,
  onCreateLibrary,
}: LibrariesListViewProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateSubmit = (library: Library) => {
    onCreateLibrary(library);
    setShowCreateForm(false);
  };

  return (
    <div className="libraries-list-view">
      <h1 className="libraries-list-title">Libraries</h1>
      <ul className="libraries-list" aria-label="Libraries">
        {libraries.map((lib, index) => (
          <li key={`${lib.name}-${index}`}>
            <button
              type="button"
              className="library-list-item"
              onClick={() => onSelectLibrary(index)}
            >
              <span className="library-list-item-name">{lib.name}</span>
              <span className="library-list-item-count">
                {lib.books.length} book{lib.books.length !== 1 ? 's' : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {showCreateForm ? (
        <div className="libraries-list-create">
          <h2>Add a new library</h2>
          <CreateLibraryForm
            onSubmit={handleCreateSubmit}
            intro="Enter a name for your new library."
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowCreateForm(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="btn-create-library"
          onClick={() => setShowCreateForm(true)}
        >
          Create library
        </button>
      )}
    </div>
  );
}
