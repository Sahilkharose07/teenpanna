// app/screens/drawable/ProfileScreen.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated,
  Easing,
  Dimensions,
  TextInput,
  Alert
} from 'react-native';
import styles from '../../styles/profileStyle';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [userData, setUserData] = useState({
    username: 'User123',
    email: 'user123@example.com',
    phone: '+91 9876543210',
    level: 'Gold',
    balance: 25000,
    wins: 128,
    winRate: '87%'
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animation on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleSave = () => {
    // Here you would typically save the updated user data
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim
            }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.iconButton}
        >
          <Ionicons name="menu" size={28} color="#FFD700" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.iconButton}
        >
          <Ionicons 
            name={isEditing ? "close" : "create-outline"} 
            size={24} 
            color="#FFD700" 
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Profile Content */}
      <ScrollView
        contentContainerStyle={styles.profileContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <Animated.View 
          style={[
            styles.avatarSection,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim
              }]
            }
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/300' }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
            {isEditing && (
              <TouchableOpacity style={styles.changePhotoButton}>
                <Ionicons name="camera" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* User Info Section */}
        <Animated.View 
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="person-outline" size={20} color="#FFD700" />
              <Text style={styles.infoLabel}>Username</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={userData.username}
                onChangeText={(text) => setUserData({...userData, username: text})}
              />
            ) : (
              <Text style={styles.infoValue}>{userData.username}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="mail-outline" size={20} color="#FFD700" />
              <Text style={styles.infoLabel}>Email</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={userData.email}
                onChangeText={(text) => setUserData({...userData, email: text})}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.infoValue}>{userData.email}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="call-outline" size={20} color="#FFD700" />
              <Text style={styles.infoLabel}>Phone</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.infoInput}
                value={userData.phone}
                onChangeText={(text) => setUserData({...userData, phone: text})}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{userData.phone}</Text>
            )}
          </View>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View 
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: slideAnim
              }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Game Statistics</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
              </View>
              <Text style={styles.statValue}>₹{userData.balance.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Balance</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
              </View>
              <Text style={styles.statValue}>{userData.wins}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="stats-chart" size={24} color="#FFD700" />
              </View>
              <Text style={styles.statValue}>{userData.winRate}</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
          </View>
        </Animated.View>

        {/* Save Button when editing */}
        {isEditing && (
          <Animated.View 
            style={[
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: slideAnim
                }]
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;