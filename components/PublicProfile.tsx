import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import ProfileService, { ProfileInfo } from '../utils/profileContract';
import { getImageFromIPFSWithFallback, ProfileMetadata } from '../utils/ipfs';
import { useConnection } from '../providers/ConnectionProvider';
import { PublicKey } from '@solana/web3.js';

const { width } = Dimensions.get('window');

interface PublicProfileProps {
  walletAddress: string;
  onClose?: () => void;
}

export default function PublicProfile({ walletAddress, onClose }: PublicProfileProps) {
  const { connection } = useConnection();
  const [profile, setProfile] = useState<ProfileMetadata | null>(null);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [bannerImageUri, setBannerImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [walletAddress]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!connection) {
        setError('Connection not available');
        return;
      }

      const profileService = new ProfileService(connection);
      const walletPublicKey = new PublicKey(walletAddress);
      
      // Get profile info from blockchain
      const blockchainProfileInfo = await profileService.getProfileInfo(walletPublicKey);
      
      if (!blockchainProfileInfo) {
        setError('Profile not found on blockchain');
        return;
      }
      
      setProfileInfo(blockchainProfileInfo);
      
      // Get profile metadata from IPFS
      const profileMetadata = await profileService.getProfileMetadata(walletPublicKey);
      
      if (!profileMetadata) {
        setError('Profile metadata not found on IPFS');
        return;
      }
      
      setProfile(profileMetadata);
      
      // Load images from IPFS
      if (profileMetadata.image) {
        const pfpUrl = await getImageFromIPFSWithFallback(profileMetadata.image);
        setProfileImageUri(pfpUrl);
      }
      
      if (profileMetadata.banner) {
        const bannerUrl = await getImageFromIPFSWithFallback(profileMetadata.banner);
        setBannerImageUri(bannerUrl);
      }
      
    } catch (err) {
      console.error('Error loading profile from blockchain:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Close button */}
      {onClose && (
        <TouchableOpacity style={styles.closeButtonTop} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      )}

      {/* Banner Image */}
      <View style={styles.banner}>
        {bannerImageUri ? (
          <Image
            source={{ uri: bannerImageUri }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerPlaceholderText}>No banner image</Text>
          </View>
        )}
      </View>

      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        {profileImageUri ? (
          <Image
            source={{ uri: profileImageUri }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>
              {profile?.name.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Text style={styles.displayName}>{profile?.name}</Text>
        <Text style={styles.walletAddress}>
          {formatWalletAddress(walletAddress)}
        </Text>
        
        {profile?.bio && (
          <Text style={styles.bio}>{profile.bio}</Text>
        )}
      </View>

      {/* Profile Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
      </View>

      {/* Join Date */}
      <View style={styles.joinDateContainer}>
        <Text style={styles.joinDateText}>
          Joined {new Date(profile?.created_at || '').toLocaleDateString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
  closeButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonTop: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
  },
  banner: {
    width: '100%',
    height: 120,
  },
  bannerImage: {
    width: '100%',
    height: 120,
  },
  bannerPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerPlaceholderText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#0f0f0f',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: -40,
    borderWidth: 3,
    borderColor: '#000000',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#333333',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Geist-Regular',
    fontWeight: 'bold',
  },
  profileInfo: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  displayName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Geist-Regular',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  walletAddress: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'GeistMono-Regular',
    marginBottom: 15,
  },
  bio: {
    color: '#CCCCCC',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Geist-Regular',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Geist-Regular',
  },
  joinDateContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  joinDateText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
  },
});