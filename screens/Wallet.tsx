import React, {useRef} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Animated} from 'react-native';

interface WalletProps {
  onTabChange?: (tab: string) => void;
  onHeaderNavigation?: (tab: string) => void;
}

export default function Wallet({onTabChange, onHeaderNavigation}: WalletProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const navbarOpacity = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);

  const handleTabChange = (tab: string) => {
    onTabChange?.(tab);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const diff = offsetY - lastScrollY.current;
        
        if (diff > 3) {
          // Scrolling down - hide header and fade navbar
          Animated.timing(headerTranslateY, {
            toValue: -50,
            duration: 200,
            useNativeDriver: true,
          }).start();
          Animated.timing(navbarOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else if (diff < -3) {
          // Scrolling up - show header and navbar
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
          Animated.timing(navbarOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
        
        lastScrollY.current = offsetY;
      },
    }
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.header, 
        { 
          transform: [{ translateY: headerTranslateY }]
        }
      ]}>
        <TouchableOpacity style={styles.logoContainer} onPress={() => onHeaderNavigation?.('profile')}>
          <Image
            source={require('../assets/logos/neologo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>WALLET</Text>
        <View style={styles.spacer} />
      </Animated.View>
      <ScrollView 
        style={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={1}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollContent}>
          {/* Content will go here */}
        </View>
      </ScrollView>
      
      <Animated.View style={[
        styles.navbar, 
        { 
          opacity: navbarOpacity
        }
      ]}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabChange('home')}
        >
          <Image
            source={require('../assets/icons/home.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabChange('search')}
        >
          <Image
            source={require('../assets/icons/search.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.connectNavItem}
          onPress={() => handleTabChange('connect')}
        >
          <Image
            source={require('../assets/icons/connect.png')}
            style={styles.connectIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabChange('swap')}
        >
          <Image
            source={require('../assets/icons/swap.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => handleTabChange('social')}
        >
          <Image
            source={require('../assets/icons/social.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 16,
    paddingRight: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 50,
  },
  logoContainer: {
    width: 28,
    height: 28,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 16,
    height: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'microgramma-d-extended-bold',
    flex: 1,
    marginLeft: 8,
    textAlignVertical: 'center',
  },
  gearContainer: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  gearIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  walletContainer: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'microgramma-d-extended-bold',
    textAlign: 'center',
  },
  spacer: {
    width: 35,
    height: 35,
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  connectNavItem: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFFFFF',
  },
  connectIcon: {
    width: 26,
    height: 26,
    tintColor: '#FFFFFF',
  },
  activeNavIcon: {
    tintColor: '#666666',
    shadowColor: '#666666',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});