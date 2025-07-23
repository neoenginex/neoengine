import { Connection, PublicKey, SystemProgram, Transaction, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Program IDs from Anchor.toml
const IDENTITY_PROGRAM_ID = new PublicKey('HaNDLe111111111111111111111111111111111111');
const USERNAME_PROGRAM_ID = new PublicKey('UsErNaMe11111111111111111111111111111111111');

// Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

// Solana connection - configure based on your network
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export interface IdentityInfo {
  wallet: PublicKey;
  currentUsername: string | null;
  usernameHistory: string[];
  createdAt: number;
  usernameChangeCount: number;
  maxUsernames: number;
}

export interface UsernameInfo {
  name: string;
  symbol: string;
  owner: PublicKey;
  isActive: boolean;
  assignedTo: PublicKey | null;
  claimedAt: number;
  transferCount: number;
}

export class NeoEngineIdentityContract {
  // Get the PDA for an identity account
  static getIdentityAccountPDA(userPublicKey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('identity'), userPublicKey.toBuffer()],
      IDENTITY_PROGRAM_ID
    );
  }

  // Check if user has an identity
  async hasIdentity(userPublicKey: PublicKey): Promise<boolean> {
    try {
      const [identityPDA] = NeoEngineIdentityContract.getIdentityAccountPDA(userPublicKey);
      const accountInfo = await connection.getAccountInfo(identityPDA);
      return accountInfo !== null;
    } catch (error) {
      console.error('Error checking identity:', error);
      return false;
    }
  }

  // Get identity information
  async getIdentityInfo(userPublicKey: PublicKey): Promise<IdentityInfo | null> {
    try {
      const [identityPDA] = NeoEngineIdentityContract.getIdentityAccountPDA(userPublicKey);
      const accountInfo = await connection.getAccountInfo(identityPDA);
      
      if (!accountInfo) {
        return null;
      }

      // TODO: Implement proper deserialization using Anchor IDL
      // This is a placeholder - you'll need to use the actual program instance
      console.log('Identity account found, implement deserialization');
      return null;
    } catch (error) {
      console.error('Error getting identity info:', error);
      return null;
    }
  }

  // Create identity SBT
  async createIdentity(
    userKeypair: Keypair,
    usernameLimit: number = 5,
    changeCooldownHours: number = 24
  ): Promise<string | null> {
    try {
      const [identityPDA, identityBump] = NeoEngineIdentityContract.getIdentityAccountPDA(userKeypair.publicKey);
      
      // Create mint for the SBT
      const mintKeypair = Keypair.generate();
      
      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        userKeypair.publicKey
      );

      // Get metadata PDA
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // TODO: Create the actual instruction using Anchor program
      // This is pseudocode - you'll need to use the actual program instance
      console.log('Creating identity SBT transaction');
      console.log('Identity PDA:', identityPDA.toString());
      console.log('Mint:', mintKeypair.publicKey.toString());
      console.log('Token Account:', tokenAccount.toString());
      console.log('Metadata PDA:', metadataPDA.toString());

      // Return a placeholder signature for now
      return 'placeholder_signature';
    } catch (error) {
      console.error('Error creating identity:', error);
      return null;
    }
  }
}

export class NeoEngineUsernameContract {
  // Get the PDA for username registry
  static getUsernameRegistryPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('username_registry')],
      USERNAME_PROGRAM_ID
    );
  }

  // Get the PDA for a username account
  static getUsernameAccountPDA(username: string): [PublicKey, number] {
    // Ensure username starts with @ for blockchain storage
    const fullUsername = username.startsWith('@') ? username : `@${username}`;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('username'), Buffer.from(fullUsername)],
      USERNAME_PROGRAM_ID
    );
  }

  // Check if a username is available
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const [usernameAccountPDA] = NeoEngineUsernameContract.getUsernameAccountPDA(username);
      const accountInfo = await connection.getAccountInfo(usernameAccountPDA);
      
      // If account doesn't exist, username is available
      return accountInfo === null;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  // Get username information
  async getUsernameInfo(username: string): Promise<UsernameInfo | null> {
    try {
      const [usernameAccountPDA] = NeoEngineUsernameContract.getUsernameAccountPDA(username);
      const accountInfo = await connection.getAccountInfo(usernameAccountPDA);
      
      if (!accountInfo) {
        return null;
      }

      // TODO: Implement proper deserialization using Anchor IDL
      // This is a placeholder - you'll need to use the actual program instance
      console.log('Username account found, implement deserialization');
      return null;
    } catch (error) {
      console.error('Error getting username info:', error);
      return null;
    }
  }

  // Claim a username NFT
  async claimUsername(
    userKeypair: Keypair,
    username: string,
    symbol: string = 'USERNAME'
  ): Promise<string | null> {
    try {
      const [registryPDA] = NeoEngineUsernameContract.getUsernameRegistryPDA();
      const [usernameAccountPDA, usernameBump] = NeoEngineUsernameContract.getUsernameAccountPDA(username);
      
      // Create mint for the NFT
      const mintKeypair = Keypair.generate();
      
      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        userKeypair.publicKey
      );

      // Get metadata PDA
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // TODO: Create the actual instruction using Anchor program
      // This is pseudocode - you'll need to use the actual program instance
      console.log('Creating username NFT transaction');
      console.log('Registry PDA:', registryPDA.toString());
      console.log('Username PDA:', usernameAccountPDA.toString());
      console.log('Mint:', mintKeypair.publicKey.toString());
      console.log('Token Account:', tokenAccount.toString());
      console.log('Metadata PDA:', metadataPDA.toString());

      // Return a placeholder signature for now
      return 'placeholder_signature';
    } catch (error) {
      console.error('Error claiming username:', error);
      return null;
    }
  }

  // Activate username (link to identity)
  async activateUsername(
    userKeypair: Keypair,
    username: string,
    identityPubkey: PublicKey
  ): Promise<string | null> {
    try {
      const [usernameAccountPDA] = NeoEngineUsernameContract.getUsernameAccountPDA(username);

      // TODO: Create the actual instruction using Anchor program
      console.log('Activating username:', username);
      console.log('Username PDA:', usernameAccountPDA.toString());
      console.log('Identity:', identityPubkey.toString());

      return 'placeholder_signature';
    } catch (error) {
      console.error('Error activating username:', error);
      return null;
    }
  }

  // Validate username format (input without @, will be stored with @)
  static validateUsername(username: string): { isValid: boolean; error?: string } {
    // Don't allow @ in input - it's automatically added
    if (username.includes('@')) {
      return { isValid: false, error: "Don't include @ - it's added automatically" };
    }

    if (username.length < 3 || username.length > 20) {
      return { isValid: false, error: 'Username must be 3-20 characters' };
    }

    const validCharacters = /^[a-zA-Z0-9._-]+$/;
    if (!validCharacters.test(username)) {
      return { 
        isValid: false, 
        error: "Username can only contain letters, numbers '.' '_' '-'" 
      };
    }

    return { isValid: true };
  }
}

// Utility functions for React Native components
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    // For now, return fake availability for testing
    // TODO: Implement actual blockchain checking when contracts are deployed
    console.log('Checking username availability (FAKE):', username);
    
    // Simulate some taken usernames for testing
    const takenUsernames = ['admin', 'test', 'user', 'demo', 'neoengine'];
    const isAvailable = !takenUsernames.includes(username.toLowerCase());
    
    // Add a small delay to simulate network call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return isAvailable;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};

export const validateUsernameFormat = (username: string): { isValid: boolean; error?: string } => {
  return NeoEngineUsernameContract.validateUsername(username);
};

export const createIdentitySBT = async (
  userKeypair: any,
  usernameLimit?: number,
  changeCooldownHours?: number
): Promise<string | null> => {
  try {
    // Fake implementation for testing
    console.log('Creating identity SBT (FAKE)');
    console.log('Username limit:', usernameLimit);
    console.log('Cooldown hours:', changeCooldownHours);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'fake_identity_signature_' + Date.now();
  } catch (error) {
    console.error('Error creating identity SBT:', error);
    return null;
  }
};

export const claimUsernameNFT = async (
  userKeypair: any,
  username: string,
  symbol?: string
): Promise<string | null> => {
  try {
    // Fake implementation for testing
    console.log('Claiming username NFT (FAKE):', username);
    console.log('Symbol:', symbol);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'fake_username_signature_' + Date.now();
  } catch (error) {
    console.error('Error claiming username NFT:', error);
    return null;
  }
};

export const linkUsernameToIdentity = async (
  userKeypair: any,
  username: string,
  identityPubkey: any
): Promise<string | null> => {
  try {
    // Fake implementation for testing
    console.log('Linking username to identity (FAKE):', username);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return 'fake_link_signature_' + Date.now();
  } catch (error) {
    console.error('Error linking username to identity:', error);
    return null;
  }
};