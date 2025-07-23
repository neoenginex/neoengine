import AsyncStorage from '@react-native-async-storage/async-storage';

const USERNAME_STORAGE_PREFIX = 'neoengine_username_';

class UsernameStorageService {
  private static instance: UsernameStorageService;

  static getInstance(): UsernameStorageService {
    if (!UsernameStorageService.instance) {
      UsernameStorageService.instance = new UsernameStorageService();
    }
    return UsernameStorageService.instance;
  }

  private getUsernameKey(walletAddress: string): string {
    return `${USERNAME_STORAGE_PREFIX}${walletAddress}`;
  }

  async storeUsernameForWallet(walletAddress: string, username: string): Promise<boolean> {
    try {
      const key = this.getUsernameKey(walletAddress);
      await AsyncStorage.setItem(key, username);
      console.log(`Username stored for wallet: ${walletAddress} -> ${username}`);
      return true;
    } catch (error) {
      console.error('Error storing username for wallet:', error);
      return false;
    }
  }

  async getUsernameForWallet(walletAddress: string): Promise<string | null> {
    try {
      const key = this.getUsernameKey(walletAddress);
      const storedUsername = await AsyncStorage.getItem(key);
      return storedUsername;
    } catch (error) {
      console.error('Error getting username for wallet:', error);
      return null;
    }
  }

  async hasStoredUsernameForWallet(walletAddress: string): Promise<boolean> {
    try {
      const key = this.getUsernameKey(walletAddress);
      const storedUsername = await AsyncStorage.getItem(key);
      return storedUsername !== null;
    } catch (error) {
      console.error('Error checking stored username for wallet:', error);
      return false;
    }
  }

  async clearUsernameForWallet(walletAddress: string): Promise<boolean> {
    try {
      const key = this.getUsernameKey(walletAddress);
      await AsyncStorage.removeItem(key);
      console.log(`Username cleared for wallet: ${walletAddress}`);
      return true;
    } catch (error) {
      console.error('Error clearing username for wallet:', error);
      return false;
    }
  }

  async getAllWalletsWithUsernames(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const usernameKeys = keys.filter(key => key.startsWith(USERNAME_STORAGE_PREFIX));
      return usernameKeys.map(key => key.replace(USERNAME_STORAGE_PREFIX, ''));
    } catch (error) {
      console.error('Error getting wallets with usernames:', error);
      return [];
    }
  }

  async clearAllUsernames(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const usernameKeys = keys.filter(key => key.startsWith(USERNAME_STORAGE_PREFIX));
      await AsyncStorage.multiRemove(usernameKeys);
      console.log(`Cleared ${usernameKeys.length} stored usernames`);
      return true;
    } catch (error) {
      console.error('Error clearing all usernames:', error);
      return false;
    }
  }
}

export const usernameStorage = UsernameStorageService.getInstance();
export default usernameStorage;