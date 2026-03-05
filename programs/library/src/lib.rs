use anchor_lang::prelude::*;

declare_id!("97p8D5pjdWFcq25FcPgEEQaLvfk48HrYFuqZzihUCpto");

/// Program module that exposes the on-chain instructions.
#[program]
pub mod library_program {
    use super::*;

    //////////////////////////// Instruction: create_library ////////////////////////////
    /*
        Creates a Library PDA (Program Derived Address), a special Solana account
        that does not require a private key to sign transactions.

        This account will contain a `Library` struct, which stores a collection
        of `Book`s.

        The PDA is derived from three things:
          * the wallet address (owner)
          * the program ID
          * a seed string, usually related to the project name

        The detailed account configuration is described in the `NewLibrary`
        context.

        Parameters:
          * name -> library name (string)
    */
    pub fn create_library(context: Context<NewLibrary>, name: String) -> Result<()> {
        // `Context` is almost always the first parameter and gives access to the
        // accounts this instruction will read or modify.
        let owner_id = context.accounts.owner.key();
        msg!("Owner id: {}", owner_id);

        // Start with an empty list of books.
        let books: Vec<Book> = Vec::new();

        // Initialize the `Library` account in-place.
        context.accounts.library.set_inner(Library {
            owner: owner_id,
            name,
            books,
        });

        Ok(())
    }

    //////////////////////////// Instruction: add_book ////////////////////////////
    /*
        Adds a new book to the `books` vector stored inside the `Library` account.

        This instruction uses the `BookContext` accounts. While `NewLibrary`
        is used to create the library PDA, `BookContext` is reused for any
        instruction that creates or modifies `Book` entries.

        Parameters:
          * name   -> book title (string)
          * pages  -> number of pages (u16)
    */
    pub fn add_book(context: Context<BookContext>, name: String, pages: u16) -> Result<()> {
        // Security check: only the owner of the library can modify it.
        require!(
            context.accounts.library.owner == context.accounts.owner.key(),
            Errors::NotOwner
        );

        let book = Book {
            name,
            pages,
            available: true,
        };

        context.accounts.library.books.push(book);

        Ok(())
    }

    //////////////////////////// Instruction: remove_book ////////////////////////////
    /*
        Removes a book by its name.

        Fails if:
          * the caller is not the owner, or
          * the book does not exist in the vector.

        Parameters:
          * name -> book title (string)
    */
    pub fn remove_book(context: Context<BookContext>, name: String) -> Result<()> {
        // Security check: only the owner can delete books.
        require!(
            context.accounts.library.owner == context.accounts.owner.key(),
            Errors::NotOwner
        );

        // Mutable reference to the list of books in the library.
        let books = &mut context.accounts.library.books;

        // Iterate by index to find and remove the matching book.
        for i in 0..books.len() {
            if books[i].name == name {
                books.remove(i);
                msg!("Book {} removed!", name);
                return Ok(());
            }
        }

        // Book was never found.
        Err(Errors::BookDoesNotExist.into())
    }

    //////////////////////////// Instruction: view_books ////////////////////////////
    /*
        Logs the full contents of the library's book list.

        Parameters:
          * none
    */
    pub fn view_books(context: Context<BookContext>) -> Result<()> {
        // Security check: only the owner can read the library contents in this example.
        require!(
            context.accounts.library.owner == context.accounts.owner.key(),
            Errors::NotOwner
        );

        // `:#?` requires `Debug` on `Book` and prints the full vector nicely.
        msg!(
            "The current list of books is: {:#?}",
            context.accounts.library.books
        );

        Ok(())
    }

    //////////////////////////// Instruction: toggle_availability ////////////////////////////
    /*
        Toggles the `available` flag of a book:
          * `true`  -> `false`
          * `false` -> `true`

        Parameters:
          * name -> book title (string)
    */
    pub fn toggle_availability(context: Context<BookContext>, name: String) -> Result<()> {
        // Security check: only the owner can update availability.
        require!(
            context.accounts.library.owner == context.accounts.owner.key(),
            Errors::NotOwner
        );

        let books = &mut context.accounts.library.books;

        // Iterate through all books and flip the flag for the matching one.
        for i in 0..books.len() {
            let current = books[i].available;

            if books[i].name == name {
                let new_state = !current;
                books[i].available = new_state;
                msg!(
                    "Book {} now has availability: {}",
                    name,
                    new_state
                );
                return Ok(());
            }
        }

        Err(Errors::BookDoesNotExist.into())
    }
}

/*
    Error codes.

    All codes are stored in an enum with the following structure:
      * #[msg("ERROR MESSAGE")]
      * ErrorName, (in CamelCase)
*/
#[error_code]
pub enum Errors {
    #[msg("You are not the owner of the library you are trying to modify")]
    NotOwner,
    #[msg("The book you are trying to interact with does not exist")]
    BookDoesNotExist,
}

/// On-chain account that stores a user's library and its books.
#[account]
#[derive(InitSpace)]
pub struct Library {
    /// Owner of this library; pays for account creation and owns all updates.
    owner: Pubkey,

    /// Name of the library (max 60 UTF‑8 chars).
    #[max_len(60)]
    name: String,

    /// Fixed-capacity collection of books held in this library.
    #[max_len(10)]
    books: Vec<Book>,
}

/*
    Internal/secondary struct (not an account). It is defined via `derive` and
    uses the following traits:
      * AnchorSerialize -> allows saving the struct into an account.
      * AnchorDeserialize -> allows reading its contents from an account.
      * Clone -> to copy its values.
      * InitSpace -> calculates the size required to be stored on-chain.
      * PartialEq -> to compare values using "==".
      * Debug -> to show it in logs with "{:?}" or "{:#?}".
*/
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub struct Book {
    /// Book title (max 60 UTF‑8 chars).
    #[max_len(60)]
    name: String,

    /// Number of pages in the book (16-bit unsigned integer).
    pages: u16,

    /// Whether the book is currently available.
    available: bool,
}

// Account contexts for the instructions (functions).

/// Accounts context for `create_library`.
#[derive(Accounts)]
pub struct NewLibrary<'info> {
    /// Transaction payer and library owner; mutable because its lamports change.
    #[account(mut)]
    pub owner: Signer<'info>,

    /*
        PDA that will hold the `Library` data.
        Constraints:
            * `init` -> create the account if it does not exist.
            * `payer = owner` -> `owner` funds the account creation.
            * `space` -> bytes required for `Library` plus the 8-byte
            Anchor discriminator.
            * `seeds` -> derive PDA from "library" and the owner's public key.
            * `bump` -> PDA bump seed automatically found by Anchor.
    */
    #[account(
        init,
        payer = owner,
        space = Library::INIT_SPACE + 8,
        seeds = [b"library", owner.key().as_ref()],
        bump
    )]
    pub library: Account<'info, Library>,

    /// System program required to create new accounts.
    pub system_program: Program<'info, System>,
}

/// Accounts context shared by all instructions that create or modify books.
#[derive(Accounts)]
pub struct BookContext<'info> {
    /// Owner of the library; must sign book-related operations.
    pub owner: Signer<'info>,

    /// Library account whose `books` vector will be read or modified.
    #[account(mut)]
    pub library: Account<'info, Library>,
}
