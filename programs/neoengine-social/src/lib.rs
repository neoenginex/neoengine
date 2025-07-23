use anchor_lang::prelude::*;
use anchor_spl::{
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

declare_id!("55555555555555555555555555555556");

#[program]
pub mod dsx_scoring {
    use super::*;

    /// Initialize the $DSX scoring system
    pub fn initialize_scoring(ctx: Context<InitializeScoring>) -> Result<()> {
        let scoring_config = &mut ctx.accounts.scoring_config;
        scoring_config.authority = ctx.accounts.authority.key();
        scoring_config.dsx_mint = ctx.accounts.dsx_mint.key();
        scoring_config.total_distributed = 0;
        scoring_config.daily_limit = 1000 * 10_u64.pow(9); // 1000 DSX per day max
        
        Ok(())
    }

    /// Initialize a user's scoring account
    pub fn initialize_user_scoring(ctx: Context<InitializeUserScoring>) -> Result<()> {
        let user_scoring = &mut ctx.accounts.user_scoring;
        user_scoring.user = ctx.accounts.user.key();
        user_scoring.total_earned = 0;
        user_scoring.last_daily_contribution = 0;
        user_scoring.referral_count = 0;
        user_scoring.content_score = 0;
        user_scoring.community_participation = 0;

        Ok(())
    }

    /// Reward daily contribution to the network
    pub fn reward_daily_contribution(ctx: Context<RewardUser>) -> Result<()> {
        let user_scoring = &mut ctx.accounts.user_scoring;
        let current_day = Clock::get()?.unix_timestamp / 86400; // Days since epoch

        // Check if user already contributed today
        if user_scoring.last_daily_contribution == current_day {
            return Err(DsxError::AlreadyContributedToday.into());
        }

        let reward_amount = 50 * 10_u64.pow(9); // 50 DSX
        
        // Mint DSX tokens to user
        mint_dsx_tokens(ctx, reward_amount)?;
        
        user_scoring.last_daily_contribution = current_day;
        user_scoring.total_earned += reward_amount;

        emit!(RewardEvent {
            user: ctx.accounts.user.key(),
            reward_type: RewardType::DailyContribution,
            amount: reward_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Reward successful referral
    pub fn reward_referral(ctx: Context<RewardUser>, _referred_user: Pubkey) -> Result<()> {
        let user_scoring = &mut ctx.accounts.user_scoring;
        
        let reward_amount = 100 * 10_u64.pow(9); // 100 DSX per referral
        
        // Mint DSX tokens to user
        mint_dsx_tokens(ctx, reward_amount)?;
        
        user_scoring.referral_count += 1;
        user_scoring.total_earned += reward_amount;

        emit!(RewardEvent {
            user: ctx.accounts.user.key(),
            reward_type: RewardType::Referral,
            amount: reward_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Reward content creation (likes, upvotes, etc.)
    pub fn reward_content_engagement(
        ctx: Context<RewardUser>,
        engagement_score: u64,
    ) -> Result<()> {
        let user_scoring = &mut ctx.accounts.user_scoring;
        
        // Calculate reward based on engagement (1 DSX per engagement point, max 25 DSX)
        let reward_amount = std::cmp::min(engagement_score * 10_u64.pow(9), 25 * 10_u64.pow(9));
        
        if reward_amount == 0 {
            return Err(DsxError::NoRewardEarned.into());
        }

        // Mint DSX tokens to user
        mint_dsx_tokens(ctx, reward_amount)?;
        
        user_scoring.content_score += engagement_score;
        user_scoring.total_earned += reward_amount;

        emit!(RewardEvent {
            user: ctx.accounts.user.key(),
            reward_type: RewardType::ContentEngagement,
            amount: reward_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Reward community participation (events, quests, etc.)
    pub fn reward_community_participation(
        ctx: Context<RewardUser>,
        participation_points: u64,
    ) -> Result<()> {
        let user_scoring = &mut ctx.accounts.user_scoring;
        
        let reward_amount = participation_points * 10 * 10_u64.pow(9); // 10 DSX per point
        
        // Mint DSX tokens to user
        mint_dsx_tokens(ctx, reward_amount)?;
        
        user_scoring.community_participation += participation_points;
        user_scoring.total_earned += reward_amount;

        emit!(RewardEvent {
            user: ctx.accounts.user.key(),
            reward_type: RewardType::CommunityParticipation,
            amount: reward_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Calculate and update user's reputation score
    pub fn update_reputation_score(ctx: Context<UpdateReputationScore>) -> Result<()> {
        let user_scoring = &ctx.accounts.user_scoring;
        
        // Calculate weighted reputation score
        let reputation = calculate_reputation_score(user_scoring);

        // Update the profile NFT with the new reputation score
        let cpi_program = ctx.accounts.profile_program.to_account_info();
        let cpi_accounts = profile_nft::cpi::accounts::UpdateProfile {
            owner: ctx.accounts.user.to_account_info(),
            metadata: ctx.accounts.profile_metadata.to_account_info(),
            profile_account: ctx.accounts.profile_account.to_account_info(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        profile_nft::cpi::update_reputation_score(cpi_ctx, reputation)?;

        emit!(ReputationCalculatedEvent {
            user: ctx.accounts.user.key(),
            reputation_score: reputation,
            dsx_earned: user_scoring.total_earned,
            referrals: user_scoring.referral_count,
            content_score: user_scoring.content_score,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Award badge based on achievements
    pub fn award_achievement_badge(
        ctx: Context<AwardBadge>,
        badge_id: String,
        requirement_met: u64,
    ) -> Result<()> {
        let user_scoring = &ctx.accounts.user_scoring;
        
        // Check if user meets requirements for badge
        let eligible = match badge_id.as_str() {
            "founder" => user_scoring.referral_count >= 1,
            "influencer" => user_scoring.referral_count >= 10,
            "content_creator" => user_scoring.content_score >= 100,
            "daily_streak_7" => requirement_met >= 7,
            "daily_streak_30" => requirement_met >= 30,
            "whale" => user_scoring.total_earned >= 10000 * 10_u64.pow(9), // 10,000 DSX
            _ => false,
        };

        if !eligible {
            return Err(DsxError::BadgeRequirementNotMet.into());
        }

        // Award badge via profile NFT program
        let cpi_program = ctx.accounts.profile_program.to_account_info();
        let cpi_accounts = profile_nft::cpi::accounts::UpdateProfile {
            owner: ctx.accounts.user.to_account_info(),
            metadata: ctx.accounts.profile_metadata.to_account_info(),
            profile_account: ctx.accounts.profile_account.to_account_info(),
            metadata_program: ctx.accounts.metadata_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        profile_nft::cpi::award_badge(cpi_ctx, badge_id.clone())?;

        emit!(BadgeAwardedEvent {
            user: ctx.accounts.user.key(),
            badge_id,
            requirement_met,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Get user's current reputation score
    pub fn get_reputation_score(ctx: Context<GetReputationScore>) -> Result<u64> {
        let user_scoring = &ctx.accounts.user_scoring;
        Ok(calculate_reputation_score(user_scoring))
    }
}

fn calculate_reputation_score(user_scoring: &UserScoring) -> u64 {
    // Weighted reputation calculation
    let base_score = user_scoring.total_earned / 10_u64.pow(9); // 1 point per DSX
    let referral_bonus = user_scoring.referral_count * 50; // 50 points per referral
    let content_bonus = user_scoring.content_score * 3; // 3 points per content engagement
    let participation_bonus = user_scoring.community_participation * 10; // 10 points per participation

    // Apply diminishing returns for whale prevention
    let total = base_score + referral_bonus + content_bonus + participation_bonus;
    
    // Cap at reasonable maximum to prevent inflation
    std::cmp::min(total, 100000)
}

fn mint_dsx_tokens(ctx: Context<RewardUser>, amount: u64) -> Result<()> {
    let scoring_config = &mut ctx.accounts.scoring_config;
    
    // Check daily limit
    let current_day = Clock::get()?.unix_timestamp / 86400;
    if scoring_config.last_reset_day != current_day {
        scoring_config.daily_distributed = 0;
        scoring_config.last_reset_day = current_day;
    }
    
    if scoring_config.daily_distributed + amount > scoring_config.daily_limit {
        return Err(DsxError::DailyLimitExceeded.into());
    }

    // Mint tokens
    let seeds = &[
        b"scoring",
        &[ctx.bumps.scoring_config],
    ];
    let signer_seeds = &[&seeds[..]];

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.dsx_mint.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.scoring_config.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    scoring_config.daily_distributed += amount;
    scoring_config.total_distributed += amount;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeScoring<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = ScoringConfig::LEN,
        seeds = [b"scoring"],
        bump
    )]
    pub scoring_config: Account<'info, ScoringConfig>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = scoring_config,
    )]
    pub dsx_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitializeUserScoring<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = UserScoring::LEN,
        seeds = [b"user_scoring", user.key().as_ref()],
        bump
    )]
    pub user_scoring: Account<'info, UserScoring>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RewardUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user_scoring", user.key().as_ref()],
        bump
    )]
    pub user_scoring: Account<'info, UserScoring>,

    #[account(
        mut,
        seeds = [b"scoring"],
        bump
    )]
    pub scoring_config: Account<'info, ScoringConfig>,

    #[account(
        mut,
        address = scoring_config.dsx_mint
    )]
    pub dsx_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = dsx_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetReputationScore<'info> {
    pub user: Signer<'info>,

    #[account(
        seeds = [b"user_scoring", user.key().as_ref()],
        bump
    )]
    pub user_scoring: Account<'info, UserScoring>,
}

#[derive(Accounts)]
pub struct UpdateReputationScore<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"user_scoring", user.key().as_ref()],
        bump
    )]
    pub user_scoring: Account<'info, UserScoring>,

    /// CHECK: Profile account (verified by profile program)
    #[account(mut)]
    pub profile_account: UncheckedAccount<'info>,

    /// CHECK: Profile metadata (verified by profile program)
    #[account(mut)]
    pub profile_metadata: UncheckedAccount<'info>,

    /// CHECK: Profile program
    pub profile_program: UncheckedAccount<'info>,

    pub metadata_program: Program<'info, Metadata>,
}

#[derive(Accounts)]
pub struct AwardBadge<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"user_scoring", user.key().as_ref()],
        bump
    )]
    pub user_scoring: Account<'info, UserScoring>,

    /// CHECK: Profile account (verified by profile program)
    #[account(mut)]
    pub profile_account: UncheckedAccount<'info>,

    /// CHECK: Profile metadata (verified by profile program)
    #[account(mut)]
    pub profile_metadata: UncheckedAccount<'info>,

    /// CHECK: Profile program
    pub profile_program: UncheckedAccount<'info>,

    pub metadata_program: Program<'info, Metadata>,
}

#[account]
pub struct ScoringConfig {
    pub authority: Pubkey,
    pub dsx_mint: Pubkey,
    pub total_distributed: u64,
    pub daily_distributed: u64,
    pub daily_limit: u64,
    pub last_reset_day: i64,
}

impl ScoringConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // dsx_mint
        8 + // total_distributed
        8 + // daily_distributed
        8 + // daily_limit
        8; // last_reset_day
}

#[account]
pub struct UserScoring {
    pub user: Pubkey,
    pub total_earned: u64,
    pub last_daily_contribution: i64,
    pub referral_count: u64,
    pub content_score: u64,
    pub community_participation: u64,
}

impl UserScoring {
    pub const LEN: usize = 8 + // discriminator
        32 + // user
        8 + // total_earned
        8 + // last_daily_contribution
        8 + // referral_count
        8 + // content_score
        8; // community_participation
}

#[event]
pub struct RewardEvent {
    pub user: Pubkey,
    pub reward_type: RewardType,
    pub amount: u64,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub enum RewardType {
    DailyContribution,
    Referral,
    ContentEngagement,
    CommunityParticipation,
}

#[event]
pub struct ReputationCalculatedEvent {
    pub user: Pubkey,
    pub reputation_score: u64,
    pub dsx_earned: u64,
    pub referrals: u64,
    pub content_score: u64,
    pub timestamp: i64,
}

#[event]
pub struct BadgeAwardedEvent {
    pub user: Pubkey,
    pub badge_id: String,
    pub requirement_met: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum DsxError {
    #[msg("User already contributed today")]
    AlreadyContributedToday,
    #[msg("Daily distribution limit exceeded")]
    DailyLimitExceeded,
    #[msg("No reward earned")]
    NoRewardEarned,
    #[msg("Badge requirement not met")]
    BadgeRequirementNotMet,
}