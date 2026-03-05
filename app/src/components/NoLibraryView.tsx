import { CreateLibraryForm } from './CreateLibraryForm';
import type { Library } from '../types/library';

interface NoLibraryViewProps {
  onCreateLibrary: (library: Library) => void | Promise<void>;
  isChainMode?: boolean;
  isPending?: boolean;
  chainError?: Error | null;
}

export function NoLibraryView({
  onCreateLibrary,
  isChainMode = false,
  isPending = false,
  chainError = null,
}: NoLibraryViewProps) {
  return (
    <CreateLibraryForm
      onSubmit={onCreateLibrary}
      intro={isChainMode ? 'Create your library on chain.' : 'Create your first library to get started.'}
      isPending={isPending}
      submitError={chainError}
    />
  );
}
