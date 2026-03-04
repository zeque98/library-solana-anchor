/** Max length for library and book names (matches on-chain constraint). */
export const MAX_NAME_LEN = 60;

/** Max number of books per library (matches on-chain constraint). */
export const MAX_BOOKS = 10;

/** Valid range for book pages (u16). */
export const MIN_PAGES = 0;
export const MAX_PAGES = 65535;

export interface Book {
  name: string;
  pages: number;
  available: boolean;
}

export interface Library {
  name: string;
  books: Book[];
}
