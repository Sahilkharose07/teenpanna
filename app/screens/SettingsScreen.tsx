import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Load saved sound setting
  useEffect(() => {
    const loadSetting = async () => {
      const savedValue = await AsyncStorage.getItem('soundEnabled');
      if (savedValue !== null) {
        setIsSoundEnabled(savedValue === 'true');
      }
    };
    loadSetting();
  }, []);

  const handleSoundToggle = async (value: boolean) => {
    setIsSoundEnabled(value);
    await AsyncStorage.setItem('soundEnabled', value.toString());
    
    // Play test sound when enabling
    if (value) {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sound/cash.mp3')
        );
        await sound.playAsync();
        setTimeout(() => {
          sound.unloadAsync();
        }, 1000);
      } catch (error) {
        console.log('Sound error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Game Sounds</Text>
        <Switch
          value={isSoundEnabled}
          onValueChange={handleSoundToggle}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isSoundEnabled ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingText: {
    fontSize: 16,
  },
});

export default SettingsScreen;