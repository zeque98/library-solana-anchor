use anchor_lang::prelude::*;

use crate::context::NewLibrary;
use crate::state::{Book, Library};

pub fn create_library(ctx: Context<NewLibrary>, name: String) -> Result<()> {
    let owner_id = ctx.accounts.owner.key();
    msg!("Owner id: {}", owner_id);

    ctx.accounts.library.set_inner(Library {
        owner: owner_id,
        name,
        books: Vec::<Book>::new(),
    });

    Ok(())
}
