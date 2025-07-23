import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useUserProfile } from '../hooks/useUserProfile';

interface ProfileIconProps {
  size?: number;
  onPress?: () => void;
  showFallback?: boolean;
}

export default function ProfileIcon({ 
  size = 28, // Match original icon size
  onPress, 
  showFallback = true 
}: ProfileIconProps) {
  const { profile, profileImageUrl, loading } = useUserProfile();

  // DEBUG: Log the current state
  console.log('🔍 ProfileIcon Debug:', {
    profile: profile ? {
      sbt_handle: profile.sbt_handle,
      name: profile.name,
      image: profile.image
    } : null,
    profileImageUrl,
    loading
  });

  // Use the exact same styling as the original logoContainer
  const containerStyle = {
    width: 28,
    height: 28,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  const imageStyle = {
    width: 26, // Slightly smaller than container to maintain padding
    height: 26,
    borderRadius: 5, // Slightly smaller border radius
  };

  const logoStyle = {
    width: 16, // Original logo size
    height: 16,
  };

  if (loading) {
    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <View style={containerStyle}>
          <Text style={styles.loadingText}>...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Show uploaded profile image if available - fit inside the original icon container
  if (profileImageUrl) {
    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <View style={containerStyle}>
          <Image
            source={{ uri: profileImageUrl }}
            style={imageStyle}
            resizeMode="cover"
          />
        </View>
      </TouchableOpacity>
    );
  }

  // Show fallback with user's initials if profile exists but no image
  if (profile && showFallback) {
    const initials = profile.name
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);

    return (
      <TouchableOpacity onPress={onPress} disabled={!onPress}>
        <View style={containerStyle}>
          <Text style={styles.fallbackText}>{initials}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Show default NeoEngine logo if no profile or showFallback is false - exact original styling
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress}>
      <View style={containerStyle}>
        <Image
          source={require('../assets/logos/neologo.png')}
          style={logoStyle}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Geist-Medium',
    fontWeight: '600',
  },
  loadingText: {
    color: '#666666',
    fontSize: 10,
    fontFamily: 'Geist-Regular',
  },
});