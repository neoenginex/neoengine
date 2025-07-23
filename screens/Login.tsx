import React from 'react';
import {StyleSheet, Image, View, TouchableOpacity, Text} from 'react-native';

interface LoginProps {}

export default function Login({}: LoginProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logos/neoengine.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  logo: {
    width: 200,
    height: 200,
  },
});