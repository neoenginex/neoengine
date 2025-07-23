import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

export enum RewardType {
  DailyContribution = 'DailyContribution',
  Referral = 'Referral',
  ContentEngagement = 'ContentEngagement',
  CommunityParticipation = 'CommunityParticipation',
}

export class DsxScoringClient {
  constructor(
    private program: Program,
    private provider: anchor.AnchorProvider
  ) {}

  /**
   * Initialize user's scoring account
   */
  async initializeUserScoring(): Promise<string> {
    const wallet = this.provider.wallet;
    
    const [userScoring] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_scoring"), wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .initializeUserScoring()
      .accounts({
        user: wallet.publicKey,
        userScoring,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  }

  /**
   * Claim daily contribution reward
   */
  async claimDailyContribution(): Promise<string> {
    const wallet = this.provider.wallet;
    
    const [userScoring] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_scoring"), wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const [scoringConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoring")],
      this.program.programId
    );

    const configData = await this.program.account.scoringConfig.fetch(scoringConfig);
    const dsxMint = configData.dsxMint;

    const userTokenAccount = await getAssociatedTokenAddress(
      dsxMint,
      wallet.publicKey
    );

    const tx = await this.program.methods
      .rewardDailyContribution()
      .accounts({
        user: wallet.publicKey,
        userScoring,
        scoringConfig,
        dsxMint,
        userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Claim referral reward
   */
  async claimReferralReward(referredUser: PublicKey): Promise<string> {
    const wallet = this.provider.wallet;
    
    const [userScoring] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_scoring"), wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const [scoringConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoring")],
      this.program.programId
    );

    const configData = await this.program.account.scoringConfig.fetch(scoringConfig);
    const dsxMint = configData.dsxMint;

    const userTokenAccount = await getAssociatedTokenAddress(
      dsxMint,
      wallet.publicKey
    );

    const tx = await this.program.methods
      .rewardReferral(referredUser)
      .accounts({
        user: wallet.publicKey,
        userScoring,
        scoringConfig,
        dsxMint,
        userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Claim content engagement reward
   */
  async claimContentEngagementReward(engagementScore: number): Promise<string> {
    const wallet = this.provider.wallet;
    
    const [userScoring] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_scoring"), wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const [scoringConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoring")],
      this.program.programId
    );

    const configData = await this.program.account.scoringConfig.fetch(scoringConfig);
    const dsxMint = configData.dsxMint;

    const userTokenAccount = await getAssociatedTokenAddress(
      dsxMint,
      wallet.publicKey
    );

    const tx = await this.program.methods
      .rewardContentEngagement(new anchor.BN(engagementScore))
      .accounts({
        user: wallet.publicKey,
        userScoring,
        scoringConfig,
        dsxMint,
        userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Claim community participation reward
   */
  async claimCommunityParticipationReward(participationPoints: number): Promise<string> {
    const wallet = this.provider.wallet;
    
    const [userScoring] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_scoring"), wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const [scoringConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoring")],
      this.program.programId
    );

    const configData = await this.program.account.scoringConfig.fetch(scoringConfig);
    const dsxMint = configData.dsxMint;

    const userTokenAccount = await getAssociatedTokenAddress(
      dsxMint,
      wallet.publicKey
    );

    const tx = await this.program.methods
      .rewardCommunityParticipation(new anchor.BN(participationPoints))
      .accounts({
        user: wallet.publicKey,
        userScoring,
        scoringConfig,
        dsxMint,
        userTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Get user's scoring data
   */
  async getUserScoring(userPublicKey?: PublicKey): Promise<any> {
    const targetKey = userPublicKey || this.provider.wallet.publicKey;
    
    const [userScoring] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_scoring"), targetKey.toBuffer()],
      this.program.programId
    );

    try {
      const scoringData = await this.program.account.userScoring.fetch(userScoring);
      return scoringData;
    } catch (error) {
      console.error("User scoring not found:", error);
      return null;
    }
  }

  /**
   * Get user's reputation score
   */
  async getReputationScore(userPublicKey?: PublicKey): Promise<number> {
    const targetKey = userPublicKey || this.provider.wallet.publicKey;
    
    const [userScoring] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_scoring"), targetKey.toBuffer()],
      this.program.programId
    );

    try {
      const result = await this.program.methods
        .getReputationScore()
        .accounts({
          user: targetKey,
          userScoring,
        })
        .view();

      return result.toNumber();
    } catch (error) {
      console.error("Error getting reputation score:", error);
      return 0;
    }
  }

  /**
   * Get DSX token balance
   */
  async getDsxBalance(userPublicKey?: PublicKey): Promise<number> {
    const targetKey = userPublicKey || this.provider.wallet.publicKey;
    
    const [scoringConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("scoring")],
      this.program.programId
    );

    const configData = await this.program.account.scoringConfig.fetch(scoringConfig);
    const dsxMint = configData.dsxMint;

    const userTokenAccount = await getAssociatedTokenAddress(
      dsxMint,
      targetKey
    );

    try {
      const balance = await this.provider.connection.getTokenAccountBalance(userTokenAccount);
      return balance.value.uiAmount || 0;
    } catch (error) {
      console.error("Error getting DSX balance:", error);
      return 0;
    }
  }

  /**
   * Check if user can claim daily reward
   */
  async canClaimDailyReward(): Promise<boolean> {
    const userScoring = await this.getUserScoring();
    if (!userScoring) return false;

    const currentDay = Math.floor(Date.now() / 1000 / 86400);
    return userScoring.lastDailyContribution.toNumber() !== currentDay;
  }
}

// React Native hook
export const useDsxScoring = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const getScoringClient = useCallback(() => {
    if (!publicKey || !signTransaction) return null;

    const provider = new anchor.AnchorProvider(
      connection,
      { publicKey, signTransaction } as any,
      { commitment: "confirmed" }
    );

    const program = new Program(DSX_IDL, DSX_SCORING_PROGRAM_ID, provider);
    return new DsxScoringClient(program, provider);
  }, [connection, publicKey, signTransaction]);

  const initializeScoring = useCallback(async () => {
    const client = getScoringClient();
    if (!client) throw new Error("Wallet not connected");

    return await client.initializeUserScoring();
  }, [getScoringClient]);

  const claimDailyReward = useCallback(async () => {
    const client = getScoringClient();
    if (!client) throw new Error("Wallet not connected");

    return await client.claimDailyContribution();
  }, [getScoringClient]);

  const claimReferralReward = useCallback(async (referredUser: PublicKey) => {
    const client = getScoringClient();
    if (!client) throw new Error("Wallet not connected");

    return await client.claimReferralReward(referredUser);
  }, [getScoringClient]);

  const getUserStats = useCallback(async (userPublicKey?: PublicKey) => {
    const client = getScoringClient();
    if (!client) throw new Error("Wallet not connected");

    const [scoring, reputation, balance] = await Promise.all([
      client.getUserScoring(userPublicKey),
      client.getReputationScore(userPublicKey),
      client.getDsxBalance(userPublicKey),
    ]);

    return {
      scoring,
      reputation,
      dsxBalance: balance,
    };
  }, [getScoringClient]);

  return {
    initializeScoring,
    claimDailyReward,
    claimReferralReward,
    getUserStats,
    isConnected: !!publicKey,
  };
};