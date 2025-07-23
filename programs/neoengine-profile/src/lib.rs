use anchor_lang::prelude::*;

declare_id!("DfgjPKaYeRdCt6L1eaUpQrU7uRM1bdshgSVJRihfmqas");

#[program]
pub mod neoengine_profile {
    use super::*;

    /// Create a new Profile with rich metadata support
    /// This stores all profile data on-chain with IPFS metadata URI
    pub fn create_profile(
        ctx: Context<CreateProfile>,
        metadata_uri: String,
        sbt_handle: String,
        name: String,
        bio: String,
        country: String,
        website: String,
        twitter: String,
        discord: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_state;
        let clock = Clock::get()?;

        // Validate inputs
        require!(metadata_uri.len() <= 200, ProfileError::InvalidMetadataUri);
        require!(sbt_handle.len() <= 32, ProfileError::InvalidSbtHandle);
        require!(name.len() <= 50, ProfileError::InvalidName);

        // Initialize profile state with rich metadata
        profile.owner = ctx.accounts.owner.key();
        profile.sbt_handle = sbt_handle.clone();
        profile.metadata_uri = metadata_uri.clone();
        
        // Store profile metadata on-chain
        profile.name = name.clone();
        profile.bio = bio.clone();
        profile.country = country.clone();
        profile.website = website.clone();
        profile.social_links = SocialLinks {
            twitter: twitter.clone(),
            discord: discord.clone(),
        };
        
        // Timestamps and versioning
        profile.created_at = clock.unix_timestamp;
        profile.updated_at = clock.unix_timestamp;
        profile.update_count = 0;
        profile.version = 1;
        profile.bump = ctx.bumps.profile_state;

        emit!(ProfileCreatedEvent {
            owner: ctx.accounts.owner.key(),
            sbt_handle: sbt_handle.clone(),
            name: name.clone(),
            metadata_uri: metadata_uri,
            timestamp: clock.unix_timestamp,
        });

        msg!("Profile with full metadata created for @{}: {}", sbt_handle, name);
        Ok(())
    }

    /// Update profile metadata (both on-chain and IPFS URI)
    pub fn update_profile(
        ctx: Context<UpdateProfile>,
        new_metadata_uri: String,
        name: String,
        bio: String,
        country: String,
        website: String,
        twitter: String,
        discord: String,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_state;
        let clock = Clock::get()?;

        // Validate inputs
        require!(new_metadata_uri.len() <= 200, ProfileError::InvalidMetadataUri);
        require!(name.len() <= 50, ProfileError::InvalidName);

        // Update metadata
        profile.metadata_uri = new_metadata_uri.clone();
        profile.name = name.clone();
        profile.bio = bio.clone();
        profile.country = country.clone();
        profile.website = website.clone();
        profile.social_links.twitter = twitter.clone();
        profile.social_links.discord = discord.clone();
        
        // Update timestamps and versioning
        profile.updated_at = clock.unix_timestamp;
        profile.update_count += 1;
        profile.version = 2; // Increment version for compatibility

        emit!(ProfileUpdatedEvent {
            owner: ctx.accounts.owner.key(),
            name: name.clone(),
            new_metadata_uri: new_metadata_uri,
            update_count: profile.update_count,
            timestamp: clock.unix_timestamp,
        });

        msg!("Profile metadata updated for @{}: {}", profile.sbt_handle, name);
        Ok(())
    }

    /// Get profile summary (view function)
    pub fn get_profile_summary(ctx: Context<GetProfile>) -> Result<ProfileSummary> {
        let profile = &ctx.accounts.profile_state;
        
        Ok(ProfileSummary {
            owner: profile.owner,
            sbt_handle: profile.sbt_handle.clone(),
            name: profile.name.clone(),
            bio: profile.bio.clone(),
            metadata_uri: profile.metadata_uri.clone(),
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            update_count: profile.update_count,
        })
    }

    /// Mark profile as verified (admin only - future feature)
    pub fn set_verified_status(
        ctx: Context<SetVerified>,
        verified: bool,
    ) -> Result<()> {
        let profile = &mut ctx.accounts.profile_state;
        
        // TODO: Add admin authority check
        profile.verified = verified;
        profile.updated_at = Clock::get()?.unix_timestamp;

        emit!(ProfileVerificationEvent {
            owner: profile.owner,
            sbt_handle: profile.sbt_handle.clone(),
            verified,
            timestamp: profile.updated_at,
        });

        msg!("Profile verification status updated for @{}: {}", profile.sbt_handle, verified);
        Ok(())
    }
}

// Account structs
#[derive(Accounts)]
#[instruction(metadata_uri: String, sbt_handle: String, name: String, bio: String, country: String, website: String, twitter: String, discord: String)]
pub struct CreateProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        seeds = [b"profile", owner.key().as_ref()],
        bump,
        payer = owner,
        space = ProfileState::SPACE
    )]
    pub profile_state: Account<'info, ProfileState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateProfile<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"profile", owner.key().as_ref()],
        bump = profile_state.bump,
        constraint = profile_state.owner == owner.key() @ ProfileError::Unauthorized
    )]
    pub profile_state: Account<'info, ProfileState>,
}

#[derive(Accounts)]
pub struct GetProfile<'info> {
    pub profile_state: Account<'info, ProfileState>,
}

#[derive(Accounts)]
pub struct SetVerified<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // TODO: Add authority constraint

    #[account(mut)]
    pub profile_state: Account<'info, ProfileState>,
}

// Data structures
#[account]
#[derive(Debug)]
pub struct ProfileState {
    pub owner: Pubkey,
    pub sbt_handle: String,
    pub metadata_uri: String,
    
    // Rich on-chain metadata
    pub name: String,
    pub bio: String,
    pub country: String,
    pub website: String,
    pub social_links: SocialLinks,
    
    // Status and versioning
    pub verified: bool,
    pub version: u8,
    
    // Timestamps
    pub created_at: i64,
    pub updated_at: i64,
    pub update_count: u32,
    
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SocialLinks {
    pub twitter: String,
    pub discord: String,
}

impl ProfileState {
    pub const SPACE: usize = 8 + // discriminator
        32 + // owner
        4 + 32 + // sbt_handle (max 32 chars)
        4 + 200 + // metadata_uri (max 200 chars)
        4 + 50 + // name (max 50 chars)
        4 + 200 + // bio (max 200 chars)
        4 + 50 + // country (max 50 chars)
        4 + 100 + // website (max 100 chars)
        4 + 50 + // twitter (max 50 chars)
        4 + 50 + // discord (max 50 chars)
        1 + // verified
        1 + // version
        8 + // created_at
        8 + // updated_at
        4 + // update_count
        1; // bump
}

// Return types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct ProfileSummary {
    pub owner: Pubkey,
    pub sbt_handle: String,
    pub name: String,
    pub bio: String,
    pub metadata_uri: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub update_count: u32,
}

// Events
#[event]
pub struct ProfileCreatedEvent {
    pub owner: Pubkey,
    pub sbt_handle: String,
    pub name: String,
    pub metadata_uri: String,
    pub timestamp: i64,
}

#[event]
pub struct ProfileUpdatedEvent {
    pub owner: Pubkey,
    pub name: String,
    pub new_metadata_uri: String,
    pub update_count: u32,
    pub timestamp: i64,
}

#[event]
pub struct ProfileVerificationEvent {
    pub owner: Pubkey,
    pub sbt_handle: String,
    pub verified: bool,
    pub timestamp: i64,
}

// Error codes
#[error_code]
pub enum ProfileError {
    #[msg("Invalid metadata URI")]
    InvalidMetadataUri,
    #[msg("Profile already exists")]
    ProfileAlreadyExists,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid SBT handle")]
    InvalidSbtHandle,
    #[msg("Invalid name")]
    InvalidName,
    #[msg("Profile not found")]
    ProfileNotFound,
}