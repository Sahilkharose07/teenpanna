import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';


import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { styles } from '../../styles/teenpatti';

// Define your navigation types
type RootStackParamList = {
  MainDrawer: undefined;
  Settings: undefined;
};

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

interface Player {
  id: number;
  name: string;
  cards: string[];
  chips: number;
  isFolded: boolean;
  avatar: string;
  betAmount: number;
  message?: string;
  status: string;
}

interface ChipAnimation {
  id: number;
  amount: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
}

const getDeck = () => {
  const deck: string[] = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push(`${value}${suit}`);
    }
  }
  return deck;
};

function shuffle(array: string[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getCardValue(card: string) {
  const value = card.slice(0, -1);
  return values.indexOf(value);
}

function evaluateHand(cards: string[]): number {
  const cardValues = cards.map(getCardValue).sort((a, b) => a - b);
  const suits = cards.map((c) => c.slice(-1));
  const isSameSuit = suits.every((s) => s === suits[0]);
  const isSequence = cardValues[2] - cardValues[1] === 1 && cardValues[1] - cardValues[0] === 1;
  const isTrail = cardValues[0] === cardValues[1] && cardValues[1] === cardValues[2];

  if (isTrail) return 6;
  if (isSequence && isSameSuit) return 5;
  if (isSameSuit) return 4;
  if (isSequence) return 3;
  if (cardValues[0] === cardValues[1] || cardValues[1] === cardValues[2] || cardValues[0] === cardValues[2]) return 2;
  return 1;
}

const initialPlayers = (): Player[] => [
  { id: 1, name: 'You', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=1', betAmount: 0, status: 'Blind' },
  { id: 2, name: 'Bot 1', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=2', betAmount: 0, status: 'Blind' },
  { id: 3, name: 'Bot 2', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=3', betAmount: 0, status: 'Blind' },
  { id: 4, name: 'Bot 3', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=4', betAmount: 0, status: 'Blind' },
  { id: 5, name: 'Bot 4', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=5', betAmount: 0, status: 'Blind' },
];

export default function TeenPattiScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [turn, setTurn] = useState(0);
  const [pot, setPot] = useState(0);
  const [round, setRound] = useState(1);
  const [isPacked, setIsPacked] = useState(false);
  const [showCards, setShowCards] = useState<Record<number, boolean>>({});
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winnerDeclared, setWinnerDeclared] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPaused, setIsPaused] = useState(false);
  const [chipAnimations, setChipAnimations] = useState<ChipAnimation[]>([]);
  const [nextChipId, setNextChipId] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const { width, height } = Dimensions.get('window');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const router = useRouter();

  // Merge styles with any missing ones
  const mergedStyles = {
    ...styles,
    settingsButton: StyleSheet.create({
      settingsButton: {
        position: 'absolute',
        right: 20,
        top: 10,
        padding: 10,
        zIndex: 100,
      }
    }).settingsButton
  };

  const playChipSound = async () => {
  if (!isSoundEnabled) return; // Don't play if sound is disabled
  
  try {
    if (soundRef.current) {
      await soundRef.current.replayAsync();
      return;
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../../../assets/sound/cash.mp3'),
      { shouldPlay: true }
    );
    soundRef.current = sound;
    await sound.playAsync();
  } catch (error) {
    console.error('Sound error:', error);
  }
};

  useFocusEffect(
  React.useCallback(() => {
    const syncSoundSetting = async () => {
      const saved = await AsyncStorage.getItem('soundEnabled');
      if (saved !== null) {
        setIsSoundEnabled(saved === 'true');
      }
    };
    syncSoundSetting();
  }, [])
);


  const isBotTurn = () => {
    return players[turn]?.id !== 1;
  };

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (err) {
        console.log('Orientation lock error:', err);
      }
    };

    lockOrientation();
    dealCards();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    RNStatusBar.setHidden(true, 'slide');
  }, []);

  const sendMessage = (playerIndex: number, message: string) => {
    setPlayers(prev =>
      prev.map((p, i) =>
        i === playerIndex ? { ...p, message } : p
      )
    );

    setTimeout(() => {
      setPlayers(prev =>
        prev.map((p, i) =>
          i === playerIndex ? { ...p, message: '' } : p
        )
      );
    }, 3000);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      sendMessage(0, chatMessage);
      setChatMessage('');
      Keyboard.dismiss();
    }
  };

  useEffect(() => {
    if (isBotTurn() && !players[turn].isFolded && !isPaused) {
      const timeout = setTimeout(() => {
        const botMessages = ["Good hand!", "Hmm...", "Nice try!", "I'm in!", "Let's go!", "😎", "Folded!"];
        const randomMsg = botMessages[Math.floor(Math.random() * botMessages.length)];
        sendMessage(turn, randomMsg);

        const randomAction = Math.random();
        if (randomAction < 0.5) placeBet(5);
        else if (randomAction < 0.8) placeBet(10);
        else fold();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [turn, isPaused]);

  const getPlayerPosition = (index: number): ViewStyle => {
    const positions = [
      { bottom: 20, left: width * 0.6 - 100 },
      { bottom: height * 0.25, left: 30 },
      { top: 20, left: width * 0.2 },
      { top: 20, right: width * 0.2 },
      { bottom: height * 0.25, right: 30 },
      { top: height * 0.06, left: width * 0.6 - 100 },
    ];

    return {
      position: 'absolute',
      ...positions[index],
      alignItems: 'center',
    };
  };

  const animateChipToPot = (playerIndex: number, amount: number) => {
    playChipSound();

    const playerPosition = getPlayerPosition(playerIndex);
    const startX = typeof playerPosition.left === 'number'
      ? playerPosition.left
      : (playerPosition.left as unknown as number) || width - 100;

    const startY = typeof playerPosition.bottom === 'number'
      ? height - playerPosition.bottom
      : (playerPosition.top as unknown as number) || 0;

    const centerX = width / 2 - 25;
    const centerY = height / 2 - 25;

    const newChip: ChipAnimation = {
      id: nextChipId,
      amount,
      x: new Animated.Value(startX),
      y: new Animated.Value(startY),
      opacity: new Animated.Value(1),
    };

    setNextChipId(nextChipId + 1);
    setChipAnimations(prev => [...prev, newChip]);

    Animated.parallel([
      Animated.timing(newChip.x, {
        toValue: centerX,
        duration: 500,
        useNativeDriver: false,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(newChip.y, {
        toValue: centerY,
        duration: 500,
        useNativeDriver: false,
        easing: Easing.out(Easing.quad),
      }),
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(newChip.opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]),
    ]).start(() => {
      setChipAnimations(prev => prev.filter(chip => chip.id !== newChip.id));
    });
  };

  const dealCards = () => {
    const deck = shuffle(getDeck());
    const newPlayers = players.map((p, i) => ({
      ...p,
      cards: deck.slice(i * 3, i * 3 + 3),
      isFolded: false,
      betAmount: 0,
      status: 'Blind'
    }));
    setPlayers(newPlayers);
    setPot(0);
    setTurn(0);
    setIsPacked(false);
    setShowCards({ 1: false });
    setIsPaused(false);
    setChipAnimations([]);
  };

  const showCardsHandler = (playerId: number) => {
    setShowCards(prev => ({ ...prev, [playerId]: true }));
    setPlayers(prev => prev.map(p =>
      p.id === playerId ? { ...p, status: String(evaluateHand(p.cards) - 1) } : p
    ));
  };

  const nextRound = () => {
    setTimeout(() => {
      dealCards();
      setRound((r) => r + 1);
      setWinnerDeclared(false);
    }, 500);
  };

  const placeBet = (amount: number) => {
    stopTimer();
    animateChipToPot(turn, amount);
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === turn && !p.isFolded && p.chips >= amount
          ? { ...p, chips: p.chips - amount, betAmount: amount }
          : p
      )
    );
    setPot((prev) => prev + amount);
    nextTurn();
  };

  const placeBlindBet = (amount: number) => {
    placeBet(amount);
    if (!showCards[1]) {
      setPlayers(prev => prev.map(p =>
        p.id === 1 ? { ...p, status: 'Blind' } : p
      ));
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fold = () => {
    stopTimer();

    if (players[turn].id === 1) {
      const visibility: Record<number, boolean> = {};
      players.forEach(p => visibility[p.id] = true);
      setShowCards(visibility);
      setIsPacked(true);
    }

    setPlayers((prev) => prev.map((p, i) => (i === turn ? { ...p, isFolded: true } : p)));
    nextTurn();
  };

  const show = () => {
    setIsPaused(true);
    stopTimer();
    const activePlayers = players.filter((p) => !p.isFolded);
    const scores = activePlayers.map((p) => ({ id: p.id, score: evaluateHand(p.cards) }));
    scores.sort((a, b) => b.score - a.score);
    const winner = players.find((p) => p.id === scores[0].id);
    if (winner) {
      const visibility: Record<number, boolean> = {};
      activePlayers.forEach((p) => (visibility[p.id] = true));
      setShowCards(visibility);
      setIsPacked(true);
      setWinnerDeclared(true);
      animateWinner(winner.name);
      distributePot(winner.id);
    }
  };

  const animateWinner = (name: string) => {
    setWinnerName(name);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.exp),
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setWinnerName(null);
          nextRound();
        });
      }, 3000);
    });
  };

  const distributePot = (winnerId: number) => {
    setPlayers((prev) => prev.map((p) => (p.id === winnerId ? { ...p, chips: p.chips + pot } : p)));
    setPot(0);
  };

  const nextTurn = () => {
    for (let i = 1; i <= players.length; i++) {
      const next = (turn + i) % players.length;
      if (!players[next].isFolded) {
        setTurn(next);
        return;
      }
    }
  };

  useEffect(() => {
    const activePlayers = players.filter((p) => !p.isFolded);
    if (activePlayers.length === 1 && !winnerDeclared) {
      const winner = activePlayers[0];
      setWinnerDeclared(true);
      animateWinner(winner.name);
      distributePot(winner.id);
    }
  }, [players, winnerDeclared]);

  useEffect(() => {
    if (players[turn].isFolded || isPaused) return;
    setTimeLeft(10);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timerRef.current!);
          if (!isBotTurn()) fold();
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [turn, isPaused]);

  return (
    <View style={mergedStyles.container}>
      <StatusBar hidden />
      <Image source={require('../../../assets/images/table.png')} style={mergedStyles.tableImage}
        contentFit="cover" />

      <TouchableOpacity
        style={mergedStyles.chatIconButton}
        onPress={() => setIsChatOpen(!isChatOpen)}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
      </TouchableOpacity>

      <View style={[mergedStyles.potContainer, { top: height / 2 - 30, left: width / 2 - 50 }]}>
        <Text style={mergedStyles.potText}>Pot: {pot} 🪙</Text>
      </View>

      <View style={mergedStyles.topBar}>
        <TouchableOpacity
          style={mergedStyles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={mergedStyles.settingsButton}
          onPress={() => router.push('/screens/SettingsScreen')}
        >
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {players.map((p, index) => {
        const pulseAnim = useRef(new Animated.Value(1)).current;

        useEffect(() => {
          if (turn === index && !p.isFolded && !winnerDeclared) {
            Animated.loop(
              Animated.sequence([
                Animated.timing(pulseAnim, {
                  toValue: 1.1,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ])
            ).start();
          } else {
            pulseAnim.setValue(1);
          }
        }, [turn, p.isFolded, winnerDeclared]);

        return (
          <View key={p.id} style={[mergedStyles.playerContainer, getPlayerPosition(index)]}>
            <View style={mergedStyles.playerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Animated.Image
                  source={{ uri: p.avatar }}
                  style={[
                    mergedStyles.avatar,
                    turn === index && !p.isFolded && !winnerDeclared && mergedStyles.activePlayerAvatar,
                    turn === index && !p.isFolded && !winnerDeclared && { transform: [{ scale: pulseAnim }] }
                  ]}
                />
                <View>
                  <Text style={mergedStyles.playerName}>
                    {p.name} {p.isFolded ? '(Folded)' : `(${p.status})`}
                  </Text>
                  <Text style={mergedStyles.chips}>Chips: {p.chips} 🪙</Text>
                  {p.betAmount > 0 && <Text style={mergedStyles.betAmount}>Bet: {p.betAmount}</Text>}
                </View>
              </View>

              {p.message && (
                <View style={mergedStyles.chatBubble}>
                  <Text style={mergedStyles.chatText}>{p.message}</Text>
                </View>
              )}

              <View style={mergedStyles.cardsRow}>
                {p.cards.map((card, idx) => (
                  <View key={idx} style={[
                    mergedStyles.card,
                    p.id === players[turn].id && mergedStyles.currentPlayerCard,
                    !showCards[p.id] && mergedStyles.hiddenCard
                  ]}>
                    <Text style={[
                      mergedStyles.cardText,
                      (card.includes('♥') || card.includes('♦')) && { color: 'red' }
                    ]}>
                      {showCards[p.id] ? card : '🂠'}
                    </Text>

                    {!showCards[p.id] && p.id === 1 && (
                      <TouchableOpacity
                        style={mergedStyles.cardShowButton}
                        onPress={() => showCardsHandler(1)}
                      >
                        <Text style={mergedStyles.cardShowButtonText}>Show</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      })}

      {chipAnimations.map((chip) => (
        <Animated.View
          key={chip.id}
          style={{
            position: 'absolute',
            left: chip.x as unknown as number,
            top: chip.y as unknown as number,
            opacity: chip.opacity as unknown as number,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <Image
            source={require('../../../assets/images/chip.png')}
            style={{ width: 50, height: 50 }}
          />
          <Text style={mergedStyles.chipAmountText}>
            {chip.amount}
          </Text>
        </Animated.View>
      ))}

      {!isBotTurn() && !isPacked && (
        <View style={mergedStyles.controls}>
          <TouchableOpacity onPress={() => placeBet(10)} style={mergedStyles.button}>
            <Text style={mergedStyles.buttonText}>Chaal 10</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => placeBlindBet(5)} style={mergedStyles.button}>
            <Text style={mergedStyles.buttonText}>Blind 5</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={fold} style={mergedStyles.button}>
            <Text style={mergedStyles.buttonText}>Pack</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={show} style={[mergedStyles.button, mergedStyles.showButton]}>
            <Text style={mergedStyles.buttonText}>Show</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsPaused(!isPaused)}
            style={[mergedStyles.button, isPaused ? mergedStyles.playButton : mergedStyles.pauseButton]}
          >
            <Text style={mergedStyles.buttonText}>
              {isPaused ? '▶ Play' : '⏸ Pause'}
            </Text>
          </TouchableOpacity>
          <Text style={mergedStyles.timerText}>
            {isPaused ? 'Paused' : `Time left: ${timeLeft}s`}
          </Text>
        </View>
      )}

      {isChatOpen && (
        <View style={mergedStyles.chatInputContainer}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor="#ccc"
            value={chatMessage}
            onChangeText={setChatMessage}
            onSubmitEditing={handleSendMessage}
            style={mergedStyles.chatInput}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={handleSendMessage} style={mergedStyles.sendButton}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {winnerName && (
        <Animated.View style={[mergedStyles.winnerOverlay, { opacity: fadeAnim }]}>
          <Text style={mergedStyles.winnerText}>👑 {winnerName} Wins! 👑</Text>
          <Text style={mergedStyles.potWonText}>Won {pot} chips!</Text>
        </Animated.View>
      )}
    </View>
  );
}