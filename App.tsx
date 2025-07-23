import React, {useState, useEffect} from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';
import Splash from './screens/Splash';
import Swipe from './screens/Swipe';
import CreateUsername from './screens/CreateUsername';
import Initiated from './screens/Initiated';
import EnterPasscode from './screens/EnterPasscode';
import Home from './screens/Home';
import {ConnectionProvider} from './components/providers/ConnectionProvider';
import {AuthorizationProvider, useAuthorization} from './components/providers/AuthorizationProvider';
import pinStorage from './utils/pinStorage';

function AppContent() {
  const {selectedAccount} = useAuthorization();
  const [showSplash, setShowSplash] = useState(true);
  const [showCreateUsername, setShowCreateUsername] = useState(false);
  const [showInitiated, setShowInitiated] = useState(false);
  const [showEnterPasscode, setShowEnterPasscode] = useState(false);
  const [showHome, setShowHome] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [createdUsername, setCreatedUsername] = useState('');
  const [hasCheckedPin, setHasCheckedPin] = useState(false);


  // Check if returning user when wallet connects
  useEffect(() => {
    const checkForExistingPin = async () => {
      if (selectedAccount && !hasCheckedPin) {
        const hasPin = await pinStorage.hasStoredPinForWallet(selectedAccount.address);
        setHasCheckedPin(true);
        
        if (hasPin) {
          // Returning user - show PIN entry
          setShowEnterPasscode(true);
          setShowSplash(false);
          setShowCreateUsername(false);
          setShowInitiated(false);
        }
      }
    };

    checkForExistingPin();
  }, [selectedAccount, hasCheckedPin]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleSkipToCreateUsername = () => {
    setShowCreateUsername(true);
  };

  const handleWalletConnected = () => {
    setIsWalletConnected(true);
    setShowCreateUsername(true);
  };

  const handleUsernameCreated = (username: string) => {
    setCreatedUsername(username);
    setShowCreateUsername(false);
    setShowInitiated(true);
  };

  const handleBackToLogin = () => {
    setShowCreateUsername(false);
    setShowInitiated(false);
    setShowEnterPasscode(false);
    setShowHome(false);
    setHasCheckedPin(false);
    // This will show the Swipe (login) screen
  };

  const handleWalletDisconnected = () => {
    setIsWalletConnected(false);
    setShowCreateUsername(false);
    setShowInitiated(false);
    setShowEnterPasscode(false);
    setShowHome(false);
    setHasCheckedPin(false);
  };

  const handlePinSuccess = () => {
    setShowEnterPasscode(false);
    setShowHome(true);
  };

  // Returning user flow
  if (showHome) {
    return <Home />;
  }

  if (showEnterPasscode && selectedAccount) {
    return (
      <EnterPasscode 
        walletAddress={selectedAccount.address}
        onSuccess={handlePinSuccess}
        onCancel={handleWalletDisconnected}
      />
    );
  }

  // New user flow
  return (
    <>
      {showSplash ? (
        <Splash onSplashComplete={handleSplashComplete} />
      ) : showInitiated ? (
        <Initiated username={createdUsername} />
      ) : showCreateUsername ? (
        <CreateUsername 
          onCancel={handleBackToLogin} 
          onDisconnectWallet={handleWalletDisconnected}
          isWalletConnected={isWalletConnected}
          onUsernameCreated={handleUsernameCreated}
        />
      ) : (
        <Swipe 
          onSkipToCreateUsername={handleSkipToCreateUsername}
          onWalletConnected={handleWalletConnected}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <AuthorizationProvider>
        <View style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#000000" />
          <AppContent />
        </View>
      </AuthorizationProvider>
    </ConnectionProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

