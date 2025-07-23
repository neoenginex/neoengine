# 🔧 NeoEngine Smart Contract Architecture

**Complete technical documentation for all 16 NeoEngine smart contracts and their protocols**

---

## 📊 Contract Overview

NeoEngine consists of **16 specialized smart contracts** organized into 4 main categories:

### **🔧 Resource Mining Contracts (5)**
- **neoengine-cpu** - NeoHash CPU mining protocol
- **neoengine-gpu** - VRAM pooling for ne0 AI training  
- **neoengine-ram** - Memory sharing for real-time operations
- **neoengine-storage** - Distributed file system (IPFS-style)
- **neoengine-bandwidth** - CDN acceleration network

### **🎛️ Core Coordination Contracts (3)**
- **neoengine-core** - NeoSync protocol & central orchestration
- **neoengine-linking** - NeoLink + NeoChain device management
- **neoengine-resources** - Resource monitoring & analytics

### **🤝 Social & Economic Contracts (4)**
- **neoengine-social** - Social engagement & $DSX rewards
- **neoengine-guilds** - Team mining & competition (NeoGuild)
- **neoengine-achievements** - Achievement & badge system
- **neoengine-rewards** - Advanced reward distribution (NeoVault)

### **🆔 Identity & Assets Contracts (4)**
- **neoengine-identity** - SBT handles (permanent usernames)
- **neoengine-profile** - Mutable Profile NFTs
- **neoengine-cosmetics** - Stakeable cosmetic system

---

## 🔧 Resource Mining Contracts

### 1. **neoengine-cpu** (NeoHash Protocol)

**Purpose**: CPU mining optimized for mobile devices using the NeoHash algorithm

**Key Features:**
- **NeoHash Algorithm**: Your upgraded version of DrillX, optimized for mobile CPUs
- **60-Second Epochs**: Consistent mining intervals like ORE
- **Adaptive Difficulty**: Automatically adjusts based on network hashrate
- **Battery Protection**: Thermal monitoring and power management
- **Fair Competition**: Tier-based mining (Mobile/Laptop/Desktop/Server)

**Core Functions:**
```rust
// Start mining session
pub fn start_mining_session(
    ctx: Context<StartMining>,
    device_specs: DeviceSpecs,
) -> Result<()>

// Submit proof of work
pub fn submit_proof(
    ctx: Context<SubmitProof>,
    nonce: u64,
    hash_result: [u8; 32],
) -> Result<()>

// Claim mining rewards
pub fn claim_mining_rewards(
    ctx: Context<ClaimRewards>
) -> Result<()>

// Update difficulty
pub fn update_difficulty(
    ctx: Context<UpdateDifficulty>
) -> Result<()>
```

**Data Structures:**
```rust
#[account]
pub struct MiningSession {
    pub miner: Pubkey,
    pub device_tier: DeviceTier,
    pub challenge: [u8; 32],
    pub difficulty_target: u64,
    pub start_timestamp: i64,
    pub submitted_proofs: u32,
    pub rewards_earned: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum DeviceTier {
    Mobile,     // Phones, tablets
    Laptop,     // Ultrabooks, laptops
    Desktop,    // Gaming PCs, workstations
    Server,     // Data centers, mining farms
}
```

---

### 2. **neoengine-gpu** (VRAM Pooling)

**Purpose**: Coordinates GPU memory sharing for ne0 AI training and inference

**Key Features:**
- **VRAM Pool Management**: Aggregate GPU memory across devices
- **AI Task Distribution**: Distribute training/inference workloads
- **Performance Monitoring**: Track GPU utilization and rewards
- **Model Coordination**: Sync with ne0 AI for distributed training

**Core Functions:**
```rust
// Register GPU for mining
pub fn register_gpu(
    ctx: Context<RegisterGPU>,
    gpu_specs: GPUSpecs,
    available_vram: u64,
) -> Result<()>

// Accept AI training task
pub fn accept_training_task(
    ctx: Context<AcceptTask>,
    task_id: String,
    estimated_completion: i64,
) -> Result<()>

// Submit training results
pub fn submit_training_results(
    ctx: Context<SubmitResults>,
    task_id: String,
    model_weights_cid: String,
) -> Result<()>

// Claim GPU mining rewards
pub fn claim_gpu_rewards(
    ctx: Context<ClaimGPURewards>
) -> Result<()>
```

**Integration with ne0 AI:**
```rust
// Coordinate with AI system
pub fn sync_with_ne0_ai(
    ctx: Context<SyncAI>,
    model_updates: Vec<ModelUpdate>,
) -> Result<()>

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AITask {
    pub task_id: String,
    pub model_type: String,
    pub training_data_cid: String,
    pub required_vram: u64,
    pub reward_amount: u64,
    pub deadline: i64,
}
```

---

### 3. **neoengine-ram** (Memory Sharing)

**Purpose**: Coordinates RAM sharing for real-time operations and caching

**Key Features:**
- **Memory Pool Management**: Aggregate available RAM across devices
- **Real-Time Operations**: Support for live communication and caching
- **Performance Optimization**: Intelligent memory allocation
- **Caching Network**: Distributed data caching system

**Core Functions:**
```rust
// Contribute RAM to network
pub fn contribute_ram(
    ctx: Context<ContributeRAM>,
    available_ram: u64,
    allocation_preferences: RAMPreferences,
) -> Result<()>

// Handle memory allocation request
pub fn allocate_memory(
    ctx: Context<AllocateMemory>,
    requested_size: u64,
    allocation_type: AllocationType,
) -> Result<()>

// Process cached data request
pub fn serve_cached_data(
    ctx: Context<ServeCachedData>,
    data_key: String,
    requester: Pubkey,
) -> Result<()>
```

---

### 4. **neoengine-storage** (Distributed Storage)

**Purpose**: IPFS-style distributed file system with redundancy

**Key Features:**
- **Distributed File Storage**: Spread files across multiple devices
- **Redundancy Management**: Ensure data availability and integrity
- **Storage Marketplace**: Enterprise clients can rent storage space
- **Data Verification**: Cryptographic proofs of storage

**Core Functions:**
```rust
// Offer storage space
pub fn offer_storage(
    ctx: Context<OfferStorage>,
    available_space: u64,
    pricing: StoragePricing,
) -> Result<()>

// Store file chunk
pub fn store_file_chunk(
    ctx: Context<StoreChunk>,
    chunk_hash: [u8; 32],
    chunk_data_cid: String,
) -> Result<()>

// Verify storage proof
pub fn verify_storage_proof(
    ctx: Context<VerifyProof>,
    chunk_hash: [u8; 32],
    proof: StorageProof,
) -> Result<()>

// Retrieve file chunk
pub fn retrieve_chunk(
    ctx: Context<RetrieveChunk>,
    chunk_hash: [u8; 32],
) -> Result<()>
```

---

### 5. **neoengine-bandwidth** (CDN Network)

**Purpose**: Global CDN acceleration network powered by user bandwidth

**Key Features:**
- **Bandwidth Pooling**: Aggregate network connections globally
- **Traffic Routing**: Intelligent routing for optimal performance
- **CDN Services**: Compete with traditional CDN providers
- **Quality Monitoring**: Track uptime and performance metrics

**Core Functions:**
```rust
// Contribute bandwidth to network
pub fn contribute_bandwidth(
    ctx: Context<ContributeBandwidth>,
    connection_specs: ConnectionSpecs,
    available_bandwidth: u64,
) -> Result<()>

// Handle traffic routing
pub fn route_traffic(
    ctx: Context<RouteTraffic>,
    source: Pubkey,
    destination: Pubkey,
    data_size: u64,
) -> Result<()>

// Report performance metrics
pub fn report_performance(
    ctx: Context<ReportPerformance>,
    metrics: PerformanceMetrics,
) -> Result<()>
```

---

## 🎛️ Core Coordination Contracts

### 6. **neoengine-core** (NeoSync & Central Hub)

**Purpose**: Central orchestration hub implementing NeoSync protocol

**Key Features:**
- **NeoSync Protocol**: Real-time data synchronization across devices
- **Cross-Contract Communication**: Coordinates all other contracts
- **Global State Management**: Protocol-wide settings and parameters
- **Load Balancing**: Distributes work optimally across the network

**Core Functions:**
```rust
// Synchronize data across devices
pub fn sync_data(
    ctx: Context<SyncData>,
    sync_type: SyncType,
    data_payload: Vec<u8>,
    target_devices: Vec<Pubkey>,
) -> Result<()>

// Coordinate cross-contract operations
pub fn coordinate_operation(
    ctx: Context<CoordinateOperation>,
    operation_type: OperationType,
    target_contracts: Vec<Pubkey>,
) -> Result<()>

// Update global parameters
pub fn update_global_config(
    ctx: Context<UpdateConfig>,
    new_config: GlobalConfig,
) -> Result<()>

// Optimize resource allocation
pub fn optimize_allocation(
    ctx: Context<OptimizeAllocation>,
    resource_requirements: ResourceRequirements,
) -> Result<()>
```

**NeoSync Protocol Implementation:**
```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum SyncType {
    ProfileUpdate,
    MiningStats,
    AchievementUnlock,
    GuildActivity,
    ResourceAllocation,
}

#[account]
pub struct SyncState {
    pub user: Pubkey,
    pub device_chain: Vec<Pubkey>,
    pub last_sync_timestamp: i64,
    pub pending_syncs: Vec<PendingSync>,
    pub sync_conflicts: Vec<SyncConflict>,
}
```

---

### 7. **neoengine-linking** (NeoLink + NeoChain)

**Purpose**: Device discovery, authentication, and linking system

**Key Features:**
- **NeoLink Protocol**: Device discovery and pairing via QR codes
- **NeoChain System**: Link multiple devices to one user profile
- **Device Authentication**: Secure verification and trust management
- **Resource Coordination**: Manage resources across linked devices

**Core Functions:**
```rust
// Discover nearby devices
pub fn discover_devices(
    ctx: Context<DiscoverDevices>,
    discovery_range: DiscoveryRange,
) -> Result<()>

// Pair device via QR code
pub fn pair_device(
    ctx: Context<PairDevice>,
    pairing_code: String,
    device_info: DeviceInfo,
) -> Result<()>

// Link device to user chain
pub fn link_to_chain(
    ctx: Context<LinkToChain>,
    device_pubkey: Pubkey,
    chain_owner: Pubkey,
) -> Result<()>

// Coordinate resources across chain
pub fn coordinate_chain_resources(
    ctx: Context<CoordinateChain>,
    resource_allocation: ChainResourceAllocation,
) -> Result<()>
```

**NeoChain Data Structure:**
```rust
#[account]
pub struct DeviceChain {
    pub owner: Pubkey,
    pub linked_devices: Vec<LinkedDevice>,
    pub total_cpu_power: u64,
    pub total_gpu_vram: u64,
    pub total_ram: u64,
    pub total_storage: u64,
    pub total_bandwidth: u64,
    pub created_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LinkedDevice {
    pub device_pubkey: Pubkey,
    pub device_type: DeviceType,
    pub capabilities: DeviceCapabilities,
    pub last_active: i64,
    pub trust_score: u32,
}
```

---

### 8. **neoengine-resources** (Resource Monitoring)

**Purpose**: Monitor and analyze resource contributions across all mining types

**Key Features:**
- **Cross-Resource Analytics**: Track CPU/GPU/RAM/Storage/Bandwidth usage
- **Performance Metrics**: Monitor efficiency and optimization opportunities
- **Resource Marketplace**: Connect enterprise clients with resource providers
- **Predictive Analytics**: AI-powered resource demand forecasting

**Core Functions:**
```rust
// Record resource contribution
pub fn record_contribution(
    ctx: Context<RecordContribution>,
    resource_type: ResourceType,
    amount: u64,
    performance_metrics: PerformanceMetrics,
) -> Result<()>

// Generate analytics report
pub fn generate_analytics(
    ctx: Context<GenerateAnalytics>,
    report_type: AnalyticsType,
    time_range: TimeRange,
) -> Result<()>

// Optimize resource allocation
pub fn optimize_resources(
    ctx: Context<OptimizeResources>,
    optimization_target: OptimizationTarget,
) -> Result<()>
```

---

## 🤝 Social & Economic Contracts

### 9. **neoengine-social** (Social Engagement)

**Purpose**: Social engagement rewards and reputation system (formerly dsx-scoring)

**Key Features:**
- **Daily Rewards**: 50 $DSX for daily app usage
- **Referral System**: 100 $DSX per friend brought to platform
- **Content Engagement**: Earn $DSX for likes, shares, comments
- **Community Events**: Participation rewards and bonuses
- **Reputation Calculation**: Comprehensive scoring system

**Core Functions:**
```rust
// Claim daily social reward
pub fn claim_daily_reward(
    ctx: Context<ClaimDailyReward>
) -> Result<()>

// Award referral bonus
pub fn award_referral(
    ctx: Context<AwardReferral>,
    referred_user: Pubkey,
) -> Result<()>

// Record content engagement
pub fn record_engagement(
    ctx: Context<RecordEngagement>,
    engagement_type: EngagementType,
    content_id: String,
    points: u64,
) -> Result<()>

// Update reputation score
pub fn update_reputation(
    ctx: Context<UpdateReputation>,
    activity_data: UserActivity,
) -> Result<()>
```

---

### 10. **neoengine-guilds** (NeoGuild Protocol)

**Purpose**: Guild formation, management, and team mining coordination

**Key Features:**
- **Guild Creation**: Form mining teams with shared goals
- **Team Mining**: Combine resources for bonus rewards
- **Competition System**: Guild vs guild leaderboards
- **Social Coordination**: Shared chat, strategies, and events

**Core Functions:**
```rust
// Create new guild
pub fn create_guild(
    ctx: Context<CreateGuild>,
    guild_name: String,
    guild_config: GuildConfig,
    initial_stake: u64,
) -> Result<()>

// Join existing guild
pub fn join_guild(
    ctx: Context<JoinGuild>,
    guild_pubkey: Pubkey,
    application_data: GuildApplication,
) -> Result<()>

// Coordinate team mining
pub fn coordinate_team_mining(
    ctx: Context<CoordinateTeamMining>,
    mining_strategy: TeamMiningStrategy,
) -> Result<()>

// Distribute guild rewards
pub fn distribute_guild_rewards(
    ctx: Context<DistributeGuildRewards>,
    reward_distribution: RewardDistribution,
) -> Result<()>
```

**Guild System:**
```rust
#[account]
pub struct Guild {
    pub guild_id: String,
    pub name: String,
    pub founder: Pubkey,
    pub members: Vec<GuildMember>,
    pub total_mining_power: u64,
    pub guild_treasury: u64,
    pub competition_rank: u32,
    pub guild_achievements: Vec<String>,
    pub created_at: i64,
}
```

---

### 11. **neoengine-achievements** (Achievement System)

**Purpose**: Track achievements and mint badges to profile NFTs

**Key Features:**
- **Achievement Tracking**: Monitor progress across all activities
- **Badge Minting**: Permanent badges burned into profile NFTs
- **Milestone Rewards**: Bonus $DSX for achievement completion
- **Rare Achievements**: Exclusive badges for exceptional performance

**Core Functions:**
```rust
// Track achievement progress
pub fn track_progress(
    ctx: Context<TrackProgress>,
    achievement_id: String,
    progress_data: ProgressData,
) -> Result<()>

// Mint achievement badge
pub fn mint_badge(
    ctx: Context<MintBadge>,
    achievement_id: String,
    recipient: Pubkey,
) -> Result<()>

// Verify achievement completion
pub fn verify_achievement(
    ctx: Context<VerifyAchievement>,
    achievement_id: String,
    proof_data: AchievementProof,
) -> Result<()>
```

---

### 12. **neoengine-rewards** (NeoVault Protocol)

**Purpose**: Advanced reward distribution and asset management

**Key Features:**
- **NeoVault System**: Secure asset management and distribution
- **Multi-Source Rewards**: Aggregate rewards from all mining types
- **Staking Multipliers**: Lock $DSX for higher mining rewards
- **Premium Features**: Advanced analytics and priority support

**Core Functions:**
```rust
// Calculate comprehensive rewards
pub fn calculate_rewards(
    ctx: Context<CalculateRewards>,
    user: Pubkey,
    time_period: TimePeriod,
) -> Result<()>

// Distribute multi-source rewards
pub fn distribute_rewards(
    ctx: Context<DistributeRewards>,
    reward_calculation: RewardCalculation,
) -> Result<()>

// Manage staking multipliers
pub fn manage_staking(
    ctx: Context<ManageStaking>,
    stake_amount: u64,
    lock_duration: i64,
) -> Result<()>
```

---

## 🆔 Identity & Assets Contracts

### 13. **neoengine-identity** (SBT Handles)

**Purpose**: Soulbound token system for permanent @handle usernames

**Key Features:**
- **Soulbound Tokens**: Non-transferable identity tokens
- **Permanent Handles**: @usernames that can never be taken away
- **Handle History**: Track username changes over time
- **Cross-Platform Identity**: Works across all Web3 applications

**Core Functions:**
```rust
// Mint identity SBT
pub fn mint_identity(
    ctx: Context<MintIdentity>,
    handle: String,
) -> Result<()>

// Update handle (if allowed)
pub fn update_handle(
    ctx: Context<UpdateHandle>,
    new_handle: String,
) -> Result<()>

// Verify identity ownership
pub fn verify_identity(
    ctx: Context<VerifyIdentity>,
    handle: String,
) -> Result<bool>
```

---

### 14. **neoengine-profile** (Profile NFTs)

**Purpose**: Mutable Profile NFTs with IPFS metadata integration

**Key Features:**
- **Mutable Metadata**: Updateable profiles with IPFS images
- **Cosmetic Integration**: Equipment slots for cosmetic NFTs
- **Badge Display**: Show achievement badges permanently
- **Cross-App Compatibility**: Standard NFT format for interoperability

**Core Functions:**
```rust
// Create profile NFT
pub fn create_profile(
    ctx: Context<CreateProfile>,
    profile_data: ProfileData,
    ipfs_metadata_uri: String,
) -> Result<()>

// Update profile metadata
pub fn update_profile(
    ctx: Context<UpdateProfile>,
    new_metadata_uri: String,
    updated_fields: Vec<String>,
) -> Result<()>

// Equip cosmetic to profile
pub fn equip_cosmetic(
    ctx: Context<EquipCosmetic>,
    cosmetic_mint: Pubkey,
    equipment_slot: String,
) -> Result<()>
```

---

### 15. **neoengine-cosmetics** (Cosmetic System)

**Purpose**: Advanced cosmetic NFT system with staking mechanics

**Key Features:**
- **Template System**: Create cosmetic types with rarity tiers
- **Staking Mechanics**: Stake cosmetics to profiles for visual effects
- **Trading System**: Buy/sell/trade cosmetics (when not staked)
- **Collection System**: Group cosmetics into themed collections

**Core Functions:**
```rust
// Create cosmetic template
pub fn create_template(
    ctx: Context<CreateTemplate>,
    template_data: CosmeticTemplate,
) -> Result<()>

// Mint cosmetic from template
pub fn mint_cosmetic(
    ctx: Context<MintCosmetic>,
    template_id: String,
    recipient: Pubkey,
) -> Result<()>

// Stake cosmetic to profile
pub fn stake_cosmetic(
    ctx: Context<StakeCosmetic>,
    cosmetic_mint: Pubkey,
    profile_mint: Pubkey,
) -> Result<()>

// Unstake cosmetic from profile
pub fn unstake_cosmetic(
    ctx: Context<UnstakeCosmetic>,
    cosmetic_mint: Pubkey,
) -> Result<()>
```

---

## 🔗 Contract Integration Patterns

### **Cross-Contract Communication:**

**Resource Mining → Rewards:**
```rust
// Mining contracts report to rewards contract
let cpi_program = ctx.accounts.rewards_program.to_account_info();
let cpi_accounts = neoengine_rewards::cpi::accounts::RecordMiningReward {
    user: ctx.accounts.user.to_account_info(),
    rewards_account: ctx.accounts.rewards_account.to_account_info(),
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
neoengine_rewards::cpi::record_mining_reward(cpi_ctx, reward_amount)?;
```

**Achievements → Profile:**
```rust
// Achievement system updates profile
let cpi_program = ctx.accounts.profile_program.to_account_info();
let cpi_accounts = neoengine_profile::cpi::accounts::AwardBadge {
    profile: ctx.accounts.profile.to_account_info(),
    badge_mint: ctx.accounts.badge_mint.to_account_info(),
};
let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
neoengine_profile::cpi::award_badge(cpi_ctx, badge_data)?;
```

**Core → All Contracts:**
```rust
// Core contract coordinates everything
pub fn coordinate_multi_contract_operation(
    ctx: Context<CoordinateOperation>,
    operation: MultiContractOperation,
) -> Result<()> {
    match operation {
        MultiContractOperation::Mining => {
            // Coordinate with mining contracts
        },
        MultiContractOperation::Social => {
            // Coordinate with social contracts
        },
        MultiContractOperation::Rewards => {
            // Coordinate with rewards distribution
        },
    }
}
```

### **Event System:**

All contracts emit events for frontend integration:
```rust
#[event]
pub struct MiningRewardEarned {
    pub user: Pubkey,
    pub resource_type: ResourceType,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct AchievementUnlocked {
    pub user: Pubkey,
    pub achievement_id: String,
    pub badge_mint: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct GuildActivityUpdate {
    pub guild: Pubkey,
    pub activity_type: String,
    pub participants: Vec<Pubkey>,
    pub timestamp: i64,
}
```

---

## 🧪 Testing Architecture

### **Individual Contract Tests:**
```bash
# Test each contract independently
anchor test tests/cpu-mining.ts
anchor test tests/gpu-pooling.ts
anchor test tests/guild-system.ts
anchor test tests/achievement-tracking.ts
```

### **Integration Tests:**
```bash
# Test cross-contract interactions
anchor test tests/integration/mining-to-rewards.ts
anchor test tests/integration/social-to-achievements.ts
anchor test tests/integration/guild-coordination.ts
```

### **End-to-End Tests:**
```bash
# Test complete user flows
anchor test tests/e2e/new-user-onboarding.ts
anchor test tests/e2e/mining-workflow.ts
anchor test tests/e2e/guild-formation.ts
```

---

## 🚀 Deployment Strategy

### **Deployment Order:**
1. **Core Infrastructure** (Identity, Profile, Core)
2. **Resource Mining** (CPU, GPU, RAM, Storage, Bandwidth)
3. **Social & Economic** (Social, Guilds, Achievements, Rewards)
4. **Assets & Coordination** (Cosmetics, Linking, Resources)

### **Initialization Sequence:**
1. Deploy all contracts to cluster
2. Initialize core coordination systems
3. Set up cross-contract permissions
4. Create initial cosmetic templates
5. Initialize guild and achievement systems
6. Configure reward distribution parameters

---

**🎯 Result: A comprehensive 16-contract ecosystem that transforms mobile devices into nodes in the world's largest decentralized P2P infrastructure network, where users earn $DSX tokens while collectively building the future of Web3.**