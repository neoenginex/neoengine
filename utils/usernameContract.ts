import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor';

// Program ID from your smart contract
const PROGRAM_ID = new PublicKey('E9L1ZJyiVugoSjfqyfvch5XMXfvJ9FF56hCmpHYhSrqu');

// Solana connection - you'll need to configure this based on your network
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

export interface UsernameInfo {
  username: string;
  owner: PublicKey;
  forSale: boolean;
  price: number;
  timestamp: number;
}

export class UsernameContract {
  constructor(private provider: AnchorProvider) {}

  // Get the PDA for a username account
  static getUsernameAccountPDA(username: string): [PublicKey, number] {
    // Ensure username starts with @ for blockchain storage
    const fullUsername = username.startsWith('@') ? username : `@${username}`;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('username'), Buffer.from(fullUsername)],
      PROGRAM_ID
    );
  }

  // Get the PDA for a user account
  static getUserAccountPDA(userPublicKey: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), userPublicKey.toBuffer()],
      PROGRAM_ID
    );
  }

  // Check if a username is available
  async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      // Username will be stored with @ prefix on blockchain
      const [usernameAccountPDA] = UsernameContract.getUsernameAccountPDA(username);
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
      const [usernameAccountPDA] = UsernameContract.getUsernameAccountPDA(username);
      const accountInfo = await connection.getAccountInfo(usernameAccountPDA);
      
      if (!accountInfo) {
        return null;
      }

      // Deserialize the account data (you'll need to implement proper deserialization)
      // This is a simplified version - you'll need to use your program's IDL
      const data = accountInfo.data;
      
      // Parse the account data according to your UsernameAccount struct
      // This is pseudocode - you'll need to implement proper binary deserialization
      const usernameInfo: UsernameInfo = {
        username: username,
        owner: new PublicKey(data.slice(8, 40)), // Skip discriminator, read pubkey
        forSale: data[72] === 1, // Boolean field
        price: new BN(data.slice(73, 81), 'le').toNumber(), // u64 price
        timestamp: new BN(data.slice(40, 48), 'le').toNumber(), // i64 timestamp
      };

      return usernameInfo;
    } catch (error) {
      console.error('Error getting username info:', error);
      return null;
    }
  }

  // Claim a username
  async claimUsername(username: string, userKeypair: web3.Keypair): Promise<string | null> {
    try {
      const [usernameAccountPDA] = UsernameContract.getUsernameAccountPDA(username);
      const [userAccountPDA] = UsernameContract.getUserAccountPDA(userKeypair.publicKey);

      // Create the instruction using your program's IDL
      // This is pseudocode - you'll need to use the actual Anchor program instance
      const instruction = {
        accounts: {
          usernameAccount: usernameAccountPDA,
          userAccount: userAccountPDA,
          user: userKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        },
        data: {
          username: username,
        }
      };

      const transaction = new Transaction().add(instruction as any);
      
      const signature = await connection.sendTransaction(
        transaction,
        [userKeypair],
        { commitment: 'confirmed' }
      );

      return signature;
    } catch (error) {
      console.error('Error claiming username:', error);
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

// Utility function for React Native components
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    // Username will be checked with @ prefix on blockchain
    const [usernameAccountPDA] = UsernameContract.getUsernameAccountPDA(username);
    const accountInfo = await connection.getAccountInfo(usernameAccountPDA);
    return accountInfo === null;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
};

export const validateUsernameFormat = (username: string): { isValid: boolean; error?: string } => {
  return UsernameContract.validateUsername(username);
};