use anchor_lang::prelude::*;

/// On-chain account that stores a user's library and its books.
#[account]
#[derive(InitSpace)]
pub struct Library {
    pub owner: Pubkey,

    #[max_len(60)]
    pub name: String,

    #[max_len(10)]
    pub books: Vec<Book>,
}

/// Data struct stored inside a Library's `books` vector (not a standalone account).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq, Debug)]
pub struct Book {
    #[max_len(60)]
    pub name: String,

    pub pages: u16,

    pub available: bool,
}
