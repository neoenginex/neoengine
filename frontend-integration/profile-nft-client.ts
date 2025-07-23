import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export interface ProfileData {
  name: string;
  displayName: string;
  bio: string;
  link: string;
  pfpCid: string;
  bannerCid: string;
}

export class ProfileNftClient {
  constructor(
    private program: Program,
    private provider: anchor.AnchorProvider
  ) {}

  /**
   * Create a new profile NFT
   */
  async createProfileNft(profileData: ProfileData): Promise<string> {
    const wallet = this.provider.wallet;
    const mint = Keypair.generate();
    
    // Derive PDAs
    const [profileAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );

    const tokenAccount = await getAssociatedTokenAddress(
      mint.publicKey,
      wallet.publicKey
    );

    // Convert to program format
    const profileDataFormatted = {
      name: profileData.name,
      displayName: profileData.displayName,
      bio: profileData.bio,
      link: profileData.link,
      pfpCid: profileData.pfpCid,
      bannerCid: profileData.bannerCid,
    };

    const tx = await this.program.methods
      .createProfileNft(profileDataFormatted)
      .accounts({
        payer: wallet.publicKey,
        mint: mint.publicKey,
        tokenAccount,
        metadata,
        profileAccount,
        metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();

    return tx;
  }

  /**
   * Update an existing profile NFT
   */
  async updateProfileNft(profileData: ProfileData): Promise<string> {
    const wallet = this.provider.wallet;
    
    // Get the profile account to find the mint
    const [profileAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), wallet.publicKey.toBuffer()],
      this.program.programId
    );

    const profileAccountData = await this.program.account.profileAccount.fetch(profileAccount);
    const mint = profileAccountData.mint;

    const [metadata] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );

    const profileDataFormatted = {
      name: profileData.name,
      displayName: profileData.displayName,
      bio: profileData.bio,
      link: profileData.link,
      pfpCid: profileData.pfpCid,
      bannerCid: profileData.bannerCid,
    };

    const tx = await this.program.methods
      .updateProfileNft(profileDataFormatted)
      .accounts({
        owner: wallet.publicKey,
        mint,
        metadata,
        profileAccount,
        metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
      })
      .rpc();

    return tx;
  }

  /**
   * Get profile data for a user
   */
  async getProfile(userPublicKey: PublicKey): Promise<any> {
    const [profileAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), userPublicKey.toBuffer()],
      this.program.programId
    );

    try {
      const profileData = await this.program.account.profileAccount.fetch(profileAccount);
      return profileData;
    } catch (error) {
      console.error("Profile not found:", error);
      return null;
    }
  }

  /**
   * Check if user has a profile
   */
  async hasProfile(userPublicKey: PublicKey): Promise<boolean> {
    const profile = await this.getProfile(userPublicKey);
    return profile !== null;
  }
}

// Usage example for React Native
export const useProfileNft = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const getProfileClient = useCallback(() => {
    if (!publicKey || !signTransaction) return null;

    const provider = new anchor.AnchorProvider(
      connection,
      { publicKey, signTransaction } as any,
      { commitment: "confirmed" }
    );

    const program = new Program(IDL, PROFILE_NFT_PROGRAM_ID, provider);
    return new ProfileNftClient(program, provider);
  }, [connection, publicKey, signTransaction]);

  const createProfile = useCallback(async (profileData: ProfileData) => {
    const client = getProfileClient();
    if (!client) throw new Error("Wallet not connected");

    return await client.createProfileNft(profileData);
  }, [getProfileClient]);

  const updateProfile = useCallback(async (profileData: ProfileData) => {
    const client = getProfileClient();
    if (!client) throw new Error("Wallet not connected");

    return await client.updateProfileNft(profileData);
  }, [getProfileClient]);

  const getProfile = useCallback(async (userPublicKey?: PublicKey) => {
    const client = getProfileClient();
    if (!client) throw new Error("Wallet not connected");

    const targetKey = userPublicKey || publicKey;
    if (!targetKey) throw new Error("No public key provided");

    return await client.getProfile(targetKey);
  }, [getProfileClient, publicKey]);

  return {
    createProfile,
    updateProfile,
    getProfile,
    isConnected: !!publicKey,
  };
};