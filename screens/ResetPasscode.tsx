import React, {useState} from 'react';
import {StyleSheet, View, TouchableOpacity, Text, Alert} from 'react-native';
import CreatePasscode from './CreateCode';
import pinStorage from '../utils/pinStorage';

interface ResetPasscodeProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ResetPasscode({onSuccess, onCancel}: ResetPasscodeProps) {
  const [showCreateNew, setShowCreateNew] = useState(false);

  const handleConfirmReset = () => {
    Alert.alert(
      'Reset Passcode',
      'Are you sure you want to reset your passcode? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetPasscode,
        },
      ],
    );
  };

  const resetPasscode = async () => {
    try {
      const cleared = await pinStorage.clearPin();
      if (cleared) {
        setShowCreateNew(true);
      } else {
        Alert.alert('Error', 'Failed to reset passcode. Please try again.');
      }
    } catch (error) {
      console.error('Error resetting passcode:', error);
      Alert.alert('Error', 'Failed to reset passcode. Please try again.');
    }
  };

  const handleNewPasscodeCreated = () => {
    Alert.alert('Success', 'Your new passcode has been created.', [
      {
        text: 'OK',
        onPress: onSuccess,
      },
    ]);
  };

  if (showCreateNew) {
    return (
      <CreatePasscode
        onPasscodeCreated={handleNewPasscodeCreated}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Passcode</Text>
        <Text style={styles.subtitle}>
          You will need to create a new passcode after resetting.
        </Text>
        
        <TouchableOpacity style={styles.resetButton} onPress={handleConfirmReset}>
          <Text style={styles.resetButtonText}>Reset Passcode</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Geist-Regular',
    fontWeight: '600',
    marginBottom: 20,
  },
  subtitle: {
    color: '#888888',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  resetButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    fontWeight: '600',
  },
  cancelButton: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelText: {
    color: '#666666',
    fontSize: 16,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
  },
});
