import { useState, useEffect } from 'react';
import { getImageFromIPFS, ProfileMetadata } from '../utils/ipfs';
import { useAuthorization } from '../components/providers/AuthorizationProvider';
import { useConnection } from '../components/providers/ConnectionProvider';
import ProfileService, { ProfileInfo } from '../utils/profileContract';

interface UserProfileHook {
  profile: ProfileMetadata | null;
  profileInfo: ProfileInfo | null;
  profileImageUrl: string | null;
  bannerImageUrl: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserProfile(): UserProfileHook {
  const { selectedAccount } = useAuthorization();
  const { connection } = useConnection();
  const [profile, setProfile] = useState<ProfileMetadata | null>(null);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!selectedAccount || !connection) {
      console.log('🔍 useUserProfile: No selectedAccount or connection, skipping profile fetch');
      setProfile(null);
      setProfileInfo(null);
      setProfileImageUrl(null);
      setBannerImageUrl(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 useUserProfile: Fetching profile for wallet:', selectedAccount.publicKey.toString());
      
      const profileService = new ProfileService(connection);
      
      // Get profile info from blockchain
      const blockchainProfileInfo = await profileService.getProfileInfo(selectedAccount.publicKey);
      console.log('🔍 useUserProfile: Blockchain profile info:', blockchainProfileInfo);
      
      if (blockchainProfileInfo) {
        console.log('✅ Profile found on blockchain:', blockchainProfileInfo);
        setProfileInfo(blockchainProfileInfo);

        // Get profile metadata from IPFS
        const profileMetadata = await profileService.getProfileMetadata(selectedAccount.publicKey);
        console.log('🔍 useUserProfile: Profile metadata from IPFS:', profileMetadata);
        
        if (profileMetadata) {
          setProfile(profileMetadata);

          // Load profile image from IPFS if available
          if (profileMetadata.image) {
            const pfpUrl = await getImageFromIPFS(profileMetadata.image);
            setProfileImageUrl(pfpUrl);
            console.log('✅ Profile image loaded from IPFS:', pfpUrl);
          } else {
            setProfileImageUrl(null);
          }

          // Load banner image from IPFS if available
          if (profileMetadata.banner) {
            const bannerUrl = await getImageFromIPFS(profileMetadata.banner);
            setBannerImageUrl(bannerUrl);
            console.log('✅ Banner image loaded from IPFS:', bannerUrl);
          } else {
            setBannerImageUrl(null);
          }
        } else {
          console.log('⚠️ Profile info found on blockchain but no metadata on IPFS');
          setProfile(null);
          setProfileImageUrl(null);
          setBannerImageUrl(null);
        }
      } else {
        console.log('ℹ️ No profile found on blockchain for wallet');
        setProfile(null);
        setProfileInfo(null);
        setProfileImageUrl(null);
        setBannerImageUrl(null);
      }
    } catch (err) {
      console.error('❌ Error fetching profile from blockchain:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
      setProfileInfo(null);
      setProfileImageUrl(null);
      setBannerImageUrl(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [selectedAccount, connection]);

  return {
    profile,
    profileInfo,
    profileImageUrl,
    bannerImageUrl,
    loading,
    error,
    refetch: fetchProfile,
  };
}