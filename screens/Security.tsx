import React, {useState} from 'react';
import {StyleSheet, View, ImageBackground, Text, TouchableOpacity} from 'react-native';

export default function Security() {
  const [selectedButton, setSelectedButton] = useState('passcode');

  const handlePasscodeSelect = () => {
    setSelectedButton('passcode');
  };

  const handleBiometricsSelect = () => {
    setSelectedButton('biometrics');
  };

  return (
    <ImageBackground 
      source={require('../assets/backgrounds/grad-bg.png')} 
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.text}>
          Secure your wallet with either a passcode{'\n'}
          or biometrics to prevent unauthorized access.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedButton === 'biometrics' ? styles.filledButton : styles.outlineButton
          ]}
          onPress={handleBiometricsSelect}
        >
          <Text style={[
            styles.buttonText,
            selectedButton === 'biometrics' ? styles.filledButtonText : styles.outlineButtonText
          ]}>
            Use Biometrics
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.button,
            selectedButton === 'passcode' ? styles.filledButton : styles.outlineButton
          ]}
          onPress={handlePasscodeSelect}
        >
          <Text style={[
            styles.buttonText,
            selectedButton === 'passcode' ? styles.filledButtonText : styles.outlineButtonText
          ]}>
            Create Passcode
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#616161',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
  },
  button: {
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  filledButton: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    fontWeight: '500',
  },
  filledButtonText: {
    color: '#000000',
  },
  outlineButtonText: {
    color: '#E0E0E0',
  },
});