import React, {useState} from 'react';
import {StyleSheet, View, TouchableOpacity, Text, Image} from 'react-native';

interface ConfirmPasscodeProps {
  originalCode: string[];
  onConfirm?: (code: string[]) => void;
  onBack?: () => void;
}

export default function ConfirmPasscode({
  originalCode,
  onConfirm,
  onBack,
}: ConfirmPasscodeProps) {
  const numbers = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'left',
    '0',
    'right',
  ];
  const [code, setCode] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);

  const handleNumberPress = (number: string) => {
    if (number && number !== 'left' && number !== 'right') {
      if (code.length < 6) {
        const newCode = [...code, number];
        setCode(newCode);

        // Check if passcode is complete
        if (newCode.length === 6) {
          // Check if codes match
          if (newCode.join('') === originalCode.join('')) {
            setShowError(false);
            onConfirm?.(newCode);
          } else {
            // Show error and reset if codes don't match
            setShowError(true);
            setTimeout(() => {
              setCode([]);
              setShowError(false);
            }, 2000);
          }
        }
      }
    } else if (number === 'right') {
      // Backspace
      setCode(code.slice(0, -1));
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Confirm Passcode</Text>

          <View style={styles.dotsContainer}>
            {Array.from({length: 6}).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index < code.length ? styles.filledDot : styles.emptyDot,
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

        {showError && <Text style={styles.errorText}>Incorrect</Text>}

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setCode([]);
            onBack?.();
          }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </>
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
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    fontFamily: 'Geist-Regular',
    textAlign: 'center',
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
  },
});