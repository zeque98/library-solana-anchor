use anchor_lang::prelude::*;

use crate::constants::LIBRARY_SEED;
use crate::error::Errors;
use crate::state::Library;

/// Accounts context for `create_library`.
#[derive(Accounts)]
pub struct NewLibrary<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Library::INIT_SPACE + 8,
        seeds = [LIBRARY_SEED, owner.key().as_ref()],
        bump
    )]
    pub library: Account<'info, Library>,

    pub system_program: Program<'info, System>,
}

/// Accounts context shared by all book-related instructions.
///
/// `has_one = owner` ensures `library.owner == owner.key()` at the framework
/// level, so individual instruction handlers no longer need a manual
/// `require!` for ownership.
///
/// `seeds` + `bump` re-derive the PDA and verify the caller passed the
/// correct Library account for this owner (defence in depth).
#[derive(Accounts)]
pub struct BookContext<'info> {
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [LIBRARY_SEED, owner.key().as_ref()],
        bump,
        has_one = owner @ Errors::NotOwner,
    )]
    pub library: Account<'info, Library>,
}
