import React, {useState} from 'react';
import {StyleSheet, View, TouchableOpacity, Text, Image, Alert} from 'react-native';
import ConfirmPasscode from './ConfirmPasscode';
import Splash2 from './Splash2';
import pinStorage from '../utils/pinStorage';

interface CreatePasscodeProps {
  walletAddress: string;
  onPasscodeCreated?: (code: string[]) => void;
}

export default function CreatePasscode({walletAddress, onPasscodeCreated}: CreatePasscodeProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'left', '0', 'right'];
  const [code, setCode] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSplash2, setShowSplash2] = useState(false);

  const handleNumberPress = (number: string) => {
    if (number && number !== 'left' && number !== 'right') {
      if (code.length < 6) {
        const newCode = [...code, number];
        setCode(newCode);
        
        // Auto-navigate when 6 digits entered
        if (newCode.length === 6) {
          setTimeout(() => {
            setShowConfirm(true);
          }, 200);
        }
      }
    } else if (number === 'right') {
      // Backspace
      setCode(code.slice(0, -1));
    }
  };

  const handleConfirmPasscode = async (confirmedCode: string[]) => {
    try {
      const pinString = confirmedCode.join('');
      const stored = await pinStorage.storePinForWallet(walletAddress, pinString);
      
      if (stored) {
        onPasscodeCreated?.(confirmedCode);
        setShowSplash2(true);
      } else {
        Alert.alert('Error', 'Failed to store passcode. Please try again.');
      }
    } catch (error) {
      console.error('Error storing passcode:', error);
      Alert.alert('Error', 'Failed to store passcode. Please try again.');
    }
  };

  if (showSplash2) {
    return <Splash2 />;
  }

  if (showConfirm) {
    return (
      <ConfirmPasscode
        originalCode={code}
        onConfirm={handleConfirmPasscode}
        onBack={() => {
          setShowConfirm(false);
          setCode([]);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Passcode</Text>
        
        <View style={styles.dotsContainer}>
          {Array.from({length: 6}).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index < code.length ? styles.filledDot : styles.emptyDot
              ]}
            />
          ))}
        </View>
        
        <View style={styles.dialpad}>
          {numbers.map((number, index) => (
            <TouchableOpacity
              key={index}
              style={
                number === 'left' || number === 'right' 
                  ? styles.sideButton 
                  : number && number !== '' 
                    ? styles.dialpadButton 
                    : styles.emptyButton
              }
              onPress={() => handleNumberPress(number)}
              disabled={!number || number === 'left'}
            >
              {number && number !== 'left' && number !== 'right' && (
                <Text style={styles.dialpadText}>{number}</Text>
              )}
              {number === 'right' && (
                <Image
                  source={require('../assets/icons/backspace.png')}
                  style={styles.backspaceIcon}
                  resizeMode="contain"
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    justifyContent: 'space-evenly',
    marginTop: 300,
  },
  dialpadButton: {
    width: 75,
    height: 75,
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 8,
  },
  emptyButton: {
    width: 75,
    height: 75,
    backgroundColor: 'transparent',
    marginBottom: 15,
    marginHorizontal: 8,
  },
  sideButton: {
    width: 75,
    height: 75,
    backgroundColor: '#141414',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 8,
  },
  dialpadText: {
    color: '#4A4A4A',
    fontSize: 32,
    fontFamily: 'Geist-Regular',
    fontWeight: '500',
  },
  backspaceIcon: {
    width: 32,
    height: 32,
    tintColor: '#3e3e3e',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
    position: 'absolute',
    top: 330,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  emptyDot: {
    backgroundColor: 'transparent',
  },
  filledDot: {
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Geist-Regular',
    position: 'absolute',
    top: 250,
  },
});