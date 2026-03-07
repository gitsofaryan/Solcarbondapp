use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};

declare_id!("Carbon1111111111111111111111111111111111111");

#[program]
pub mod sol_carbon {
    use super::*;

    pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<()> {
        msg!("SolCarbon: Protocol Initialized");
        Ok(())
    }

    pub fn buy_credits(ctx: Context<BuyCredits>, amount: u64) -> Result<()> {
        let seeds = &[
            b"treasury".as_ref(),
            &[*ctx.bumps.get("treasury").unwrap()],
        ];
        let signer = &[&seeds[..]];

        // In a real Anchor program, we would:
        // 1. Transfer SOL from user to treasury PDA
        // 2. Mint CC tokens from Mint to User's ATA
        
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.treasury.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::mint_to(cpi_ctx, amount)?;
        
        msg!("SolCarbon: {} credits minted to user", amount);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeMint<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyCredits<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: This is the treasury PDA that holds authority
    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: AccountInfo<'info>,
    
    #[account(mut)]
    pub mint: Account( 'info, Mint),
    
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}
