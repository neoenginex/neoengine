import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { ProfileData, useProfileNft } from './profile-nft-client';
import { useDsxScoring } from './dsx-scoring-client';

// Example integration component for profile creation
export const ProfileCreationScreen: React.FC = () => {
  const { publicKey } = useWallet();
  const { createProfile, updateProfile, getProfile } = useProfileNft();
  const { initializeScoring, getUserStats } = useDsxScoring();
  
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    displayName: '',
    bio: '',
    link: '',
    pfpCid: '',
    bannerCid: '',
  });

  useEffect(() => {
    checkExistingProfile();
  }, [publicKey]);

  const checkExistingProfile = async () => {
    if (!publicKey) return;
    
    try {
      const profile = await getProfile();
      if (profile) {
        setHasProfile(true);
        setProfileData({
          name: profile.profileData.name,
          displayName: profile.profileData.displayName,
          bio: profile.profileData.bio,
          link: profile.profileData.link,
          pfpCid: profile.profileData.pfpCid,
          bannerCid: profile.profileData.bannerCid,
        });
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const handleCreateProfile = async () => {
    if (!validateProfileData()) return;
    
    setLoading(true);
    try {
      // Create the profile NFT
      const txHash = await createProfile(profileData);
      console.log('Profile created:', txHash);
      
      // Initialize DSX scoring for new user
      try {
        await initializeScoring();
        console.log('DSX scoring initialized');
      } catch (error) {
        console.log('DSX scoring already initialized or error:', error);
      }
      
      Alert.alert('Success', 'Profile created successfully!');
      setHasProfile(true);
      
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert('Error', 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileData()) return;
    
    setLoading(true);
    try {
      const txHash = await updateProfile(profileData);
      console.log('Profile updated:', txHash);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const validateProfileData = (): boolean => {
    if (!profileData.name || profileData.name.length > 32) {
      Alert.alert('Error', 'Name must be 1-32 characters');
      return false;
    }
    
    if (!profileData.displayName || profileData.displayName.length > 24) {
      Alert.alert('Error', 'Display name must be 1-24 characters');
      return false;
    }
    
    if (profileData.bio.length > 280) {
      Alert.alert('Error', 'Bio must be 280 characters or less');
      return false;
    }
    
    if (profileData.link && !isValidUrl(profileData.link)) {
      Alert.alert('Error', 'Please enter a valid URL');
      return false;
    }
    
    if (!profileData.pfpCid || !isValidIpfsCid(profileData.pfpCid)) {
      Alert.alert('Error', 'Please provide a valid profile picture IPFS CID');
      return false;
    }
    
    if (!profileData.bannerCid || !isValidIpfsCid(profileData.bannerCid)) {
      Alert.alert('Error', 'Please provide a valid banner IPFS CID');
      return false;
    }
    
    return true;
  };

  const isValidUrl = (url: string): boolean => {
    return url.startsWith('https://') || url.startsWith('http://');
  };

  const isValidIpfsCid = (cid: string): boolean => {
    return (cid.startsWith('Qm') && cid.length === 46) || 
           (cid.startsWith('bafy') && cid.length >= 50);
  };

  if (!publicKey) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Please connect your wallet</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        {hasProfile ? 'Update Profile' : 'Create Profile'}
      </Text>
      
      {/* Profile form fields would go here */}
      {/* For brevity, showing just the action button */}
      
      <TouchableOpacity
        style={{
          backgroundColor: '#007AFF',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 20,
        }}
        onPress={hasProfile ? handleUpdateProfile : handleCreateProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {hasProfile ? 'Update Profile' : 'Create Profile'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Example component for DSX rewards
export const RewardsScreen: React.FC = () => {
  const { claimDailyReward, getUserStats } = useDsxScoring();
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [canClaimDaily, setCanClaimDaily] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await getUserStats();
      setUserStats(stats);
      
      // Check if can claim daily reward
      if (stats.scoring) {
        const currentDay = Math.floor(Date.now() / 1000 / 86400);
        setCanClaimDaily(stats.scoring.lastDailyContribution.toNumber() !== currentDay);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleClaimDailyReward = async () => {
    setLoading(true);
    try {
      const txHash = await claimDailyReward();
      console.log('Daily reward claimed:', txHash);
      Alert.alert('Success', 'Daily reward claimed! You earned 50 DSX tokens.');
      await loadUserStats(); // Refresh stats
    } catch (error) {
      console.error('Error claiming daily reward:', error);
      Alert.alert('Error', 'Failed to claim daily reward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Rewards & Reputation
      </Text>
      
      {userStats && (
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            DSX Balance: {userStats.dsxBalance.toFixed(2)}
          </Text>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Reputation Score: {userStats.reputation}
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>
            Total Earned: {(userStats.scoring?.totalEarned || 0) / 1e9} DSX
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>
            Referrals: {userStats.scoring?.referralCount || 0}
          </Text>
        </View>
      )}
      
      <TouchableOpacity
        style={{
          backgroundColor: canClaimDaily ? '#28A745' : '#6C757D',
          padding: 15,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 15,
        }}
        onPress={handleClaimDailyReward}
        disabled={!canClaimDaily || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {canClaimDaily ? 'Claim Daily Reward (50 DSX)' : 'Daily Reward Already Claimed'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};