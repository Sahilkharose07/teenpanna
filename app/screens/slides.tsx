// app/screens/drawable/dashboard.tsx
import { Ionicons } from '@expo/vector-icons';
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
  Dimensions
} from 'react-native';
import styles from '../styles/DashboardScreen';
import DepositScreen from './Deposit';
import WithdrawScreen from './Withdraw';
import HistoryScreen from './History';

const { width } = Dimensions.get('window');



const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [profileModalVisible, setProfileModalVisible] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(1);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [selectedAction, setSelectedAction] = useState<string>('deposit');
  const [isDepositVisible, setIsDepositVisible] = useState<boolean>(false);
  const [isWithdrawVisible, setIsWithdrawVisible] = useState<boolean>(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState<boolean>(false);

  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;


  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={28} color="#FFD700" />
        </TouchableOpacity>

        <View style={styles.profileContainer}>
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            style={styles.avatarContainer}
          >
            <Image
              source={{ uri: 'https://i.pravatar.cc/100' }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.onlineIndicator} />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.username}>Welcome, User123</Text>
            <View style={styles.balanceContainer}>
              <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
              <Text style={styles.balance}>25,000</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Action Buttons with Animation - Updated UI */}
      <Animated.View
        style={[
          styles.actions,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })
            }]
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedAction === 'deposit' && styles.actionButtonSelected
          ]}
          onPress={() => {
            setSelectedAction('deposit');
            setIsDepositVisible(true);
          }}
        >
          <Text style={[
            styles.actionText,
            selectedAction === 'deposit' && styles.actionTextSelected
          ]}>
            Deposit
          </Text>
        </TouchableOpacity>

<TouchableOpacity
          style={[
            styles.actionButton,
            selectedAction === 'withdraw' && styles.actionButtonSelected
          ]}
          onPress={() => {
            setSelectedAction('withdraw');
            setIsWithdrawVisible(true);
          }}
        >
          <Text style={[
            styles.actionText,
            selectedAction === 'withdraw' && styles.actionTextSelected
          ]}>
            Withdraw
          </Text>
        </TouchableOpacity>

     <TouchableOpacity
          style={[
            styles.actionButton,
            selectedAction === 'history' && styles.actionButtonSelected
          ]}
          onPress={() => {
            setSelectedAction('history');
            setIsHistoryVisible(true);
          }}
        >
          <Text style={[
            styles.actionText,
            selectedAction === 'history' && styles.actionTextSelected
          ]}>
            History
          </Text>
        </TouchableOpacity>
      </Animated.View>
</SafeAreaView>
  );
};

export default DashboardScreen;