import pinStorage from './pinStorage';

export enum AuthState {
  NO_PIN_SET = 'NO_PIN_SET',
  PIN_REQUIRED = 'PIN_REQUIRED', 
  AUTHENTICATED = 'AUTHENTICATED',
}

class AuthFlowService {
  private static instance: AuthFlowService;

  static getInstance(): AuthFlowService {
    if (!AuthFlowService.instance) {
      AuthFlowService.instance = new AuthFlowService();
    }
    return AuthFlowService.instance;
  }

  async getAuthState(): Promise<AuthState> {
    try {
      const hasPin = await pinStorage.hasStoredPin();
      if (!hasPin) {
        return AuthState.NO_PIN_SET;
      }
      return AuthState.PIN_REQUIRED;
    } catch (error) {
      console.error('Error checking auth state:', error);
      return AuthState.NO_PIN_SET;
    }
  }

  async authenticateWithPin(pin: string): Promise<boolean> {
    try {
      return await pinStorage.verifyPin(pin);
    } catch (error) {
      console.error('Error authenticating with pin:', error);
      return false;
    }
  }

  async createPin(pin: string): Promise<boolean> {
    try {
      return await pinStorage.storePin(pin);
    } catch (error) {
      console.error('Error creating pin:', error);
      return false;
    }
  }

  async resetPin(): Promise<boolean> {
    try {
      return await pinStorage.clearPin();
    } catch (error) {
      console.error('Error resetting pin:', error);
      return false;
    }
  }

  async updatePin(oldPin: string, newPin: string): Promise<boolean> {
    try {
      return await pinStorage.updatePin(oldPin, newPin);
    } catch (error) {
      console.error('Error updating pin:', error);
      return false;
    }
  }
}

export const authFlow = AuthFlowService.getInstance();
export default authFlow;