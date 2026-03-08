use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer as system_transfer, Transfer as SystemTransfer};
use anchor_spl::token::{self, Burn, Mint, MintTo, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("CUmu7iSDj5RavATJnm2Xsrvkjo7iqAb7MeT3GVsgmg7o");

const CC_DECIMALS_FACTOR: u64 = 100;

#[program]
pub mod sol_carbon {
    use super::*;

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        let treasury_state = &mut ctx.accounts.treasury_state;
        treasury_state.admin = ctx.accounts.admin.key();
        treasury_state.mint = ctx.accounts.mint.key();
        treasury_state.bump = ctx.bumps.treasury_state;
        msg!("SolCarbon: Protocol Initialized");
        Ok(())
    }

    pub fn buy_credits(
        ctx: Context<BuyCredits>,
        amount_base_units: u64,
        price_per_cc_lamports: u64,
    ) -> Result<()> {
        require!(amount_base_units > 0, CarbonError::InvalidAmount);
        let total_lamports = amount_base_units
            .checked_mul(price_per_cc_lamports)
            .ok_or(CarbonError::MathOverflow)?
            .checked_div(CC_DECIMALS_FACTOR)
            .ok_or(CarbonError::MathOverflow)?;

        // 1. Transfer SOL from user to Treasury PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            SystemTransfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.treasury_state.to_account_info(),
            },
        );
        system_transfer(cpi_context, total_lamports)?;

        // 2. Mint CC tokens from Mint to User's ATA
        let mint_key = ctx.accounts.mint.key();
        let seeds = &[
            b"treasury".as_ref(),
            mint_key.as_ref(),
            &[ctx.accounts.treasury_state.bump],
        ];
        let signer = &[&seeds[..]];

        // `amount_base_units` is already in token base units (2 decimals).
        let mint_amount = amount_base_units;

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.treasury_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::mint_to(cpi_ctx, mint_amount)?;

        msg!(
            "SolCarbon: minted {} base units, {} lamports paid",
            amount_base_units,
            total_lamports
        );
        Ok(())
    }

    pub fn sell_credits(
        ctx: Context<SellCredits>,
        amount_base_units: u64,
        price_per_cc_lamports: u64,
    ) -> Result<()> {
        require!(amount_base_units > 0, CarbonError::InvalidAmount);
        let transfer_amount = amount_base_units;

        // 1. Transfer CC from User to Treasury ATA
        let cpi_accounts = SplTransfer {
            from: ctx.accounts.user_ata.to_account_info(),
            to: ctx.accounts.treasury_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, transfer_amount)?;

        // 2. Return SOL from Treasury PDA to User
        let total_lamports = amount_base_units
            .checked_mul(price_per_cc_lamports)
            .ok_or(CarbonError::MathOverflow)?
            .checked_div(CC_DECIMALS_FACTOR)
            .ok_or(CarbonError::MathOverflow)?;
        let treasury_balance = ctx.accounts.treasury_state.to_account_info().lamports();
        require!(
            treasury_balance >= total_lamports,
            CarbonError::InsufficientTreasuryFunds
        );

        **ctx
            .accounts
            .treasury_state
            .to_account_info()
            .try_borrow_mut_lamports()? -= total_lamports;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? += total_lamports;

        msg!(
            "SolCarbon: sold {} base units for {} lamports",
            amount_base_units,
            total_lamports
        );
        Ok(())
    }

    pub fn retire_credits(ctx: Context<RetireCredits>, amount_base_units: u64) -> Result<()> {
        require!(amount_base_units > 0, CarbonError::InvalidAmount);
        let burn_amount = amount_base_units;

        let cpi_accounts = Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, burn_amount)?;

        msg!("SolCarbon: {} base units retired/burned", amount_base_units);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 1,
        seeds = [b"treasury", mint.key().as_ref()],
        bump
    )]
    pub treasury_state: Account<'info, TreasuryState>,

    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyCredits<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump = treasury_state.bump,
        has_one = mint
    )]
    pub treasury_state: Account<'info, TreasuryState>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_ata.mint == mint.key(),
        constraint = user_ata.owner == user.key()
    )]
    pub user_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellCredits<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"treasury", mint.key().as_ref()],
        bump = treasury_state.bump,
        has_one = mint
    )]
    pub treasury_state: Account<'info, TreasuryState>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_ata.mint == mint.key(),
        constraint = user_ata.owner == user.key()
    )]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_ata.mint == mint.key(),
        constraint = treasury_ata.owner == treasury_state.key()
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RetireCredits<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_ata.mint == mint.key(),
        constraint = user_ata.owner == user.key()
    )]
    pub user_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
pub struct TreasuryState {
    pub admin: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
}

#[error_code]
pub enum CarbonError {
    #[msg("Not enough SOL in the treasury to process this sell.")]
    InsufficientTreasuryFunds,
    #[msg("Amount must be greater than 0.")]
    InvalidAmount,
    #[msg("Math overflow during amount conversion.")]
    MathOverflow,
}
