import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View, Animated, Image} from 'react-native';
import CreateProfile from './CreateProfile';
import Home from './Home';

interface Splash2Props {
  onComplete?: () => void;
}

export default function Splash2({onComplete}: Splash2Props) {
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  const fadeOutAnimation = useRef(new Animated.Value(1)).current;
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [showHome, setShowHome] = useState(false);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // After 3 seconds, fade out
    setTimeout(() => {
      Animated.timing(fadeOutAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setShowCreateProfile(true);
      });
    }, 3000);
  }, [fadeAnimation, fadeOutAnimation]);

  const handleSkipToHome = () => {
    setShowHome(true);
  };

  if (showHome) {
    return <Home />;
  }

  if (showCreateProfile) {
    return <CreateProfile onSkipToHome={handleSkipToHome} />;
  }

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnimation}]}>
      <Animated.View style={[styles.content, {opacity: fadeOutAnimation}]}>
        <Image
          source={require('../assets/logos/neoengine.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});