use anchor_lang::prelude::*;

mod constants;
mod context;
mod error;
mod instructions;
mod state;

pub use constants::*;
pub use context::*;
pub use error::*;
pub use state::*;

declare_id!("97p8D5pjdWFcq25FcPgEEQaLvfk48HrYFuqZzihUCpto");

#[program]
pub mod library_program {
    use super::*;

    pub fn create_library(ctx: Context<NewLibrary>, name: String) -> Result<()> {
        instructions::create_library::create_library(ctx, name)
    }

    pub fn add_book(ctx: Context<BookContext>, name: String, pages: u16) -> Result<()> {
        instructions::add_book::add_book(ctx, name, pages)
    }

    pub fn remove_book(ctx: Context<BookContext>, name: String) -> Result<()> {
        instructions::remove_book::remove_book(ctx, name)
    }

    pub fn toggle_availability(ctx: Context<BookContext>, name: String) -> Result<()> {
        instructions::toggle_availability::toggle_availability(ctx, name)
    }
}
