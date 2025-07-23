import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';

interface FinalizeProfileProps {
  visible: boolean;
  onClose: () => void;
  walletAddress: string;
  profileCid?: string;
  bannerCid?: string;
}

export default function FinalizeProfile({ visible, onClose, walletAddress, profileCid, bannerCid }: FinalizeProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'nft' | 'pin' | null>(null);

  const handleNftMint = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement NFT minting flow
      Alert.alert('Coming Soon!', 'NFT minting will be available in the next update.');
    } catch (error) {
      Alert.alert('Error', 'Failed to mint profile NFT');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinToStorage = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement user's own storage credential flow
      Alert.alert('Coming Soon!', 'Profile pinning will be available in the next update.');
    } catch (error) {
      Alert.alert('Error', 'Failed to pin profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🔒 Finalize Your Profile</Text>
          
          <Text style={styles.subtitle}>
            Your profile images are currently unpinned on IPFS and may disappear.
            Choose how to make them permanent:
          </Text>

          {/* Option 1: NFT Minting */}
          <TouchableOpacity
            style={[styles.option, selectedOption === 'nft' && styles.selectedOption]}
            onPress={() => setSelectedOption('nft')}
          >
            <Text style={styles.optionIcon}>🎨</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Mint as NFT</Text>
              <Text style={styles.optionDescription}>
                Create a profile NFT that includes your images and metadata.
                You pay gas fees, you own the NFT forever.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Option 2: Pin to Storage */}
          <TouchableOpacity
            style={[styles.option, selectedOption === 'pin' && styles.selectedOption]}
            onPress={() => setSelectedOption('pin')}
          >
            <Text style={styles.optionIcon}>📌</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Pin to Storage</Text>
              <Text style={styles.optionDescription}>
                Use your own Pinata/NFT.Storage credentials to pin your images.
                You manage and pay for the storage.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Current Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Current Status:</Text>
            <Text style={styles.statusText}>
              Profile: {profileCid ? `${profileCid.slice(0, 8)}...` : 'No image'}
            </Text>
            <Text style={styles.statusText}>
              Banner: {bannerCid ? `${bannerCid.slice(0, 8)}...` : 'No image'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.finalizeButton,
                !selectedOption && styles.disabledButton
              ]}
              onPress={selectedOption === 'nft' ? handleNftMint : handlePinToStorage}
              disabled={!selectedOption || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.finalizeButtonText}>
                  {selectedOption === 'nft' ? 'Mint NFT' : 'Pin Images'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Geist-Regular',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#4ECDC4',
    backgroundColor: '#2a3a3a',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    color: '#CCCCCC',
    fontSize: 13,
    fontFamily: 'Geist-Regular',
    lineHeight: 18,
  },
  statusContainer: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: 'GeistMono-Regular',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#3a3a3a',
  },
  cancelButtonText: {
    color: '#CCCCCC',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
  finalizeButton: {
    backgroundColor: '#4ECDC4',
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#333333',
  },
});