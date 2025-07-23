import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { uploadProfileMetadataToIPFS, ProfileMetadata } from './ipfs';
import usernameStorage from './usernameStorage';

// Profile Program ID - TODO: Update when deployed
export const PROFILE_PROGRAM_ID = new PublicKey("DfgjPKaYeRdCt6L1eaUpQrU7uRM1bdshgSVJRihfmqas");

// Metaplex Token Metadata Program ID
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

export interface ProfileInfo {
  owner: PublicKey;
  sbtHandle: string;
  metadataUri: string;
  createdAt: number;
  updatedAt: number;
  updateCount: number;
}

export interface CreateProfileParams {
  profileData: Omit<ProfileMetadata, 'sbt_handle' | 'attributes' | 'created_at' | 'updated_at'>;
  profileImageCid?: string;
  bannerImageCid?: string;
}

export class ProfileService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey = PROFILE_PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  /**
   * Get the PDA address for a profile state account
   */
  static getProfileStatePDA(owner: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), owner.toBytes()],
      PROFILE_PROGRAM_ID
    );
  }

  /**
   * Get the metadata account PDA for a mint
   */
  static getMetadataPDA(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBytes(),
        mint.toBytes(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
  }

  /**
   * Calculate profile creation fee
   */
  async calculateProfileFee(): Promise<number> {
    // Base cost calculation from smart contract:
    // - Solana transaction: ~0.001 SOL
    // - IPFS pinning cost: ~0.01 SOL
    // - Platform fee: ~0.005 SOL
    // Total: ~0.016 SOL
    return 16_000_000; // 0.016 SOL in lamports
  }

  /**
   * Create a new Profile (simplified - no NFT)
   */
  async createProfile(
    walletAddress: PublicKey,
    params: CreateProfileParams
  ): Promise<Transaction> {
    console.log('🎨 Creating Profile for:', walletAddress.toString());

    // Get the username from storage
    const username = await usernameStorage.getUsernameForWallet(walletAddress.toString());
    if (!username) {
      throw new Error('Username not found. Please create a username first.');
    }

    // Create complete metadata object
    const currentTime = Date.now();
    const profileMetadata: ProfileMetadata = {
      ...params.profileData,
      sbt_handle: username,
      image: params.profileImageCid,
      banner: params.bannerImageCid,
      attributes: [
        {
          trait_type: "Profile Type",
          value: "NeoEngine User"
        },
        {
          trait_type: "Created",
          value: currentTime
        }
      ],
      created_at: currentTime,
      updated_at: currentTime,
    };

    // Upload metadata to IPFS
    console.log('📌 Uploading profile metadata to IPFS...');
    const metadataResult = await uploadProfileMetadataToIPFS(profileMetadata);
    const metadataUri = `https://gateway.pinata.cloud/ipfs/${metadataResult.cid}`;

    // Generate accounts
    const [profileStatePDA] = ProfileService.getProfileStatePDA(walletAddress);

    const transaction = new Transaction();

    // Serialize instruction data for create_profile
    const metadataUriBuffer = Buffer.from(metadataUri, 'utf8');
    const sbtHandleBuffer = Buffer.from(username, 'utf8');
    
    const instructionData = Buffer.concat([
      Buffer.from([0]), // create_profile instruction discriminator
      // metadata_uri: String
      Buffer.from(new Uint8Array(new Uint32Array([metadataUriBuffer.length]).buffer)),
      metadataUriBuffer,
      // sbt_handle: String  
      Buffer.from(new Uint8Array(new Uint32Array([sbtHandleBuffer.length]).buffer)),
      sbtHandleBuffer,
    ]);

    // Create the profile instruction
    const createProfileIx = new TransactionInstruction({
      keys: [
        { pubkey: walletAddress, isSigner: true, isWritable: true }, // owner
        { pubkey: profileStatePDA, isSigner: false, isWritable: true }, // profile_state
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      programId: this.programId,
      data: instructionData,
    });

    transaction.add(createProfileIx);

    console.log('✅ Profile transaction created');
    console.log('📍 Profile State PDA:', profileStatePDA.toString());
    console.log('📍 Metadata URI:', metadataUri);

    return transaction;
  }

  /**
   * Update Profile metadata
   */
  async updateProfileMetadata(
    walletAddress: PublicKey,
    params: CreateProfileParams
  ): Promise<Transaction> {
    console.log('🔄 Updating Profile for:', walletAddress.toString());

    // Get existing profile info
    const profileInfo = await this.getProfileInfo(walletAddress);
    if (!profileInfo) {
      throw new Error('Profile not found. Please create a profile first.');
    }

    // Create updated metadata
    const currentTime = Date.now();
    const profileMetadata: ProfileMetadata = {
      ...params.profileData,
      sbt_handle: profileInfo.sbtHandle,
      image: params.profileImageCid,
      banner: params.bannerImageCid,
      attributes: [
        {
          trait_type: "Profile Type",
          value: "NeoEngine User"
        },
        {
          trait_type: "Updated",
          value: currentTime
        },
        {
          trait_type: "Update Count",
          value: profileInfo.updateCount + 1
        }
      ],
      created_at: profileInfo.createdAt,
      updated_at: currentTime,
    };

    // Upload updated metadata to IPFS
    console.log('📌 Uploading updated metadata to IPFS...');
    const metadataResult = await uploadProfileMetadataToIPFS(profileMetadata);
    const newMetadataUri = `https://gateway.pinata.cloud/ipfs/${metadataResult.cid}`;

    // Generate accounts
    const [profileStatePDA] = ProfileService.getProfileStatePDA(walletAddress);

    const transaction = new Transaction();

    // Serialize instruction data for update_profile
    const metadataUriBuffer = Buffer.from(newMetadataUri, 'utf8');
    const instructionData = Buffer.concat([
      Buffer.from([1]), // update_profile instruction discriminator
      // new_metadata_uri: String
      Buffer.from(new Uint8Array(new Uint32Array([metadataUriBuffer.length]).buffer)),
      metadataUriBuffer,
    ]);

    // Update profile instruction
    const updateProfileIx = new TransactionInstruction({
      keys: [
        { pubkey: walletAddress, isSigner: true, isWritable: true }, // owner
        { pubkey: profileStatePDA, isSigner: false, isWritable: true }, // profile_state
      ],
      programId: this.programId,
      data: instructionData,
    });

    transaction.add(updateProfileIx);

    console.log('✅ Profile update transaction created');
    console.log('📍 New Metadata URI:', newMetadataUri);

    return transaction;
  }

  /**
   * Get profile information from blockchain
   */
  async getProfileInfo(walletAddress: PublicKey): Promise<ProfileInfo | null> {
    try {
      const [profileStatePDA] = ProfileService.getProfileStatePDA(walletAddress);
      const accountInfo = await this.connection.getAccountInfo(profileStatePDA);
      
      if (!accountInfo) {
        return null;
      }

      // Parse the account data
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator

      // owner: Pubkey (32 bytes)
      const owner = new PublicKey(data.subarray(offset, offset + 32));
      offset += 32;

      // sbt_handle: String (4 bytes length + content)
      const sbtHandleLength = data.readUInt32LE(offset);
      offset += 4;
      const sbtHandle = data.subarray(offset, offset + sbtHandleLength).toString();
      offset += sbtHandleLength;

      // metadata_uri: String (4 bytes length + content)
      const metadataUriLength = data.readUInt32LE(offset);
      offset += 4;
      const metadataUri = data.subarray(offset, offset + metadataUriLength).toString();
      offset += metadataUriLength;

      // created_at: i64 (8 bytes)
      const createdAt = Number(data.readBigInt64LE(offset));
      offset += 8;

      // updated_at: i64 (8 bytes)
      const updatedAt = Number(data.readBigInt64LE(offset));
      offset += 8;

      // update_count: u32 (4 bytes)
      const updateCount = data.readUInt32LE(offset);

      return {
        owner,
        sbtHandle,
        metadataUri,
        createdAt,
        updatedAt,
        updateCount,
      };
    } catch (error) {
      console.error('Error fetching profile info:', error);
      return null;
    }
  }

  /**
   * Check if a wallet has a profile
   */
  async hasProfile(walletAddress: PublicKey): Promise<boolean> {
    const profileInfo = await this.getProfileInfo(walletAddress);
    return profileInfo !== null;
  }

  /**
   * Get profile metadata from IPFS
   */
  async getProfileMetadata(walletAddress: PublicKey): Promise<ProfileMetadata | null> {
    try {
      const profileInfo = await this.getProfileInfo(walletAddress);
      if (!profileInfo) {
        return null;
      }

      // Extract CID from IPFS URL
      const cid = profileInfo.metadataUri.replace('https://gateway.pinata.cloud/ipfs/', '');
      
      const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.statusText}`);
      }

      const metadata = await response.json();
      return metadata as ProfileMetadata;
    } catch (error) {
      console.error('Error fetching profile metadata:', error);
      return null;
    }
  }

  /**
   * Pay profile creation/update fee
   */
  async payProfileFee(
    walletAddress: PublicKey,
    treasuryAddress: PublicKey = new PublicKey("11111111111111111111111111111112") // System program as placeholder
  ): Promise<Transaction> {
    const transaction = new Transaction();

    // Serialize instruction data for pay_profile_fee
    const instructionData = Buffer.from([2]); // pay_profile_fee instruction discriminator

    const payFeeIx = new TransactionInstruction({
      keys: [
        { pubkey: walletAddress, isSigner: true, isWritable: true }, // user
        { pubkey: treasuryAddress, isSigner: false, isWritable: true }, // treasury
      ],
      programId: this.programId,
      data: instructionData,
    });

    transaction.add(payFeeIx);
    return transaction;
  }
}

export default ProfileService;