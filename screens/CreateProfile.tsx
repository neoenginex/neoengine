import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType, ImageLibraryOptions } from 'react-native-image-picker';
import { useAuthorization } from '../components/providers/AuthorizationProvider';
import { uploadImageToIPFS } from '../utils/ipfs';
import ProfileService, { CreateProfileParams } from '../utils/profileContract';
import { useConnection } from '../components/providers/ConnectionProvider';
import usernameStorage from '../utils/usernameStorage';


interface CreateProfileProps {
  onSkipToHome?: () => void;
}

export default function CreateProfile({onSkipToHome}: CreateProfileProps) {
  const { selectedAccount, transact } = useAuthorization();
  const { connection } = useConnection();
  
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    country: '',
    website: '',
    hyperlink: '',
  });
  
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [bannerImageUri, setBannerImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [username, setUsername] = useState<string>('');

  // Load username from storage when component mounts
  useEffect(() => {
    const loadUsername = async () => {
      if (selectedAccount) {
        const storedUsername = await usernameStorage.getUsernameForWallet(selectedAccount.address);
        if (storedUsername) {
          setUsername(storedUsername);
        }
      }
    };
    loadUsername();
  }, [selectedAccount]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };


  const selectProfileImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 500,
      maxHeight: 500,
    };
    
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets[0] && response.assets[0].uri) {
        setProfileImageUri(response.assets[0].uri);
      }
    });
  };

  const selectBannerImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 1500,
      maxHeight: 500,
    };
    
    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }
      if (response.assets && response.assets[0] && response.assets[0].uri) {
        setBannerImageUri(response.assets[0].uri);
      }
    });
  };

  const validateForm = (): boolean => {
    if (!profileData.name.trim()) {
      Alert.alert('Error', 'Please enter your display name');
      return false;
    }
    if (!selectedAccount) {
      Alert.alert('Error', 'Please connect your wallet first');
      return false;
    }
    return true;
  };

  const createProfile = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setUploadProgress('Starting profile creation...');

    try {
      let profileImageCid: string | null = null;
      let bannerImageCid: string | null = null;

      // Upload profile image if selected
      if (profileImageUri) {
        setUploadProgress('Uploading profile image to IPFS...');
        const profileImageResult = await uploadImageToIPFS(profileImageUri, 'profile');
        profileImageCid = profileImageResult.cid;
      }

      // Upload banner image if selected
      if (bannerImageUri) {
        setUploadProgress('Uploading banner image to IPFS...');
        const bannerImageResult = await uploadImageToIPFS(bannerImageUri, 'banner');
        bannerImageCid = bannerImageResult.cid;
      }

      // Create profile NFT on blockchain
      setUploadProgress('Creating Profile NFT on blockchain...');
      const profileService = new ProfileService(connection);
      
      const createProfileParams: CreateProfileParams = {
        profileData: {
          name: profileData.name,
          bio: profileData.bio,
          country: profileData.country,
          website: profileData.website,
          hyperlink: profileData.hyperlink,
        },
        profileImageCid,
        bannerImageCid,
      };

      const transaction = await profileService.createProfileNFT(
        selectedAccount!.publicKey,
        createProfileParams
      );

      setUploadProgress('Waiting for transaction confirmation...');
      const signature = await transact(transaction);

      console.log('✅ Profile NFT created successfully!');
      console.log('📋 Transaction signature:', signature);

      Alert.alert(
        'Success!',
        `Profile NFT created for @${username}!\n\nYour profile is now stored on Solana blockchain with IPFS metadata.`,
        [
          {
            text: 'OK',
            onPress: () => onSkipToHome?.(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Error',
        `Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <ScrollView style={styles.container}>

      {/* Banner Image */}
      <TouchableOpacity onPress={selectBannerImage} style={styles.banner}>
        {bannerImageUri ? (
          <Image
            source={{ uri: bannerImageUri }}
            style={styles.banner}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Text style={styles.bannerPlaceholderText}>Tap to add banner</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Profile Image */}
      <TouchableOpacity style={styles.profileImageContainer} onPress={selectProfileImage}>
        {profileImageUri ? (
          <Image
            source={{ uri: profileImageUri }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileImagePlaceholderText}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Username Display */}
      {username && (
        <Text style={styles.usernameDisplay}>@{username}</Text>
      )}

      {/* Form Fields */}
      <View style={styles.rectanglesContainer}>
        <View style={styles.rectangle}>
          <Text style={styles.fieldLabel}>Name:</Text>
          <TextInput
            style={styles.textInput}
            value={profileData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            placeholder="Enter your name"
            placeholderTextColor="#666"
          />
        </View>
        
        <View style={styles.bigRectangle}>
          <Text style={styles.fieldLabel}>Bio:</Text>
          <TextInput
            style={[styles.textInput, styles.bioInput]}
            value={profileData.bio}
            onChangeText={(text) => handleInputChange('bio', text)}
            placeholder="Tell us about yourself"
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>
        
        <View style={styles.rectangle}>
          <Text style={styles.fieldLabel}>Country:</Text>
          <TextInput
            style={styles.textInput}
            value={profileData.country}
            onChangeText={(text) => handleInputChange('country', text)}
            placeholder="Your country"
            placeholderTextColor="#666"
          />
        </View>
        
        <View style={styles.rectangle}>
          <Text style={styles.fieldLabel}>Website:</Text>
          <TextInput
            style={styles.textInput}
            value={profileData.website}
            onChangeText={(text) => handleInputChange('website', text)}
            placeholder="https://yourwebsite.com"
            placeholderTextColor="#666"
          />
        </View>
        
        <View style={styles.rectangle}>
          <Text style={styles.fieldLabel}>Hyperlink:</Text>
          <TextInput
            style={styles.textInput}
            value={profileData.hyperlink}
            onChangeText={(text) => handleInputChange('hyperlink', text)}
            placeholder="Additional link"
            placeholderTextColor="#666"
          />
        </View>
      </View>


      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>{uploadProgress}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.skipButton} onPress={onSkipToHome}>
        <Text style={styles.skipText}>SKIP (DEBUG)</Text>
      </TouchableOpacity>
      
      
      <TouchableOpacity 
        style={[
          styles.createButton,
          (!selectedAccount || isLoading) && styles.disabledButton
        ]}
        onPress={createProfile}
        disabled={!selectedAccount || isLoading}
      >
        <Text style={[
          styles.createButtonText,
          (!selectedAccount || isLoading) && styles.disabledButtonText
        ]}>
          {isLoading ? 'Creating Profile...' : 'Create Profile'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  banner: {
    width: '100%',
    height: 120,
    alignSelf: 'center',
    marginTop: 0,
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
    width: 65,
    height: 65,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 30,
    marginTop: -32,
    position: 'relative',
  },
  profileImage: {
    width: 65,
    height: 65,
    borderRadius: 12,
  },
  profileImagePlaceholder: {
    width: 65,
    height: 65,
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    color: '#666666',
    fontSize: 24,
    fontFamily: 'Geist-Regular',
  },
  usernameDisplay: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'Geist-Light',
    marginLeft: 30,
    marginTop: 25,
    textAlign: 'left',
  },
  rectanglesContainer: {
    marginHorizontal: 30,
    marginTop: 35,
  },
  rectangle: {
    width: '100%',
    minHeight: 50,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 10,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 8,
  },
  bigRectangle: {
    width: '100%',
    minHeight: 90,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 10,
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 8,
  },
  fieldLabel: {
    color: '#5e5e5e',
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    marginBottom: 5,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    flex: 1,
  },
  bioInput: {
    textAlignVertical: 'top',
    minHeight: 60,
  },
  loadingContainer: {
    marginHorizontal: 30,
    marginTop: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Geist-Regular',
    marginTop: 10,
    textAlign: 'center',
  },
  createButton: {
    marginHorizontal: 30,
    marginTop: 30,
    marginBottom: 20,
    height: 50,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#5D5D5D',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: '#5D5D5D',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    fontWeight: '500',
  },
  disabledButton: {
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  disabledButtonText: {
    color: '#333333',
  },
  skipButton: {
    marginTop: 10,
    marginBottom: 30,
    alignItems: 'center',
  },
  skipText: {
    color: '#616161',
    fontSize: 12,
    fontFamily: 'GeistMono-Regular',
  },
});