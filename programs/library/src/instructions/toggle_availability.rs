use anchor_lang::prelude::*;

use crate::context::BookContext;
use crate::error::Errors;

pub fn toggle_availability(ctx: Context<BookContext>, name: String) -> Result<()> {
    let books = &mut ctx.accounts.library.books;

    for i in 0..books.len() {
        if books[i].name == name {
            let new_state = !books[i].available;
            books[i].available = new_state;
            msg!("Book {} now has availability: {}", name, new_state);
            return Ok(());
        }
    }

    Err(Errors::BookDoesNotExist.into())
}
