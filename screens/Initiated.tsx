import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Animated} from 'react-native';
import CreatePasscode from './CreatePasscode';
import {useAuthorization} from '../components/providers/AuthorizationProvider';

interface InitiatedProps {
  username?: string;
}

export default function Initiated({username = 'Username'}: InitiatedProps) {
  const {selectedAccount} = useAuthorization();
  const glowAnimation = useRef(new Animated.Value(0.3)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const [showCreateCode, setShowCreateCode] = useState(false);

  useEffect(() => {
    const createGlowEffect = () => {
      Animated.sequence([
        Animated.timing(glowAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnimation, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: false,
        }),
      ]).start(() => createGlowEffect());
    };

    createGlowEffect();

    setTimeout(() => {
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setShowCreateCode(true);
      });
    }, 5000);
  }, [glowAnimation, fadeAnimation]);

  if (showCreateCode) {
    if (!selectedAccount) {
      throw new Error('No wallet selected when creating passcode');
    }
    return <CreatePasscode walletAddress={selectedAccount.address} />;
  }

  return (
    <Animated.View style={[styles.container, {opacity: fadeAnimation}]}>
      <Animated.Text 
        style={[
          styles.text,
          {
            opacity: glowAnimation,
            textShadowColor: glowAnimation.interpolate({
              inputRange: [0.3, 1],
              outputRange: ['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.8)']
            }),
          }
        ]}
      >
        @{username}{'\n'}has been initiated.
      </Animated.Text>
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
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Geist-Light',
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 24,
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 20,
  },
});