use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {
    #[msg("You are not the owner of the library you are trying to modify")]
    NotOwner,
    #[msg("The book you are trying to interact with does not exist")]
    BookDoesNotExist,
}
