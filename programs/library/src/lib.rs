use anchor_lang::prelude::*;

declare_id!("AsZk6fFrrsYFpoZxCaAW1JGn9wHLVtnXvxh6feCZzUCf");

#[program]
pub mod library {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
