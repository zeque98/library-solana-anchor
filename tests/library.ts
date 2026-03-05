import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { LibraryProgram } from '../target/types/library_program';
import { PublicKey } from '@solana/web3.js';

describe('library_program', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Program typed from the generated IDL
  const program = anchor.workspace.library_program as Program<LibraryProgram>;

  // Re-use the same PDA across tests so on-chain state flows between them.
  const owner = provider.wallet.publicKey;
  const [libraryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('library'), owner.toBuffer()],
    program.programId,
  );

  it('creates a library', async () => {
    await program.methods
      .createLibrary('My Test Library')
      .accounts({
        owner,
        // `library` PDA + `systemProgram` are auto-resolved from the IDL.
      })
      .rpc();

    const library = await program.account.library.fetch(libraryPda);
    console.log('After create:', library);

    if (library.name !== 'My Test Library') {
      throw new Error('Library name does not match');
    }
    if (library.books.length !== 0) {
      throw new Error('New library should have no books');
    }
  });

  it('adds a book', async () => {
    await program.methods
      .addBook('The Rust Book', 500)
      .accounts({
        owner,
        library: libraryPda,
      })
      .rpc();

    const library = await program.account.library.fetch(libraryPda);
    console.log('After add:', library);

    if (library.books.length !== 1) {
      throw new Error('Expected exactly one book');
    }
    const book = library.books[0];
    if (
      book.name !== 'The Rust Book' ||
      book.pages !== 500 ||
      !book.available
    ) {
      throw new Error('Book fields are incorrect after add');
    }
  });

  it('toggles book availability', async () => {
    // First toggle: should go from true -> false
    await program.methods
      .toggleAvailability('The Rust Book')
      .accounts({
        owner,
        library: libraryPda,
      })
      .rpc();

    let library = await program.account.library.fetch(libraryPda);
    console.log('After first toggle:', library);
    if (library.books[0].available !== false) {
      throw new Error('Expected book to become unavailable after first toggle');
    }

    // Second toggle: false -> true
    await program.methods
      .toggleAvailability('The Rust Book')
      .accounts({
        owner,
        library: libraryPda,
      })
      .rpc();

    library = await program.account.library.fetch(libraryPda);
    console.log('After second toggle:', library);
    if (library.books[0].available !== true) {
      throw new Error('Expected book to become available after second toggle');
    }
  });

  it('deletes a book', async () => {
    await program.methods
      .removeBook('The Rust Book')
      .accounts({
        owner,
        library: libraryPda,
      })
      .rpc();

    const library = await program.account.library.fetch(libraryPda);
    console.log('After delete:', library);

    if (library.books.length !== 0) {
      throw new Error('Expected no books after delete');
    }
  });

  it('fails when deleting a non-existent book', async () => {
    let threw = false;
    try {
      await program.methods
        .removeBook('Nonexistent Book')
        .accounts({
          owner,
          library: libraryPda,
        })
        .rpc();
    } catch (err: any) {
      threw = true;
      console.log(
        'Expected error when deleting non-existent book:',
        err.toString(),
      );
    }
    if (!threw) {
      throw new Error('Expected removeBook to fail for non-existent book');
    }
  });
});
