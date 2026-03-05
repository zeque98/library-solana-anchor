use anchor_lang::prelude::*;

use crate::context::BookContext;
use crate::state::Book;

pub fn add_book(ctx: Context<BookContext>, name: String, pages: u16) -> Result<()> {
    let book = Book {
        name,
        pages,
        available: true,
    };

    ctx.accounts.library.books.push(book);

    Ok(())
}
