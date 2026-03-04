interface LibraryHeaderProps {
  name: string;
}

export function LibraryHeader({ name }: LibraryHeaderProps) {
  return (
    <header className="library-header">
      <h1 className="library-title">{name}</h1>
      <p className="library-subtitle">My Library</p>
    </header>
  );
}
