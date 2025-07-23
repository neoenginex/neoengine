import React, {useState, useRef, useEffect} from 'react';
import {View, StyleSheet, Dimensions, FlatList, Animated, Text, Linking, TouchableOpacity} from 'react-native';
import {transact} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {useAuthorization} from '../components/providers/AuthorizationProvider';
import Slide1 from './Slide1';
import Slide2 from './Slide2';
import Slide3 from './Slide3';
import Login from './Login';

const {width} = Dimensions.get('window');

interface SwipeProps {
  onSkipToCreateUsername?: () => void;
  onWalletConnected?: () => void;
}

export default function Swipe({onSkipToCreateUsername, onWalletConnected}: SwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const {authorizeSession} = useAuthorization();
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  const slides = [
    {id: 0, component: <Slide1 />},
    {id: 1, component: <Slide2 />},
    {id: 2, component: <Slide3 />},
    {id: 3, component: <Login onSkip={onSkipToCreateUsername} />},
  ];

  const renderItem = ({item}: {item: {id: number; component: React.ReactNode}}) => (
    <View style={styles.slide}>
      {item.component}
    </View>
  );

  const getItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  const onMomentumScrollEnd = (event: any) => {
    const totalWidth = event.nativeEvent.layoutMeasurement.width;
    const xPosition = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(xPosition / totalWidth);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < slides.length) {
      setCurrentIndex(newIndex);
      resetAutoScroll(); // Reset timer when user manually scrolls
    }
  };

  const openTermsOfService = () => {
    Linking.openURL('https://www.deosx.com/pages/legal/terms-of-service');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.deosx.com/pages/legal/privacy-policy');
  };

  const handleConnectWallet = async () => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      await transact(async wallet => {
        await authorizeSession(wallet);
      });
      onWalletConnected?.();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setConnecting(false);
    }
  };

  const startAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearTimeout(autoScrollTimer.current);
    }
    
    if (currentIndex < slides.length - 1) {
      autoScrollTimer.current = setTimeout(() => {
        const nextIndex = currentIndex + 1;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        setCurrentIndex(nextIndex);
        
        // Continue auto-scrolling if not at login screen
        if (nextIndex < slides.length - 1) {
          startAutoScroll();
        }
      }, 10000);
    }
  };

  const resetAutoScroll = () => {
    if (autoScrollTimer.current) {
      clearTimeout(autoScrollTimer.current);
    }
    startAutoScroll();
  };

  useEffect(() => {
    startAutoScroll();
    
    return () => {
      if (autoScrollTimer.current) {
        clearTimeout(autoScrollTimer.current);
      }
    };
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (autoScrollTimer.current) {
        clearTimeout(autoScrollTimer.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        updateCellsBatchingPeriod={50}
        decelerationRate={0.95}
        snapToAlignment="start"
        snapToInterval={width}
        disableIntervalMomentum={true}
        disableScrollViewPanResponder={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
      
      {/* Wallet Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            isPressed && styles.buttonPressed
          ]}
          onPress={handleConnectWallet}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
        >
          <Text style={[
            styles.buttonText,
            isPressed && styles.buttonTextPressed
          ]}>
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Terms Text */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By continuing you agree to our{' '}
          <Text style={styles.linkText} onPress={openTermsOfService}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.linkText} onPress={openPrivacyPolicy}>
            Privacy Policy
          </Text>
        </Text>
      </View>
      
      {/* Fixed Position Pagination Dots */}
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex ? '#FFFFFF' : '#3E3E3E',
                transform: [{ scale: index === currentIndex ? 1.1 : 1 }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  slide: {
    width: width,
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  button: {
    marginHorizontal: 30,
    height: 50,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#8A8A8A',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonPressed: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  buttonText: {
    color: '#8A8A8A',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    fontWeight: '500',
  },
  buttonTextPressed: {
    color: '#000000',
  },
  termsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 60,
    right: 60,
    zIndex: 1000,
  },
  termsText: {
    fontSize: 12,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'GeistMono-Regular',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#616161',
    fontFamily: 'GeistMono-Regular',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
});