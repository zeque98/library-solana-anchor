import { CreateLibraryForm } from './CreateLibraryForm';
import type { Library } from '../types/library';

interface NoLibraryViewProps {
  onCreateLibrary: (library: Library) => void;
}

export function NoLibraryView({ onCreateLibrary }: NoLibraryViewProps) {
  return (
    <CreateLibraryForm
      onSubmit={onCreateLibrary}
      intro="Create your first library to get started."
    />
  );
}
