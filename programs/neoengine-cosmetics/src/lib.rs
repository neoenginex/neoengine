use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata},
    token::{mint_to, transfer, Mint, MintTo, Token, TokenAccount, Transfer},
    associated_token::AssociatedToken,
};
use mpl_token_metadata::{
    pda::{find_metadata_account},
    state::{DataV2, Creator},
};

declare_id!("33333333333333333333333333333334");

#[program]
pub mod neoengine_cosmetics {
    use super::*;

    /// Initialize the cosmetic system
    pub fn initialize_cosmetic_registry(ctx: Context<InitializeCosmeticRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.cosmetic_registry;
        registry.authority = ctx.accounts.authority.key();
        registry.total_cosmetics_created = 0;
        registry.active_stakes = 0;
        Ok(())
    }

    /// Create a new cosmetic type template (admin only)
    pub fn create_cosmetic_template(
        ctx: Context<CreateCosmeticTemplate>,
        template_id: String,
        cosmetic_data: CosmeticTemplate,
    ) -> Result<()> {
        let template = &mut ctx.accounts.cosmetic_template;
        template.template_id = template_id.clone();
        template.cosmetic_data = cosmetic_data;
        template.total_minted = 0;
        template.created_at = Clock::get()?.unix_timestamp;

        let registry = &mut ctx.accounts.cosmetic_registry;
        registry.total_cosmetics_created += 1;

        emit!(CosmeticTemplateCreatedEvent {
            template_id,
            cosmetic_type: template.cosmetic_data.cosmetic_type.clone(),
            rarity: template.cosmetic_data.rarity.clone(),
            tradable: template.cosmetic_data.tradable,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Mint a cosmetic NFT (purchase, airdrop, or milestone)
    pub fn mint_cosmetic(
        ctx: Context<MintCosmetic>,
        template_id: String,
    ) -> Result<()> {
        let template = &mut ctx.accounts.cosmetic_template;
        
        // Check supply limits if any
        if template.cosmetic_data.max_supply > 0 && 
           template.total_minted >= template.cosmetic_data.max_supply {
            return Err(CosmeticError::MaxSupplyReached.into());
        }

        // Mint the cosmetic NFT to recipient
        mint_to(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.cosmetic_mint.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            1,
        )?;

        // Create metadata
        let metadata_uri = generate_cosmetic_metadata_uri(&template.cosmetic_data)?;
        create_cosmetic_metadata(ctx, metadata_uri, &template.cosmetic_data)?;

        template.total_minted += 1;

        emit!(CosmeticMintedEvent {
            recipient: ctx.accounts.recipient.key(),
            cosmetic_mint: ctx.accounts.cosmetic_mint.key(),
            template_id,
            cosmetic_type: template.cosmetic_data.cosmetic_type.clone(),
            rarity: template.cosmetic_data.rarity.clone(),
            tradable: template.cosmetic_data.tradable,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Stake/Equip a cosmetic to a profile
    pub fn stake_cosmetic_to_profile(
        ctx: Context<StakeCosmeticToProfile>,
        cosmetic_type: String,
    ) -> Result<()> {
        // Verify user owns the cosmetic
        if ctx.accounts.user_cosmetic_account.amount != 1 {
            return Err(CosmeticError::CosmeticNotOwned.into());
        }

        // Verify cosmetic type matches
        let cosmetic_metadata = get_cosmetic_metadata_from_mint(&ctx.accounts.cosmetic_mint.key())?;
        if cosmetic_metadata.cosmetic_type != cosmetic_type {
            return Err(CosmeticError::InvalidCosmeticType.into());
        }

        // Transfer cosmetic to stake vault
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_cosmetic_account.to_account_info(),
                    to: ctx.accounts.stake_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            1,
        )?;

        // Create stake record
        let stake_record = &mut ctx.accounts.stake_record;
        stake_record.user = ctx.accounts.user.key();
        stake_record.cosmetic_mint = ctx.accounts.cosmetic_mint.key();
        stake_record.profile_mint = ctx.accounts.profile_mint.key();
        stake_record.cosmetic_type = cosmetic_type.clone();
        stake_record.staked_at = Clock::get()?.unix_timestamp;

        let registry = &mut ctx.accounts.cosmetic_registry;
        registry.active_stakes += 1;

        emit!(CosmeticStakedEvent {
            user: ctx.accounts.user.key(),
            cosmetic_mint: ctx.accounts.cosmetic_mint.key(),
            profile_mint: ctx.accounts.profile_mint.key(),
            cosmetic_type,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Unstake/Unequip a cosmetic from profile
    pub fn unstake_cosmetic_from_profile(
        ctx: Context<UnstakeCosmeticFromProfile>,
    ) -> Result<()> {
        let stake_record = &ctx.accounts.stake_record;

        // Generate signer seeds for the stake vault
        let cosmetic_mint = stake_record.cosmetic_mint;
        let profile_mint = stake_record.profile_mint;
        let seeds = &[
            b"stake_vault",
            cosmetic_mint.as_ref(),
            profile_mint.as_ref(),
            &[ctx.bumps.stake_vault],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer cosmetic back to user
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.stake_vault.to_account_info(),
                    to: ctx.accounts.user_cosmetic_account.to_account_info(),
                    authority: ctx.accounts.stake_vault.to_account_info(),
                },
                signer_seeds,
            ),
            1,
        )?;

        let registry = &mut ctx.accounts.cosmetic_registry;
        registry.active_stakes -= 1;

        emit!(CosmeticUnstakedEvent {
            user: ctx.accounts.user.key(),
            cosmetic_mint: cosmetic_mint,
            profile_mint: profile_mint,
            cosmetic_type: stake_record.cosmetic_type.clone(),
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Get all cosmetics owned by a user
    pub fn get_user_cosmetic_inventory(
        ctx: Context<GetUserInventory>,
    ) -> Result<Vec<UserCosmeticInfo>> {
        // This would be implemented to return user's cosmetic inventory
        // For now, returning empty vec as placeholder
        Ok(Vec::new())
    }

    /// Check if a cosmetic is currently staked
    pub fn is_cosmetic_staked(
        ctx: Context<CheckCosmeticStake>,
    ) -> Result<bool> {
        // Check if stake record exists for this cosmetic + profile combo
        Ok(true) // Placeholder
    }
}

// Helper functions
fn generate_cosmetic_metadata_uri(cosmetic_data: &CosmeticTemplate) -> Result<String> {
    let attributes = vec![
        format!("{{\"trait_type\":\"Type\",\"value\":\"{}\"}}", cosmetic_data.cosmetic_type),
        format!("{{\"trait_type\":\"Rarity\",\"value\":\"{}\"}}", cosmetic_data.rarity),
        format!("{{\"trait_type\":\"Collection\",\"value\":\"{}\"}}", cosmetic_data.collection),
        format!("{{\"trait_type\":\"Tradable\",\"value\":\"{}\"}}", cosmetic_data.tradable),
    ];

    let metadata = format!(
        "{{\"name\":\"{}\",\"symbol\":\"NEOCOS\",\"description\":\"{}\",\"image\":\"ipfs://{}\",\"external_url\":\"https://neoengine.xyz/cosmetics/{}\",\"attributes\":[{}]}}",
        cosmetic_data.name,
        cosmetic_data.description,
        cosmetic_data.image_cid,
        cosmetic_data.name.to_lowercase().replace(" ", "-"),
        attributes.join(",")
    );
    
    Ok(format!("data:application/json;base64,{}", base64::encode(metadata)))
}

fn get_cosmetic_metadata_from_mint(_mint: &Pubkey) -> Result<CosmeticMetadata> {
    // In production, this would fetch and parse the cosmetic's on-chain metadata
    // For now, returning a placeholder
    Ok(CosmeticMetadata {
        cosmetic_type: "frame".to_string(),
        rarity: "common".to_string(),
        tradable: true,
    })
}

fn create_cosmetic_metadata(
    ctx: Context<MintCosmetic>, 
    metadata_uri: String, 
    cosmetic_data: &CosmeticTemplate
) -> Result<()> {
    let creators = vec![Creator {
        address: crate::ID,
        verified: false,
        share: 100,
    }];

    let data = DataV2 {
        name: cosmetic_data.name.clone(),
        symbol: "NEOCOS".to_string(),
        uri: metadata_uri,
        seller_fee_basis_points: if cosmetic_data.tradable { 250 } else { 0 }, // 2.5% if tradable
        creators: Some(creators),
        collection: None,
        uses: None,
    };

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.cosmetic_metadata.to_account_info(),
                mint: ctx.accounts.cosmetic_mint.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        data,
        false, // is_mutable (cosmetics are static)
        false, // update_authority_is_signer
        None,  // collection_details
    )?;

    Ok(())
}

// Account Structures
#[derive(Accounts)]
pub struct InitializeCosmeticRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = CosmeticRegistry::LEN,
        seeds = [b"cosmetic_registry"],
        bump
    )]
    pub cosmetic_registry: Account<'info, CosmeticRegistry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(template_id: String)]
pub struct CreateCosmeticTemplate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"cosmetic_registry"],
        bump,
        constraint = cosmetic_registry.authority == authority.key() @ CosmeticError::Unauthorized,
    )]
    pub cosmetic_registry: Account<'info, CosmeticRegistry>,

    #[account(
        init,
        payer = authority,
        space = CosmeticTemplateAccount::LEN,
        seeds = [b"cosmetic_template", template_id.as_bytes()],
        bump
    )]
    pub cosmetic_template: Account<'info, CosmeticTemplateAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(template_id: String)]
pub struct MintCosmetic<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Recipient account
    pub recipient: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"cosmetic_template", template_id.as_bytes()],
        bump
    )]
    pub cosmetic_template: Account<'info, CosmeticTemplateAccount>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority.key(),
    )]
    pub cosmetic_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = cosmetic_mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: Metadata account
    #[account(
        mut,
        address = find_metadata_account(&cosmetic_mint.key()).0
    )]
    pub cosmetic_metadata: UncheckedAccount<'info>,

    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StakeCosmeticToProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    pub cosmetic_mint: Account<'info, Mint>,
    pub profile_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = cosmetic_mint,
        associated_token::authority = user,
    )]
    pub user_cosmetic_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        token::mint = cosmetic_mint,
        token::authority = stake_vault,
        seeds = [b"stake_vault", cosmetic_mint.key().as_ref(), profile_mint.key().as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        space = CosmeticStakeRecord::LEN,
        seeds = [b"stake_record", cosmetic_mint.key().as_ref(), profile_mint.key().as_ref()],
        bump
    )]
    pub stake_record: Account<'info, CosmeticStakeRecord>,

    #[account(
        mut,
        seeds = [b"cosmetic_registry"],
        bump
    )]
    pub cosmetic_registry: Account<'info, CosmeticRegistry>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnstakeCosmeticFromProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = stake_record.cosmetic_mint,
        associated_token::authority = user,
    )]
    pub user_cosmetic_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stake_record.cosmetic_mint,
        token::authority = stake_vault,
        seeds = [b"stake_vault", stake_record.cosmetic_mint.as_ref(), stake_record.profile_mint.as_ref()],
        bump
    )]
    pub stake_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"stake_record", stake_record.cosmetic_mint.as_ref(), stake_record.profile_mint.as_ref()],
        bump,
        constraint = stake_record.user == user.key() @ CosmeticError::Unauthorized,
        close = user
    )]
    pub stake_record: Account<'info, CosmeticStakeRecord>,

    #[account(
        mut,
        seeds = [b"cosmetic_registry"],
        bump
    )]
    pub cosmetic_registry: Account<'info, CosmeticRegistry>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct GetUserInventory<'info> {
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct CheckCosmeticStake<'info> {
    pub user: Signer<'info>,
    pub cosmetic_mint: Account<'info, Mint>,
    pub profile_mint: Account<'info, Mint>,
}

// Data Structures
#[account]
pub struct CosmeticRegistry {
    pub authority: Pubkey,
    pub total_cosmetics_created: u64,
    pub active_stakes: u64,
}

impl CosmeticRegistry {
    pub const LEN: usize = 8 + 32 + 8 + 8;
}

#[account]
pub struct CosmeticTemplateAccount {
    pub template_id: String,
    pub cosmetic_data: CosmeticTemplate,
    pub total_minted: u64,
    pub created_at: i64,
}

impl CosmeticTemplateAccount {
    pub const LEN: usize = 8 + // discriminator
        4 + 32 + // template_id
        CosmeticTemplate::LEN + // cosmetic_data
        8 + // total_minted
        8; // created_at
}

#[account]
pub struct CosmeticStakeRecord {
    pub user: Pubkey,
    pub cosmetic_mint: Pubkey,
    pub profile_mint: Pubkey,
    pub cosmetic_type: String,
    pub staked_at: i64,
}

impl CosmeticStakeRecord {
    pub const LEN: usize = 8 + // discriminator
        32 + // user
        32 + // cosmetic_mint
        32 + // profile_mint
        4 + 16 + // cosmetic_type
        8; // staked_at
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CosmeticTemplate {
    pub name: String,                    // "Neon Frame"
    pub description: String,             // "A glowing frame effect"
    pub cosmetic_type: String,           // "frame", "background", "animation", "badge_effect"
    pub rarity: String,                  // "common", "rare", "epic", "legendary"
    pub collection: String,              // "Genesis", "Winter 2024", etc
    pub image_cid: String,               // IPFS CID for image
    pub tradable: bool,                  // false for milestone rewards
    pub max_supply: u64,                 // 0 = unlimited
}

impl CosmeticTemplate {
    pub const LEN: usize = 4 + 64 + // name
        4 + 200 + // description
        4 + 16 + // cosmetic_type
        4 + 16 + // rarity
        4 + 32 + // collection
        4 + 64 + // image_cid
        1 + // tradable
        8; // max_supply
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CosmeticMetadata {
    pub cosmetic_type: String,
    pub rarity: String,
    pub tradable: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UserCosmeticInfo {
    pub mint: Pubkey,
    pub name: String,
    pub cosmetic_type: String,
    pub rarity: String,
    pub is_staked: bool,
    pub staked_to_profile: Option<Pubkey>,
}

// Events
#[event]
pub struct CosmeticTemplateCreatedEvent {
    pub template_id: String,
    pub cosmetic_type: String,
    pub rarity: String,
    pub tradable: bool,
    pub timestamp: i64,
}

#[event]
pub struct CosmeticMintedEvent {
    pub recipient: Pubkey,
    pub cosmetic_mint: Pubkey,
    pub template_id: String,
    pub cosmetic_type: String,
    pub rarity: String,
    pub tradable: bool,
    pub timestamp: i64,
}

#[event]
pub struct CosmeticStakedEvent {
    pub user: Pubkey,
    pub cosmetic_mint: Pubkey,
    pub profile_mint: Pubkey,
    pub cosmetic_type: String,
    pub timestamp: i64,
}

#[event]
pub struct CosmeticUnstakedEvent {
    pub user: Pubkey,
    pub cosmetic_mint: Pubkey,
    pub profile_mint: Pubkey,
    pub cosmetic_type: String,
    pub timestamp: i64,
}

// Errors
#[error_code]
pub enum CosmeticError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Maximum supply reached")]
    MaxSupplyReached,
    #[msg("Cosmetic not owned")]
    CosmeticNotOwned,
    #[msg("Invalid cosmetic type")]
    InvalidCosmeticType,
    #[msg("Cosmetic already staked")]
    CosmeticAlreadyStaked,
    #[msg("Cosmetic not staked")]
    CosmeticNotStaked,
}