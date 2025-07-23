import React, {useEffect, useRef} from 'react';
import {StyleSheet, Animated, Image} from 'react-native';

interface SplashProps {
  onSplashComplete?: () => void;
}

export default function Splash({onSplashComplete}: SplashProps) {
  const fadeInAnim = useRef(new Animated.Value(0)).current;
  const fadeOutAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeInAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onSplashComplete) {
        onSplashComplete();
      }
    });
  }, [fadeInAnim, fadeOutAnim, onSplashComplete]);

  return (
    <Animated.View style={[styles.container, {opacity: fadeOutAnim}]}>
      <Animated.View style={[styles.logoContainer, {opacity: fadeInAnim}]}>
        <Image
          source={require('../assets/icons/connect.png')}
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
});