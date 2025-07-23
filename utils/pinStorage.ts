import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_STORAGE_PREFIX = 'neoengine_pin_';

class PinStorageService {
  private static instance: PinStorageService;

  static getInstance(): PinStorageService {
    if (!PinStorageService.instance) {
      PinStorageService.instance = new PinStorageService();
    }
    return PinStorageService.instance;
  }

  private getPinKey(walletAddress: string): string {
    return `${PIN_STORAGE_PREFIX}${walletAddress}`;
  }

  async storePinForWallet(walletAddress: string, pin: string): Promise<boolean> {
    try {
      const key = this.getPinKey(walletAddress);
      await AsyncStorage.setItem(key, pin);
      return true;
    } catch (error) {
      console.error('Error storing pin for wallet:', error);
      return false;
    }
  }

  async verifyPinForWallet(walletAddress: string, inputPin: string): Promise<boolean> {
    try {
      const key = this.getPinKey(walletAddress);
      const storedPin = await AsyncStorage.getItem(key);
      return storedPin === inputPin;
    } catch (error) {
      console.error('Error verifying pin for wallet:', error);
      return false;
    }
  }

  async hasStoredPinForWallet(walletAddress: string): Promise<boolean> {
    try {
      const key = this.getPinKey(walletAddress);
      const storedPin = await AsyncStorage.getItem(key);
      return storedPin !== null;
    } catch (error) {
      console.error('Error checking stored pin for wallet:', error);
      return false;
    }
  }

  async clearPinForWallet(walletAddress: string): Promise<boolean> {
    try {
      const key = this.getPinKey(walletAddress);
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error clearing pin for wallet:', error);
      return false;
    }
  }

  async updatePinForWallet(walletAddress: string, oldPin: string, newPin: string): Promise<boolean> {
    try {
      const isOldPinValid = await this.verifyPinForWallet(walletAddress, oldPin);
      if (!isOldPinValid) {
        return false;
      }
      return await this.storePinForWallet(walletAddress, newPin);
    } catch (error) {
      console.error('Error updating pin for wallet:', error);
      return false;
    }
  }

  async getAllWalletsWithPins(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pinKeys = keys.filter(key => key.startsWith(PIN_STORAGE_PREFIX));
      return pinKeys.map(key => key.replace(PIN_STORAGE_PREFIX, ''));
    } catch (error) {
      console.error('Error getting wallets with pins:', error);
      return [];
    }
  }

  // Legacy methods for backward compatibility - use default wallet if available
  async storePin(pin: string): Promise<boolean> {
    console.warn('storePin is deprecated. Use storePinForWallet instead.');
    return false;
  }

  async verifyPin(inputPin: string): Promise<boolean> {
    console.warn('verifyPin is deprecated. Use verifyPinForWallet instead.');
    return false;
  }

  async hasStoredPin(): Promise<boolean> {
    console.warn('hasStoredPin is deprecated. Use hasStoredPinForWallet instead.');
    return false;
  }

  async clearPin(): Promise<boolean> {
    console.warn('clearPin is deprecated. Use clearPinForWallet instead.');
    return false;
  }

  async updatePin(oldPin: string, newPin: string): Promise<boolean> {
    console.warn('updatePin is deprecated. Use updatePinForWallet instead.');
    return false;
  }

  async clearAllPins(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pinKeys = keys.filter(key => key.startsWith(PIN_STORAGE_PREFIX));
      await AsyncStorage.multiRemove(pinKeys);
      console.log(`Cleared ${pinKeys.length} stored PINs`);
      return true;
    } catch (error) {
      console.error('Error clearing all pins:', error);
      return false;
    }
  }
}

export const pinStorage = PinStorageService.getInstance();
export default pinStorage;