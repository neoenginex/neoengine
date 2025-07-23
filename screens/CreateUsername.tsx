import React, {useState, useEffect, useRef} from 'react';
import {StyleSheet, View, Image, Text, TouchableOpacity, TextInput, Keyboard} from 'react-native';
// Removed import - using local fake function instead
import {useAuthorization} from '../components/providers/AuthorizationProvider';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import usernameStorage from '../utils/usernameStorage';
import IdentityService from '../utils/identityContract';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';

interface CreateUsernameProps {
  onCancel?: () => void;
  onDisconnectWallet?: () => void;
  isWalletConnected?: boolean;
  onUsernameCreated?: (username: string) => void;
}

export default function CreateUsername({onCancel, onDisconnectWallet, isWalletConnected, onUsernameCreated}: CreateUsernameProps) {
  const [text, setText] = useState('');
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | 'checking' | 'taken' | 'short' | 'no_at' | ''>('');
  const [isCreatingIdentity, setIsCreatingIdentity] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const {deauthorizeSession, selectedAccount} = useAuthorization();

  // Check username availability on-chain
  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      console.log('Checking username availability on-chain:', username);
      
      const connection = new Connection(clusterApiUrl('devnet'));
      const identityService = new IdentityService(connection);
      
      const isAvailable = await identityService.isUsernameAvailable(username);
      return isAvailable;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const handleCancel = async () => {
    if (isWalletConnected) {
      try {
        await transact(async wallet => {
          await deauthorizeSession(wallet);
        });
        onDisconnectWallet?.();
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
        // Still go back even if disconnect fails
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  };

  const validateUsername = async (username: string) => {
    if (username.length === 0) {
      setValidationStatus('');
      return;
    }
    
    // Check if user included @ symbol
    if (username.includes('@')) {
      setValidationStatus('no_at');
      return;
    }
    
    // Check length first (minimum 4 characters as requested)
    if (username.length < 4) {
      setValidationStatus('short');
      return;
    }
    
    if (username.length > 20) {
      setValidationStatus('invalid');
      return;
    }
    
    // Check valid characters - only letters, numbers, '.', '_', '-'
    const validCharacters = /^[a-zA-Z0-9._-]+$/;
    if (!validCharacters.test(username)) {
      setValidationStatus('invalid');
      return;
    }
    
    // If format is valid, check availability
    setValidationStatus('checking');
    try {
      const isAvailable = await checkUsernameAvailability(username);
      setValidationStatus(isAvailable ? 'valid' : 'taken');
    } catch (error) {
      console.error('Error checking username availability:', error);
      // Fall back to valid if availability check fails
      setValidationStatus('valid');
    }
  };

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer for debounced validation
    debounceTimerRef.current = setTimeout(() => {
      validateUsername(newText);
    }, 500); // Wait 500ms after user stops typing
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const getStatusMessage = () => {
    switch (validationStatus) {
      case 'valid':
        return 'Available';
      case 'taken':
        return 'Username Taken';
      case 'invalid':
        return "Username can only contain letters, numbers '.' '_' '-'";
      case 'short':
        return 'Username must be four or more characters.';
      case 'no_at':
        return "Don't include @ - it's added automatically";
      case 'checking':
        return 'Checking...';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (validationStatus) {
      case 'valid':
        return '#00ff00';
      case 'taken':
      case 'invalid':
      case 'short':
      case 'no_at':
        return '#ff0000';
      case 'checking':
        return '#ffff00';
      default:
        return 'transparent';
    }
  };

  const handleCreateIdentity = async () => {
    if (validationStatus !== 'valid' || !selectedAccount) {
      return;
    }

    setIsCreatingIdentity(true);
    try {
      console.log('🚀 Creating Soulbound Username Token...');
      console.log('Username:', text);
      console.log('Wallet:', selectedAccount.address);
      
      // Sign and send the transaction
      console.log('📝 Creating and signing transaction...');
      await transact(async (wallet) => {
        try {
          console.log('🔧 Re-authorizing wallet...');
          // Re-authorize the wallet for this transaction
          const authResult = await wallet.authorize({
            cluster: 'devnet',
            identity: {
              name: 'NeoEngine',
            },
          });
          
          console.log('✅ Wallet authorized, creating transaction...');
          
          // Try multiple RPC endpoints for emulator compatibility
          let connection;
          const rpcEndpoints = [
            'https://devnet.helius-rpc.com',
            'https://rpc.ankr.com/solana_devnet',
            'https://api.devnet.solana.com',
            clusterApiUrl('devnet')
          ];
          
          console.log('🔄 Testing RPC endpoints for emulator compatibility...');
          for (const endpoint of rpcEndpoints) {
            try {
              console.log('🧪 Testing:', endpoint);
              connection = new Connection(endpoint, 'confirmed');
              // Test with a simple call
              await connection.getSlot();
              console.log('✅ Working RPC found:', endpoint);
              break;
            } catch (testError) {
              console.log('❌ Failed:', endpoint);
              continue;
            }
          }
          
          if (!connection) {
            throw new Error('No working RPC endpoint found - emulator network issue');
          }
          
          const identityService = new IdentityService(connection);
          
          // Use the authorized account - decode from base64 to bytes then create PublicKey
          const authorizedAccount = authResult.accounts[0];
          const addressBytes = Buffer.from(authorizedAccount.address, 'base64');
          const walletPublicKey = new PublicKey(addressBytes);
          
          console.log('🔑 Using wallet:', walletPublicKey.toBase58());
          
          // Create the username transaction
          const createUsernameTx = await identityService.createUsername(
            walletPublicKey,
            text
          );
          
          // Set up transaction
          const latestBlockhash = await connection.getLatestBlockhash();
          createUsernameTx.recentBlockhash = latestBlockhash.blockhash;
          createUsernameTx.feePayer = walletPublicKey;
          
          console.log('✍️ Signing transaction...');
          // Sign transaction with fresh auth
          const signedTransactions = await wallet.signTransactions({
            transactions: [createUsernameTx],
          });
          
          const signedTx = signedTransactions[0];
          
          // Log transaction details first
          console.log('📋 Transaction details:');
          console.log('- Fee payer:', createUsernameTx.feePayer?.toBase58());
          console.log('- Instructions:', createUsernameTx.instructions.length);
          console.log('- Recent blockhash:', createUsernameTx.recentBlockhash);
          
          // Skip balance check due to network issues - we know you have SOL
          console.log('⏭️ Skipping balance check due to network issues...');
          
          // Send the transaction with retry logic
          console.log('⏳ Sending to blockchain...');
          let txSignature;
          
          try {
            console.log('🚀 Attempting transaction with custom fetch options for emulator...');
            
            // For emulator - use manual HTTP request instead of sendRawTransaction
            const serializedTx = signedTx.serialize();
            const base64Tx = Buffer.from(serializedTx).toString('base64');
            
            console.log('📡 Making direct HTTP request to bypass emulator network issues...');
            const response = await fetch(`${connection.rpcEndpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'sendTransaction',
                params: [
                  base64Tx,
                  {
                    skipPreflight: false,
                    preflightCommitment: 'confirmed',
                    encoding: 'base64'
                  }
                ]
              })
            });
            
            const result = await response.json();
            console.log('📊 HTTP Response:', result);
            
            if (result.error) {
              throw new Error(`Transaction failed: ${result.error.message}`);
            }
            
            txSignature = result.result;
            
          } catch (sendError: any) {
            console.log('⚠️ Direct HTTP failed:', sendError?.message || 'Unknown error');
            console.log('⚠️ Last resort - trying sendRawTransaction with different options...');
            
            // Last resort - try with completely minimal options
            txSignature = await connection.sendRawTransaction(signedTx.serialize(), {
              skipPreflight: true,
              preflightCommitment: 'processed'
            });
          }
          
          console.log('🔗 Transaction signature:', txSignature);
          
          // Wait for confirmation with proper method
          console.log('⏳ Waiting for confirmation...');
          const confirmation = await connection.confirmTransaction({
            signature: txSignature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          });
          
          if (confirmation.value.err) {
            throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
          }
          
          console.log('✅ Soulbound username token created successfully!');
          
        } catch (walletError) {
          console.error('❌ Transaction error:', walletError);
          throw walletError;
        }
      });
      
      // Store username locally for quick access
      if (selectedAccount) {
        await usernameStorage.storeUsernameForWallet(selectedAccount.address, text);
        console.log('💾 Username stored locally');
      }
      
      console.log('🎉 Username creation complete!');
      onUsernameCreated?.(text);
      
    } catch (error) {
      console.error('❌ Error creating username:', error);
      // You might want to show an alert to the user here
    } finally {
      setIsCreatingIdentity(false);
    }
  };
  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1} 
      onPress={() => Keyboard.dismiss()}
    >
      <View style={styles.rectangle}>
        <Image
          source={require('../assets/icons/at.png')}
          style={styles.icon}
          resizeMode="contain"
        />
        <TextInput
          style={styles.placeholderText}
          value={text}
          onChangeText={handleTextChange}
          placeholder="Create Soulbound Token"
          placeholderTextColor="#5e5e5e"
          onSubmitEditing={() => {
            if (validationStatus === 'valid') {
              handleCreateIdentity();
            }
          }}
          returnKeyType="done"
        />
        {validationStatus === 'valid' && !isCreatingIdentity && (
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleCreateIdentity}
          />
        )}
        {validationStatus !== '' && (
          <Text style={[styles.statusTag, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
        )}
      </View>
      
      <Text style={styles.finePrint}>
        Your Soulbound Token is your identity on NeoEngine.{'\n'}One handle per wallet, non-transferrable, and uniquely yours.
      </Text>
      
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipButton} onPress={() => onUsernameCreated?.(text || 'Username')}>
          <Text style={styles.skipText}>SKIP (DEBUG)</Text>
        </TouchableOpacity>
        
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  rectangle: {
    backgroundColor: '#282828',
    width: 350,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 7,
    paddingRight: 20,
  },
  icon: {
    width: 34,
    height: 34,
  },
  placeholderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Geist-Light',
    fontWeight: '300',
    marginLeft: 8,
    marginTop: 2,
    flex: 1,
  },
  statusTag: {
    position: 'absolute',
    top: -18,
    left: 0,
    right: 0,
    fontSize: 9,
    fontFamily: 'Geist-Light',
    fontWeight: '300',
    textAlign: 'center',
  },
  finePrint: {
    color: '#4a4a4a',
    fontSize: 10,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    marginTop: 36,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cancelButton: {
    marginBottom: 10,
  },
  cancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
  },
  skipButton: {
    marginBottom: 10,
  },
  skipText: {
    color: '#616161',
    fontSize: 12,
    fontFamily: 'GeistMono-Regular',
  },
  submitButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#707070',
    position: 'absolute',
    right: 8,
  },
});