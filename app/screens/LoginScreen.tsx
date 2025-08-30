import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import styles from '../styles/authStyles';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = () => {
  
    router.replace('./drawable/dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teen Panna</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.switchText}>
        Don't have an account?{' '}
        <Text
          style={styles.linkText}
          onPress={() => router.push('./RegisterScreen')}>
          Register
        </Text>
      </Text>
    </View>
  );
}