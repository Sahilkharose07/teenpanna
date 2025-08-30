// app/screens/drawable/dashboard.tsx
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
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
import { Image } from 'expo-image'; // ✅ use expo-image (supports contentFit)
import styles from '../../styles/DashboardScreen';
import DepositScreen from '../Deposit';
import WithdrawScreen from '../Withdraw';
import HistoryScreen from '../History';
import * as ScreenOrientation from 'expo-screen-orientation'; 

const { width } = Dimensions.get('window');

// Define game data with proper structure
const games = [
  {
    id: 1,
    name: 'Slots',
    players: '3.2k playing',
    image: require('../../../assets/images/comingsoon.png'),
    route: '/screens/SlotsScreen'
  },
  {
    id: 2,
    name: 'Roulette',
    players: '1.8k playing',
    image: require('../../../assets/images/comingsoon.png'),
    route: '/screens/RouletteScreen'
  },
  {
    id: 3,
    name: 'Teen Patti',
    players: '5.4k playing',
    image: require('../../../assets/images/teenpatti1.jpg'),
    route: '/screens/TeenPattiScreen'
  },
  {
    id: 4,
    name: 'Andar Bahar',
    players: '4.1k playing',
    image: require('../../../assets/images/comingsoon.png'),
    route: '/screens/Andar-BaharScreen'
  },
  {
    id: 5,
    name: 'AK47',
    players: '2.7k playing',
    image: require('../../../assets/images/comingsoon.png'),
    route: '/screens/AK47Screen'
  },
];

const teenPattiImages = [
  require('../../../assets/images/teenpatti1.jpg'),
  require('../../../assets/images/teenpatti2.jpg'),
  require('../../../assets/images/teenpatti3.jpeg'),
  require('../../../assets/images/teenpatti4.webp'),
  require('../../../assets/images/teenpatti5.jpg'),
];

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

  useEffect(() => {
    // Fade in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Scale animation for cards
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex === teenPattiImages.length - 1) {
          scrollRef.current?.scrollTo({
            x: 0,
            animated: false,
          });
          return 0;
        }
        return prevIndex + 1;
      });
    }, 3000);

    // Simulate socket connection
    const connectSocket = async () => {
      try {
        console.log('Attempting socket connection...');
        setSocketConnected(true);
        setSocketId(`socket-${Math.random().toString(36).substr(2, 9)}`);
      } catch (error) {
        console.error('Socket connection failed:', error);
        setSocketConnected(false);
      }
    };

    connectSocket();

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentIndex < teenPattiImages.length) {
      scrollRef.current?.scrollTo({
        x: currentIndex * width,
        animated: true,
      });
    }
  }, [currentIndex]);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } catch (err) {
        console.log('Orientation lock error:', err);
      }
    };

    lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const handleGameNavigation = (gameRoute: string) => {
    try {
      if (socketConnected) {
        console.log('Navigating to game with socket ID:', socketId);
        router.push(gameRoute as any);
      } else {
        alert('Connection error. Please check your internet connection and try again.');
        console.error('Socket not connected');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Failed to connect to the game. Please try again.');
    }
  };

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

      {/* Action Buttons */}
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

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.gamesSection} showsVerticalScrollIndicator={false}>
        {/* Featured Games Slider */}
        <View style={styles.sliderContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.slider}
          >
            {teenPattiImages.map((imageSource, index) => (
              <View key={index} style={styles.slide}>
                <Image
                  source={imageSource}
                  style={styles.slideImage}
                  contentFit="cover"
                />
                <View style={styles.slideOverlay}>
                  <View style={styles.slideContent}>
                    <View style={styles.slideTextContainer}>
                      <Text style={styles.slideTitle}>Featured Game</Text>
                      <Text style={styles.slideSubtitle}>Play Now & Win Big!</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.playNowButton}
                      onPress={() => handleGameNavigation('/screens/TeenPattiScreen')}
                    >
                      <Text style={styles.playNowText}>PLAY NOW</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {teenPattiImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        </View>

        {/* Game Cards Grid */}
        <Text style={styles.sectionTitle}>Popular Games</Text>
        <Animated.View
          style={[
            styles.gamesGrid,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {games.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={styles.gameCard}
              onPress={() => handleGameNavigation(game.route)}
            >
              <View style={styles.gameImageContainer}>
                <Image
                  source={game.image}
                  style={styles.gameImage}
                  contentFit="cover"
                  onError={() => console.log("Image load error")}
                />
                <View style={styles.playersBadge}>
                  <Ionicons name="people" size={12} color="#0A0A1F" />
                  <Text style={styles.playersText}>{game.players}</Text>
                </View>
              </View>
              <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{game.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Profile Modal */}
      <Modal visible={profileModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackground}
            onPress={() => setProfileModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Player Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                <Ionicons name="close" size={28} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalAvatarContainer}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/300' }}
                style={styles.modalAvatar}
                contentFit="cover"
              />
              <View style={styles.modalOnlineIndicator} />
            </View>

            <Text style={styles.modalUsername}>User123</Text>
            <Text style={styles.modalLevel}>VIP Level: Gold</Text>

            <View style={styles.modalStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹25,000</Text>
                <Text style={styles.statLabel}>Balance</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>128</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>87%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.logoutButton}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Deposit / Withdraw / History */}
      <DepositScreen
        isVisible={isDepositVisible}
        onClose={() => setIsDepositVisible(false)}
      />
      <WithdrawScreen
        isVisible={isWithdrawVisible}
        onClose={() => setIsWithdrawVisible(false)}
        availableBalance={25000} 
      />
      <HistoryScreen
        isVisible={isHistoryVisible}
        onClose={() => setIsHistoryVisible(false)}
      />
    </SafeAreaView>
  );
};

export default DashboardScreen;
