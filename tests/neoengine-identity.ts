import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NeoengineIdentity } from "../target/types/neoengine_identity";
import { NeoengineUsernames } from "../target/types/neoengine_usernames";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { expect } from "chai";

describe("NeoEngine Identity & Username System", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const identityProgram = anchor.workspace.NeoengineIdentity as Program<NeoengineIdentity>;
  const usernameProgram = anchor.workspace.NeoengineUsernames as Program<NeoengineUsernames>;

  // Test accounts
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  const authority = Keypair.generate();

  // PDAs
  let identityPda: PublicKey;
  let identityBump: number;
  let usernameRegistryPda: PublicKey;
  let usernameRegistryBump: number;
  let usernamePda: PublicKey;
  let usernameBump: number;

  // Mint and token accounts
  let identityMint: Keypair;
  let usernameMint: Keypair;
  let identityTokenAccount: PublicKey;
  let usernameTokenAccount: PublicKey;

  const testUsername = "@testuser";
  const testSymbol = "TEST";

  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(user1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(authority.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for confirmations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDAs
    [identityPda, identityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("identity"), user1.publicKey.toBuffer()],
      identityProgram.programId
    );

    [usernameRegistryPda, usernameRegistryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("username_registry")],
      usernameProgram.programId
    );

    [usernamePda, usernameBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("username"), Buffer.from(testUsername)],
      usernameProgram.programId
    );

    // Generate mint keypairs
    identityMint = Keypair.generate();
    usernameMint = Keypair.generate();

    // Get associated token accounts
    identityTokenAccount = await getAssociatedTokenAddress(
      identityMint.publicKey,
      user1.publicKey
    );

    usernameTokenAccount = await getAssociatedTokenAddress(
      usernameMint.publicKey,
      user1.publicKey
    );
  });

  describe("Username Registry", () => {
    it("Initializes username registry", async () => {
      await usernameProgram.methods
        .initializeRegistry()
        .accounts({
          authority: authority.publicKey,
          usernameRegistry: usernameRegistryPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const registry = await usernameProgram.account.usernameRegistry.fetch(usernameRegistryPda);
      expect(registry.authority.toBase58()).to.equal(authority.publicKey.toBase58());
      expect(registry.totalUsernames.toNumber()).to.equal(0);
    });
  });

  describe("Identity Creation", () => {
    it("Creates a new soulbound identity", async () => {
      const metadataPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          identityMint.publicKey.toBuffer(),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      )[0];

      await identityProgram.methods
        .createIdentity(5, 24) // 5 username limit, 24 hour cooldown
        .accounts({
          user: user1.publicKey,
          identityAccount: identityPda,
          mint: identityMint.publicKey,
          tokenAccount: identityTokenAccount,
          metadata: metadataPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([user1, identityMint])
        .rpc();

      const identity = await identityProgram.account.identityAccount.fetch(identityPda);
      expect(identity.wallet.toBase58()).to.equal(user1.publicKey.toBase58());
      expect(identity.currentUsername).to.be.null;
      expect(identity.usernameHistory).to.be.empty;
      expect(identity.maxUsernames).to.equal(5);
      expect(identity.changeCooldownHours.toNumber()).to.equal(24);
    });

    it("Prevents creating multiple identities for same wallet", async () => {
      try {
        await identityProgram.methods
          .createIdentity(5, 24)
          .accounts({
            user: user1.publicKey,
            identityAccount: identityPda,
            mint: Keypair.generate().publicKey,
            tokenAccount: await getAssociatedTokenAddress(
              Keypair.generate().publicKey,
              user1.publicKey
            ),
            metadata: PublicKey.default,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([user1])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("IdentityAlreadyExists");
      }
    });
  });

  describe("Username NFTs", () => {
    it("Claims a username NFT", async () => {
      const metadataPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").toBuffer(),
          usernameMint.publicKey.toBuffer(),
        ],
        new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
      )[0];

      await usernameProgram.methods
        .claimUsername(testUsername, testSymbol)
        .accounts({
          user: user1.publicKey,
          usernameRegistry: usernameRegistryPda,
          usernameAccount: usernamePda,
          mint: usernameMint.publicKey,
          tokenAccount: usernameTokenAccount,
          metadata: metadataPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([user1, usernameMint])
        .rpc();

      const username = await usernameProgram.account.usernameAccount.fetch(usernamePda);
      expect(username.name).to.equal(testUsername);
      expect(username.symbol).to.equal(testSymbol);
      expect(username.owner.toBase58()).to.equal(user1.publicKey.toBase58());
      expect(username.isActive).to.be.false;

      const registry = await usernameProgram.account.usernameRegistry.fetch(usernameRegistryPda);
      expect(registry.totalUsernames.toNumber()).to.equal(1);
    });

    it("Prevents claiming duplicate usernames", async () => {
      try {
        await usernameProgram.methods
          .claimUsername(testUsername, testSymbol)
          .accounts({
            user: user2.publicKey,
            usernameRegistry: usernameRegistryPda,
            usernameAccount: usernamePda,
            mint: Keypair.generate().publicKey,
            tokenAccount: await getAssociatedTokenAddress(
              Keypair.generate().publicKey,
              user2.publicKey
            ),
            metadata: PublicKey.default,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("Username Assignment", () => {
    it("Activates username NFT", async () => {
      await usernameProgram.methods
        .activateUsername(identityPda)
        .accounts({
          user: user1.publicKey,
          usernameAccount: usernamePda,
        })
        .signers([user1])
        .rpc();

      const username = await usernameProgram.account.usernameAccount.fetch(usernamePda);
      expect(username.isActive).to.be.true;
      expect(username.assignedTo?.toBase58()).to.equal(identityPda.toBase58());
    });

    it("Assigns username to identity", async () => {
      await identityProgram.methods
        .assignUsername(usernameMint.publicKey, testUsername)
        .accounts({
          user: user1.publicKey,
          identityAccount: identityPda,
        })
        .signers([user1])
        .rpc();

      const identity = await identityProgram.account.identityAccount.fetch(identityPda);
      expect(identity.currentUsername).to.equal(testUsername);
      expect(identity.usernameChangeCount).to.equal(1);
    });

    it("Prevents unauthorized username assignment", async () => {
      try {
        await identityProgram.methods
          .assignUsername(usernameMint.publicKey, testUsername)
          .accounts({
            user: user2.publicKey, // Wrong user
            identityAccount: identityPda,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("Unauthorized");
      }
    });
  });

  describe("Username Deactivation", () => {
    it("Deactivates username from identity", async () => {
      await identityProgram.methods
        .deactivateUsername()
        .accounts({
          user: user1.publicKey,
          identityAccount: identityPda,
        })
        .signers([user1])
        .rpc();

      const identity = await identityProgram.account.identityAccount.fetch(identityPda);
      expect(identity.currentUsername).to.be.null;
      expect(identity.usernameHistory).to.include(testUsername);
    });

    it("Deactivates username NFT", async () => {
      await usernameProgram.methods
        .deactivateUsername()
        .accounts({
          user: user1.publicKey,
          usernameAccount: usernamePda,
        })
        .signers([user1])
        .rpc();

      const username = await usernameProgram.account.usernameAccount.fetch(usernamePda);
      expect(username.isActive).to.be.false;
      expect(username.assignedTo).to.be.null;
    });
  });

  describe("Username Transfer", () => {
    it("Transfers username NFT to another user", async () => {
      const user2TokenAccount = await getAssociatedTokenAddress(
        usernameMint.publicKey,
        user2.publicKey
      );

      await usernameProgram.methods
        .transferUsername(user2.publicKey)
        .accounts({
          currentOwner: user1.publicKey,
          usernameAccount: usernamePda,
          fromTokenAccount: usernameTokenAccount,
          toTokenAccount: user2TokenAccount,
          newOwner: user2.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user1])
        .rpc();

      const username = await usernameProgram.account.usernameAccount.fetch(usernamePda);
      expect(username.owner.toBase58()).to.equal(user2.publicKey.toBase58());
      expect(username.transferCount).to.equal(1);
    });

    it("Prevents transferring active username", async () => {
      // First activate the username
      await usernameProgram.methods
        .activateUsername(identityPda)
        .accounts({
          user: user2.publicKey,
          usernameAccount: usernamePda,
        })
        .signers([user2])
        .rpc();

      try {
        await usernameProgram.methods
          .transferUsername(user1.publicKey)
          .accounts({
            currentOwner: user2.publicKey,
            usernameAccount: usernamePda,
            fromTokenAccount: await getAssociatedTokenAddress(
              usernameMint.publicKey,
              user2.publicKey
            ),
            toTokenAccount: usernameTokenAccount,
            newOwner: user1.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([user2])
          .rpc();
        
        expect.fail("Should have failed");
      } catch (error) {
        expect(error.message).to.include("CannotTransferActiveUsername");
      }
    });
  });

  describe("View Functions", () => {
    it("Gets identity information", async () => {
      const info = await identityProgram.methods
        .getIdentityInfo()
        .accounts({
          identityAccount: identityPda,
        })
        .view();

      expect(info.wallet.toBase58()).to.equal(user1.publicKey.toBase58());
      expect(info.usernameHistory).to.include(testUsername);
    });

    it("Gets username information", async () => {
      const info = await usernameProgram.methods
        .getUsernameInfo()
        .accounts({
          usernameAccount: usernamePda,
        })
        .view();

      expect(info.name).to.equal(testUsername);
      expect(info.owner.toBase58()).to.equal(user2.publicKey.toBase58());
    });
  });

  describe("Settings and Limits", () => {
    it("Updates identity settings", async () => {
      await identityProgram.methods
        .updateIdentitySettings(10, 12) // New limits
        .accounts({
          user: user1.publicKey,
          identityAccount: identityPda,
        })
        .signers([user1])
        .rpc();

      const identity = await identityProgram.account.identityAccount.fetch(identityPda);
      expect(identity.maxUsernames).to.equal(10);
      expect(identity.changeCooldownHours.toNumber()).to.equal(12);
    });
  });
});