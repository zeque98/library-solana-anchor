use anchor_lang::prelude::*;

use crate::context::BookContext;
use crate::error::Errors;

pub fn remove_book(ctx: Context<BookContext>, name: String) -> Result<()> {
    let books = &mut ctx.accounts.library.books;

    for i in 0..books.len() {
        if books[i].name == name {
            books.remove(i);
            msg!("Book {} removed!", name);
            return Ok(());
        }
    }

    Err(Errors::BookDoesNotExist.into())
}
