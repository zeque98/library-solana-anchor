import { useState } from 'react';
import type { Library } from './types/library';
import { NoLibraryView } from './components/NoLibraryView';
import { LibrariesListView } from './components/LibrariesListView';
import { LibraryView } from './components/LibraryView';
import './App.css';

function App() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleCreateFirstLibrary = (library: Library) => {
    setLibraries([library]);
    setSelectedIndex(0);
  };

  const handleCreateLibrary = (library: Library) => {
    setLibraries((prev) => [...prev, library]);
    setSelectedIndex(libraries.length);
  };

  const handleLibraryChange = (library: Library) => {
    if (selectedIndex === null) return;
    setLibraries((prev) => {
      const next = [...prev];
      next[selectedIndex] = library;
      return next;
    });
  };

  const selectedLibrary = selectedIndex !== null ? libraries[selectedIndex] : null;

  return (
    <div className="app">
      {libraries.length === 0 ? (
        <NoLibraryView onCreateLibrary={handleCreateFirstLibrary} />
      ) : selectedIndex !== null && selectedLibrary ? (
        <LibraryView
          library={selectedLibrary}
          onLibraryChange={handleLibraryChange}
          onBackToLibraries={() => setSelectedIndex(null)}
        />
      ) : (
        <LibrariesListView
          libraries={libraries}
          onSelectLibrary={setSelectedIndex}
          onCreateLibrary={handleCreateLibrary}
        />
      )}
    </div>
  );
}

export default App;
