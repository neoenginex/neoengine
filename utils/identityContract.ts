import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

// DEPLOYED PROGRAM ID
export const IDENTITY_PROGRAM_ID = new PublicKey("3WqyodBsbZHiG2ncJs7vasmvRF4oTcEcoZJEyY6UaRxN");

export interface UsernameInfo {
  owner: PublicKey;
  username: string;
  createdAt: number;
}

export class IdentityService {
  private connection: Connection;
  private programId: PublicKey;

  constructor(connection: Connection, programId: PublicKey = IDENTITY_PROGRAM_ID) {
    this.connection = connection;
    this.programId = programId;
  }

  /**
   * Get the PDA address for a username account
   */
  static getUsernamePDA(username: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("username"), Buffer.from(username, 'utf8')],
      IDENTITY_PROGRAM_ID
    );
  }

  /**
   * Get the PDA address for the mint
   */
  static getMintPDA(username: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), Buffer.from(username, 'utf8')],
      IDENTITY_PROGRAM_ID
    );
  }

  /**
   * Create a new username soulbound token
   */
  async createUsername(
    walletAddress: PublicKey,
    username: string
  ): Promise<Transaction> {
    const [usernamePDA] = IdentityService.getUsernamePDA(username);
    const [mintPDA] = IdentityService.getMintPDA(username);
    const tokenAccount = await getAssociatedTokenAddress(mintPDA, walletAddress);

    const transaction = new Transaction();
    
    // Serialize the username
    const usernameBuffer = Buffer.from(username, 'utf8');
    const instructionData = new Uint8Array([
      0, // create_username instruction discriminator
      ...new Uint8Array(new Uint32Array([usernameBuffer.length]).buffer), // String length as 4-byte little-endian
      ...usernameBuffer,
    ]);

    // Create the username instruction
    const createUsernameIx = new TransactionInstruction({
      keys: [
        { pubkey: walletAddress, isSigner: true, isWritable: true }, // user
        { pubkey: usernamePDA, isSigner: false, isWritable: true }, // username_account
        { pubkey: mintPDA, isSigner: false, isWritable: true }, // mint
        { pubkey: tokenAccount, isSigner: false, isWritable: true }, // token_account
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // token_program
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      ],
      programId: this.programId,
      data: instructionData,
    });

    transaction.add(createUsernameIx);
    return transaction;
  }

  /**
   * Check if a username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const [usernamePDA] = IdentityService.getUsernamePDA(username);
      const accountInfo = await this.connection.getAccountInfo(usernamePDA);
      return accountInfo === null; // Available if account doesn't exist
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }

  /**
   * Get username information
   */
  async getUsernameInfo(username: string): Promise<UsernameInfo | null> {
    try {
      const [usernamePDA] = IdentityService.getUsernamePDA(username);
      const accountInfo = await this.connection.getAccountInfo(usernamePDA);
      
      if (!accountInfo) {
        return null;
      }

      // Parse the account data - simplified parsing
      // In production, you'd use the generated IDL types
      const data = accountInfo.data;
      
      // Skip discriminator (8 bytes) and parse the account
      let offset = 8;
      
      // owner: Pubkey (32 bytes)
      const owner = new PublicKey(data.subarray(offset, offset + 32));
      offset += 32;
      
      // username: String (4 bytes length + content)
      const usernameLength = data.readUInt32LE(offset);
      offset += 4;
      const usernameStr = data.subarray(offset, offset + usernameLength).toString();
      offset += usernameLength;
      
      // Skip mint (32 bytes)
      offset += 32;
      
      // created_at: i64 (8 bytes)
      const createdAt = Number(data.readBigInt64LE(offset));
      
      return {
        owner,
        username: usernameStr,
        createdAt,
      };
    } catch (error) {
      console.error('Error fetching username info:', error);
      return null;
    }
  }

  /**
   * Check if a wallet owns a specific username
   */
  async doesWalletOwnUsername(walletAddress: PublicKey, username: string): Promise<boolean> {
    const info = await this.getUsernameInfo(username);
    return info ? info.owner.equals(walletAddress) : false;
  }

  /**
   * Get all usernames owned by a wallet (expensive operation)
   * In production, you'd maintain an index or use program logs
   */
  async getUsernamesOwnedByWallet(_walletAddress: PublicKey): Promise<string[]> {
    // This is a placeholder - in reality you'd need to maintain an index
    // or parse program logs to efficiently find all usernames owned by a wallet
    console.warn('getUsernamesOwnedByWallet is not efficiently implemented');
    return [];
  }
}

export default IdentityService;