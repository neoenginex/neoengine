import AsyncStorage from '@react-native-async-storage/async-storage';
import usernameStorage from './usernameStorage';
import pinStorage from './pinStorage';

/**
 * Clear all NeoEngine stored data for testing purposes
 * This will reset the app to a fresh state
 */
export async function clearAllAppData(): Promise<void> {
  try {
    console.log('🧹 Clearing all app data...');
    
    // Clear usernames for all wallets
    await usernameStorage.clearAllUsernames();
    
    // Clear PINs for all wallets  
    await pinStorage.clearAllPins();
    
    // Clear ALL AsyncStorage data (wallet connections, everything)
    const allKeys = await AsyncStorage.getAllKeys();
    
    // For complete reset, just clear everything
    if (allKeys.length > 0) {
      await AsyncStorage.multiRemove(allKeys);
      console.log(`🗑️ Cleared ALL storage keys (${allKeys.length} items):`, allKeys);
    }
    
    console.log('✅ All app data cleared successfully!');
    console.log('📱 App will now behave as if it\'s a fresh install');
    
  } catch (error) {
    console.error('❌ Error clearing app data:', error);
    throw error;
  }
}

/**
 * Clear data for a specific wallet
 */
export async function clearWalletData(walletAddress: string): Promise<void> {
  try {
    console.log(`🧹 Clearing data for wallet: ${walletAddress}`);
    
    await usernameStorage.clearUsernameForWallet(walletAddress);
    await pinStorage.clearPinForWallet(walletAddress);
    
    console.log(`✅ Data cleared for wallet: ${walletAddress}`);
    
  } catch (error) {
    console.error('❌ Error clearing wallet data:', error);
    throw error;
  }
}

export default {
  clearAllAppData,
  clearWalletData,
};