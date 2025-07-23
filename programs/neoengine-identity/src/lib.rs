use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, MintTo, mint_to, FreezeAccount, freeze_account},
    associated_token::AssociatedToken,
};

declare_id!("Ao3kUW9s6cQQNEfANM1XAzPYf2EEaCVURzgPGVxFc1eL");

#[program]
pub mod neoengine_identity {
    use super::*;

    /// Create a soulbound username token
    pub fn create_username(
        ctx: Context<CreateUsername>, 
        username: String
    ) -> Result<()> {
        // Validate username
        require!(username.len() >= 3, ErrorCode::UsernameTooShort);
        require!(username.len() <= 20, ErrorCode::UsernameTooLong);

        let username_account = &mut ctx.accounts.username_account;
        let clock = Clock::get()?;

        // Store the bump before borrowing
        let bump = ctx.bumps.username_account;

        // Initialize username account
        username_account.owner = ctx.accounts.user.key();
        username_account.username = username.clone();
        username_account.mint = ctx.accounts.mint.key();
        username_account.created_at = clock.unix_timestamp;
        username_account.bump = bump;

        // Mint 1 token to user
        let mint_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.username_account.to_account_info(),
            },
        );

        let username_seeds = &[
            b"username",
            username.as_bytes(),
            &[bump],
        ];
        let signer_seeds = &[&username_seeds[..]];

        mint_to(mint_ctx.with_signer(signer_seeds), 1)?;

        // Freeze the token account to make it soulbound
        let freeze_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            FreezeAccount {
                account: ctx.accounts.token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                authority: ctx.accounts.username_account.to_account_info(),
            },
        );

        freeze_account(freeze_ctx.with_signer(signer_seeds))?;

        emit!(UsernameCreated {
            owner: ctx.accounts.user.key(),
            username: username.clone(),
            mint: ctx.accounts.mint.key(),
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Get username info
    pub fn get_username_info(ctx: Context<GetUsernameInfo>) -> Result<UsernameInfo> {
        let username_account = &ctx.accounts.username_account;
        
        Ok(UsernameInfo {
            owner: username_account.owner,
            username: username_account.username.clone(),
            created_at: username_account.created_at,
        })
    }
}

// ============================================================================
// Account Structs
// ============================================================================

#[account]
pub struct UsernameAccount {
    pub owner: Pubkey,        // 32 bytes
    pub username: String,     // 4 + max 20 bytes = 24 bytes
    pub mint: Pubkey,         // 32 bytes
    pub created_at: i64,      // 8 bytes
    pub bump: u8,             // 1 byte
}

impl UsernameAccount {
    pub const MAX_SIZE: usize = 32 + 24 + 32 + 8 + 1 + 50; // 147 bytes with buffer
}

// ============================================================================
// Context Structs
// ============================================================================

#[derive(Accounts)]
#[instruction(username: String)]
pub struct CreateUsername<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + UsernameAccount::MAX_SIZE,
        seeds = [b"username", username.as_bytes()],
        bump,
    )]
    pub username_account: Account<'info, UsernameAccount>,

    #[account(
        init,
        payer = user,
        mint::decimals = 0,
        mint::authority = username_account,
        mint::freeze_authority = username_account,
        seeds = [b"mint", username.as_bytes()],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user,
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(username: String)]
pub struct GetUsernameInfo<'info> {
    #[account(
        seeds = [b"username", username.as_bytes()],
        bump = username_account.bump
    )]
    pub username_account: Account<'info, UsernameAccount>,
}

// ============================================================================
// Return Types
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UsernameInfo {
    pub owner: Pubkey,
    pub username: String,
    pub created_at: i64,
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct UsernameCreated {
    pub owner: Pubkey,
    pub username: String,
    pub mint: Pubkey,
    pub timestamp: i64,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Username already exists")]
    UsernameAlreadyExists,
    #[msg("Username too short (minimum 3 characters)")]
    UsernameTooShort,
    #[msg("Username too long (maximum 20 characters)")]
    UsernameTooLong,
    #[msg("Invalid username format")]
    InvalidUsernameFormat,
}