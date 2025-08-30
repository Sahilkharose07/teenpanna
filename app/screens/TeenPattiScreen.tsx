import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';
import { io, Socket } from "socket.io-client";
import { styles } from '../styles/teenpatti';


interface Player {
  id: string;
  name: string;
  cards: string[];
  chips: number;
  isFolded: boolean;
  avatar: string;
  betAmount: number;
  message?: string;
  status: string;
  socketId: string;
  handDescription?: string;
  hasActed: boolean;
  isBot?: boolean;
  roomId?: string;
}

interface ChipAnimation {
  id: number;
  amount: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
}

interface CardAnimation {
  id: number;
  card: string;
  playerIndex: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
}

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

const initialPlayers = (): Player[] => [
  {
    id: '1',
    name: 'You',
    cards: [],
    chips: 1000,
    isFolded: false,
    avatar: '',
    betAmount: 0,
    status: 'Waiting',
    socketId: '',
    hasActed: false
  }
];

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-server-domain.com'
  : 'http://192.168.1.5:3000';

export default function TeenPattiScreen() {
  const navigation = useNavigation();
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [turn, setTurn] = useState(0);
  const [pot, setPot] = useState(0);
  const [round, setRound] = useState(1);
  const [isPacked, setIsPacked] = useState(false);
  const [showCards, setShowCards] = useState<Record<string, boolean>>({});
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [winnerDeclared, setWinnerDeclared] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('Player');
  const [roomCode, setRoomCode] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [inRoom, setInRoom] = useState(false);
  const [error, setError] = useState('');
  const [showRoomModal, setShowRoomModal] = useState(true);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ name: string, amount: number, hand?: string } | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'waiting' | 'betting' | 'dealing' | 'showdown' | 'finished'>('waiting');
  const [currentBet, setCurrentBet] = useState(0);
  const [minBet, setMinBet] = useState(5);
  const [bettingRound, setBettingRound] = useState(0);
  const [isBetting, setIsBetting] = useState(false);
  const [gameStartCountdown, setGameStartCountdown] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const { width, height } = Dimensions.get('window');
  const componentMountTime = useRef(Date.now()).current;
  const socketRef = useRef<Socket | null>(null);

  const pulseAnims = useRef<Animated.Value[]>(players.map(() => new Animated.Value(1))).current;
  const [showWarnings, setShowWarnings] = useState<boolean[]>(players.map(() => false));
  const [chipAnimations, setChipAnimations] = useState<ChipAnimation[]>([]);
  const [nextChipId, setNextChipId] = useState(1);
  const [cardAnimations, setCardAnimations] = useState<CardAnimation[]>([]);
  const [nextCardId, setNextCardId] = useState(1);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    socketRef.current = socket;

    const disconnectSocket = () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.log("Connection error:", error);
      setError("Failed to connect to server");
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Reconnection attempt:", attemptNumber);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected after", attemptNumber, "attempts");
      setError("");
    });

    socket.on("heartbeat", () => {
      socket.emit("heartbeat_ack");
    });

    socket.on("roomCreated", (data: { roomId: string; players: Player[] }) => {
      console.log("Room created:", data.roomId);
      setRoomId(data.roomId);
      setPlayers(data.players);
      setInRoom(true);
      setIsHost(true);
      setShowRoomModal(false);
    });

    socket.on("roomJoined", (data: { roomId: string; players: Player[] }) => {
      console.log("Room joined:", data.roomId);
      setRoomId(data.roomId);
      setPlayers(data.players);
      setInRoom(true);
      setShowRoomModal(false);
    });

    socket.on("playerJoined", (data: { players: Player[] }) => {
      console.log("Player joined, updating player list");
      setPlayers(data.players);
    });

    socket.on("gameStarted", (gameState: {
      players: Player[];
      pot: number;
      turnIndex: number;
      currentPlayer: string;
      gameState: any
    }) => {
      console.log("Game started");
      setGameStartCountdown(0); // Reset countdown
      setGameStarted(true);
      setPlayers(gameState.players);
      setPot(gameState.pot);
      setTurn(gameState.turnIndex);
      setCurrentPlayerId(gameState.currentPlayer);
      setGameStatus(gameState.gameState.gameStatus);
      setCurrentBet(gameState.gameState.currentBet);
      setMinBet(gameState.gameState.minBet);
      setBettingRound(gameState.gameState.bettingRound);
      dealCardsAnimation(gameState.players);
    });

    socket.on("gameStateUpdate", (gameState: {
      players: Player[];
      pot: number;
      turnIndex: number;
      gameState: {
        currentBet: number;
        minBet: number;
        bettingRound: number;
        gameStatus: string;
      }
    }) => {
      setPlayers(gameState.players);
      setPot(gameState.pot);
      setTurn(gameState.turnIndex);
      setCurrentBet(gameState.gameState.currentBet);
      setMinBet(gameState.gameState.minBet);
      setBettingRound(gameState.gameState.bettingRound);
      setGameStatus(gameState.gameState.gameStatus as any);
    });

    socket.on("turnUpdate", (data: {
      currentPlayer: string;
      playerName: string;
      turnIndex: number
    }) => {
      setCurrentPlayerId(data.currentPlayer);
      setCurrentPlayerName(data.playerName);
      setTurn(data.turnIndex);
      setTimeLeft(20);

      setPlayers(prev => prev.map(player => ({
        ...player,
        hasActed: player.socketId === data.currentPlayer ? false : player.hasActed
      })));
    });

    socket.on("betPlaced", (data: {
      playerId: string;
      playerName: string;
      amount: number;
      pot: number;
      players: Player[]
    }) => {
      setPlayers(data.players);
      setPot(data.pot);
      animateChipToPot(players.findIndex(p => p.socketId === data.playerId), data.amount);
    });

    socket.on("playerChecked", (data: {
      playerId: string;
      playerName: string;
      players: Player[]
    }) => {
      setPlayers(data.players);
    });

    socket.on("playerFolded", (data: {
      playerId: string;
      playerName: string;
      players: Player[]
    }) => {
      setPlayers(data.players);
    });

    socket.on("playerLeft", (data: { players: Player[] }) => {
      setPlayers(data.players);
      Alert.alert("Player Left", "A player has left the game");
    });

    socket.on("error", (error: { message: string }) => {
      console.log("Socket error:", error.message);
      setError(error.message);
      Alert.alert("Error", error.message);
    });

    socket.on("winnerDeclared", ({ winnerId, winnerName, potAmount, handDescription }: {
      winnerId: string;
      winnerName: string;
      potAmount: number;
      handDescription: string;
    }) => {
      setWinnerName(winnerName);
      setWinnerInfo({ name: winnerName, amount: potAmount, hand: handDescription });
      setShowWinnerModal(true);
      setWinnerDeclared(true);
      animateWinner(winnerName);

      setTimeout(() => {
        setShowWinnerModal(false);
      }, 3000);
    });

    socket.on("tieGame", (data: { winners: { id: string, name: string }[], potAmount: number, handDescription: string }) => {
      const winnerNames = data.winners.map(w => w.name).join(' and ');
      setWinnerName(winnerNames);
      setWinnerInfo({ name: winnerNames, amount: data.potAmount, hand: data.handDescription });
      setShowWinnerModal(true);
      setWinnerDeclared(true);

      setTimeout(() => {
        setShowWinnerModal(false);
      }, 3000);
    });

    socket.on("roundEnded", (data: { players: Player[], nextRound: number }) => {
      setPlayers(data.players);
      setRound(data.nextRound);
      setWinnerDeclared(false);
      setIsPacked(false);
      setShowCards({});
      setPot(0);
      setGameStarted(false);

      if (isHost) {
        setGameStarted(false);
      }
    });

    socket.on("showdown", (data: { playerId: string, playerName: string, handDescription: string, players: Player[] }) => {
      setPlayers(data.players);
      const visibility: Record<string, boolean> = {};
      data.players.forEach(p => visibility[p.id] = true);
      setShowCards(visibility);
    });

    socket.on("chatMessage", (message: ChatMessage) => {
      
      setChatMessages(prev => [...prev, message].slice(-50)); 

      setPlayers(prev => prev.map(p =>
        p.socketId === message.playerId
          ? { ...p, message: message.message }
          : p
      ));

      setTimeout(() => {
        setPlayers(prev => prev.map(p =>
          p.socketId === message.playerId
            ? { ...p, message: '' }
            : p
        ));
      }, 3000);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch (err) {
        console.log('Orientation lock error:', err);
      }
    };

    lockOrientation();

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  useEffect(() => {
    if (pulseAnims.length !== players.length) {
      while (pulseAnims.length < players.length) {
        pulseAnims.push(new Animated.Value(1));
      }
      while (pulseAnims.length > players.length) {
        pulseAnims.pop();
      }
      setShowWarnings(players.map((_, i) => showWarnings[i] || false));
    }
  }, [players]);

  useEffect(() => {
    if (gameStartCountdown > 0) {
      const timer = setTimeout(() => {
        setGameStartCountdown(gameStartCountdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (gameStartCountdown === 0 && !gameStarted) {
      // Countdown finished, start the game if host
      if (isHost && socketRef.current) {
        socketRef.current.emit('startGame', roomId);
      }
    }
  }, [gameStartCountdown, gameStarted, isHost, roomId]);

  useEffect(() => {
    if (currentPlayerId !== socketRef.current?.id || isPaused || !gameStarted) return;

    setTimeLeft(20);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === 1) {
          clearInterval(timerRef.current!);
          if (isMyTurn()) fold();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentPlayerId, isPaused, gameStarted]);

  useEffect(() => {
    players.forEach((p, index) => {
      const isCurrentPlayer = p.socketId === currentPlayerId;

      if (isCurrentPlayer && !p.isFolded && !winnerDeclared && gameStarted) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnims[index], {
              toValue: 1.1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnims[index], {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();

        const newWarnings = [...showWarnings];
        newWarnings[index] = timeLeft <= 5;
        setShowWarnings(newWarnings);
      } else {
        pulseAnims[index].setValue(1);
        const newWarnings = [...showWarnings];
        newWarnings[index] = false;
        setShowWarnings(newWarnings);
      }
    });
  }, [currentPlayerId, players, winnerDeclared, gameStarted, timeLeft]);

  useEffect(() => {
    const loadSoundPreference = async () => {
      try {
        const soundPref = await AsyncStorage.getItem('soundEnabled');
        if (soundPref !== null) {
          setIsSoundEnabled(soundPref === 'true');
        }
      } catch (error) {
        console.log('Error loading sound preference:', error);
      }
    };

    loadSoundPreference();
  }, []);

  const handleSoundToggle = async (value: boolean) => {
    setIsSoundEnabled(value);
    await AsyncStorage.setItem('soundEnabled', value.toString());

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

  const renderMenuModal = () => (
    <Modal
      visible={isMenuVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsMenuVisible(false)}
    >
      <View style={styles.menuOverlay}>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsMenuVisible(false)}
          >
            <Ionicons name="close" size={28} color="#FFD700" />
          </TouchableOpacity>

          <View style={styles.menuOptionsRow}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setIsMenuVisible(false);
                router.push('/screens/drawable/dashboard');
              }}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="home" size={32} color="#FFD700" />
              </View>
              <Text style={styles.menuOptionText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={async () => {
                const newSoundState = !isSoundEnabled;
                await handleSoundToggle(newSoundState);
              }}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={isSoundEnabled ? "volume-high" : "volume-mute"}
                  size={24}
                  color="#FFD700"
                />
              </View>
              <Text style={styles.menuOptionText}>
                {isSoundEnabled ? "Sound On" : "Sound Off"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="settings" size={32} color="#FFD700" />
              </View>
              <Text style={styles.menuOptionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const playChipSound = async () => {
    if (!isSoundEnabled) return;

    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sound/cash.mp3'),
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

  const isMyTurn = () => {
    return currentPlayerId === socketRef.current?.id;
  };

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

  const getCardSymbol = (cardString: string) => {
    if (!cardString) return '🂠';

    const suit = cardString.slice(-1);
    const value = cardString.slice(0, -1);

    const suitSymbols: Record<string, string> = {
      'H': '♥', // Hearts
      'D': '♦', // Diamonds
      'C': '♣', // Clubs
      'S': '♠'  // Spades
    };

    return `${value}${suitSymbols[suit] || suit}`;
  };

  const animateChipToPot = (playerIndex: number, amount: number) => {
    if (!gameStarted) return;
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

  const dealCardsAnimation = (players: Player[]) => {
    let cardCount = 0;
    const totalCards = players.length * 3;

    const interval = setInterval(() => {
      const playerIndex = cardCount % players.length;
      const card = players[playerIndex].cards[Math.floor(cardCount / players.length)];

      const animationId = Date.now() + cardCount;

      const centerX = width / 2 - 20;
      const centerY = height / 2 - 30;

      const pos = getPlayerPosition(playerIndex);
      const targetX = typeof pos.left === 'number' ? pos.left + 40 : width - 100;
      const targetY = typeof pos.top === 'number'
        ? pos.top + 50
        : height - (pos.bottom as number) - 40;

      const newCard: CardAnimation = {
        id: animationId,
        card,
        playerIndex,
        x: new Animated.Value(centerX),
        y: new Animated.Value(centerY),
        opacity: new Animated.Value(1),
      };

      setCardAnimations(prev => [...prev, newCard]);

      Animated.parallel([
        Animated.timing(newCard.x, {
          toValue: targetX,
          duration: 500,
          useNativeDriver: false,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(newCard.y, {
          toValue: targetY,
          duration: 500,
          useNativeDriver: false,
          easing: Easing.out(Easing.quad),
        }),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(newCard.opacity, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => {
        setCardAnimations(prev => prev.filter(c => c.id !== animationId));
      });

      cardCount++;
      if (cardCount >= totalCards) {
        clearInterval(interval);
      }
    }, 200);
  };

  const showCardsHandler = (playerId: string) => {
    if (!gameStarted) return;
    setShowCards(prev => ({ ...prev, [playerId]: true }));
  };

  const nextRound = () => {
    setTimeout(() => {
      socketRef.current?.emit('nextRound', roomId);
      setRound((r) => r + 1);
      setWinnerDeclared(false);
    }, 1000);
  };

  const placeBet = async (amount: number) => {
    // Prevent double clicking
    if (isBetting || !gameStarted || !socketRef.current || !isMyTurn()) return;

    const currentPlayer = players.find(p => p.socketId === socketRef.current?.id);
    if (!currentPlayer) return;

    if (amount < minBet && amount !== currentPlayer.chips) {
      Alert.alert(`Minimum bet is ${minBet}`);
      return;
    }

    if (currentPlayer.chips < amount) {
      Alert.alert('Not enough chips');
      return;
    }

    // Set betting state to prevent double clicks
    setIsBetting(true);

    stopTimer();
    animateChipToPot(turn, amount);

    socketRef.current.emit('placeBet', {
      roomId,
      amount,
      playerId: currentPlayer.id
    });

    // Re-enable betting after a short delay
    setTimeout(() => {
      setIsBetting(false);
    }, 500);
  };

  const placeBlindBet = (amount: number) => {
    if (!gameStarted) return;
    placeBet(amount);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const check = () => {
    if (!gameStarted || !socketRef.current || !isMyTurn()) return;

    stopTimer();
    socketRef.current.emit('check', {
      roomId,
      playerId: players[turn].id
    });
  };

  const fold = () => {
    if (!gameStarted || !socketRef.current || !isMyTurn()) return;

    const currentPlayer = players.find(p => p.socketId === socketRef.current?.id);
    if (!currentPlayer) return;

    stopTimer();

    // Update local state for immediate feedback
    setPlayers(prev => prev.map(p =>
      p.socketId === socketRef.current?.id
        ? { ...p, isFolded: true, status: 'Folded' }
        : p
    ));

    socketRef.current.emit('fold', {
      roomId,
      playerId: currentPlayer.id // Use the player's ID
    });
  };

  const show = () => {
    if (!gameStarted || !socketRef.current || !isMyTurn()) return;

    const currentPlayer = players.find(p => p.socketId === socketRef.current?.id);
    if (!currentPlayer) return;

    setIsPaused(true);
    stopTimer();

    socketRef.current.emit('show', {
      roomId,
      playerId: currentPlayer.id
    });
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
        });
      }, 3000);
    });
  };

  const distributePot = (winnerId: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === winnerId ? { ...p, chips: p.chips + pot } : p)));
    setPot(0);
  };

  const sendMessage = (playerId: string, message: string) => {
    setPlayers(prev =>
      prev.map(p =>
        p.id === playerId ? { ...p, message } : p
      )
    );

    setTimeout(() => {
      setPlayers(prev =>
        prev.map(p =>
          p.id === playerId ? { ...p, message: '' } : p
        )
      );
    }, 3000);
  };

  const handleSendMessage = () => {
    if (chatMessage.trim() && socketRef.current?.id && roomId) {
      socketRef.current.emit('chatMessage', {
        roomId,
        message: chatMessage.trim()
      });
      setChatMessage('');
      Keyboard.dismiss();
    }
  };

  const createRoom = () => {
    if (!socketRef.current || !playerName.trim()) {
      setError("Please enter a player name");
      return;
    }

    console.log("Creating room with player:", playerName);
    socketRef.current.emit('createRoom', { playerName });
  };

  const joinRoom = () => {
    if (!socketRef.current || !playerName.trim() || !roomCode.trim()) {
      setError("Please enter both player name and room code");
      return;
    }

    console.log("Joining room:", roomCode, "as", playerName);
    socketRef.current.emit('joinRoom', {
      roomId: roomCode,
      playerName
    });
  };

  const startGame = () => {
    if (!socketRef.current || !roomId) return;
    setGameStartCountdown(3); // Start 3-second countdown
  };

  const renderPlayer = (p: Player, index: number) => {
    const isCurrentPlayer = p.socketId === currentPlayerId;
    const pulseAnim = pulseAnims[index];
    const showWarning = showWarnings[index];

    return (
      <View key={`player-${p.id}`} style={[styles.playerContainer, getPlayerPosition(index)]}>
        <View style={[
          styles.playerInfo,
          showWarning && styles.timerWarning,
          isCurrentPlayer && styles.currentPlayerHighlight
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Animated.Image
              source={{ uri: p.avatar }}
              style={[
                styles.avatar,
                isCurrentPlayer && !p.isFolded && !winnerDeclared && styles.activePlayerAvatar,
                isCurrentPlayer && !p.isFolded && !winnerDeclared && gameStarted && { transform: [{ scale: pulseAnim }] }
              ]}
            />
            <View>
              <Text style={styles.playerName}>
                {p.name} {p.isFolded ? '(Folded)' : `(${p.status})`}
              </Text>
              <Text style={styles.chips}>Chips: {p.chips} 🪙</Text>
              {p.betAmount > 0 && <Text style={styles.betAmount}>Bet: {p.betAmount}</Text>}
            </View>
          </View>

          {p.message && (
            <View style={styles.chatBubble}>
              <Text style={styles.chatText}>{p.message}</Text>
            </View>
          )}

          <View style={styles.cardsRow}>
            {p.cards && p.cards.map((card, idx) => {
              const cardText = card && typeof card === 'string' ? card : '🂠';
              const isRedCard = cardText && (cardText.includes('♥') || cardText.includes('♦'));
              const formattedCard = getCardSymbol(cardText);

              return (
                <Animated.View
                  key={`player-${p.id}-card-${idx}`}
                  style={[
                    styles.card,
                    isCurrentPlayer && styles.currentPlayerCard,
                    !showCards[p.id] && styles.hiddenCard
                  ]}
                >
                  <Text style={[
                    styles.cardText,
                    isRedCard && { color: 'red' }
                  ]}>
                    {showCards[p.id] ? formattedCard : '🂠'}
                  </Text>

                  {!showCards[p.id] && p.socketId === socketRef.current?.id && (
                    <TouchableOpacity
                      style={styles.cardShowButton}
                      onPress={() => showCardsHandler(p.id)}
                      disabled={!gameStarted}
                    >
                      <Text style={styles.cardShowButtonText}>Show</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              );
            })}
          </View>

          {showCards[p.id] && p.handDescription && (
            <Text style={styles.handDescription}>{p.handDescription}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderWinnerModal = () => (
    <Modal
      visible={showWinnerModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowWinnerModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.winnerModalContent}>
          <Text style={styles.winnerTitle}>🎉 Winner! 🎉</Text>
          <Text style={styles.winnerName}>{winnerInfo?.name}</Text>
          <Text style={styles.winnerAmount}>Won {winnerInfo?.amount} chips!</Text>
          {winnerInfo?.hand && (
            <Text style={styles.winnerHand}>with {winnerInfo.hand}</Text>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        source={require('../../assets/images/table-1.jpg')}
        style={styles.tableImage}
        contentFit="cover"
      />

      <Modal
        visible={showRoomModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>

            <TextInput
              placeholder="Your Name"
              placeholderTextColor="#999"
              value={playerName}
              onChangeText={setPlayerName}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.roomButton}
              onPress={createRoom}
            >
              <Text style={styles.buttonText}>Create Room</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>- OR -</Text>

            <TextInput
              placeholder="Room ID"
              placeholderTextColor="#999"
              value={roomCode}
              onChangeText={setRoomCode}
              style={styles.input}
            />

            <TouchableOpacity
              style={styles.roomButton}
              onPress={joinRoom}
            >
              <Text style={styles.buttonText}>Join Room</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </View>
      </Modal>

      {renderWinnerModal()}

      {roomId && players.length < 2 && (
        <View style={styles.waitingRoom}>
          <Text style={styles.waitingText}>Room ID: {roomId}</Text>
          <Text style={styles.waitingText}>Waiting for players...</Text>
          <Text style={styles.waitingText}>Players: {players.length}/5</Text>
        </View>
      )}

      {players.length >= 2 && !gameStarted && isHost && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={startGame}
        >
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      )}

      {gameStartCountdown > 0 && (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownText}>Game starting in {gameStartCountdown}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.chatIconButton}
        onPress={() => setIsChatOpen(!isChatOpen)}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="white" />
        {chatMessages.length > 0 && (
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>
              {chatMessages.length}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={[styles.potContainer, { top: height / 2 - 30, left: width / 2 - 50 }]}>
        <Text style={styles.potText}>Pot: {pot} 🪙</Text>
        <Text style={styles.roundText}>Round: {round}</Text>
      </View>

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => setIsMenuVisible(true)}
          style={{ position: 'absolute', top: 40, left: 20, zIndex: 100 }}
        >
          <Ionicons name="menu" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {players.map((p, index) => renderPlayer(p, index))}

      {chipAnimations.map((chip) => (
        <Animated.View
          key={`chip-${chip.id}`}
          style={{
            position: 'absolute',
            left: chip.x,
            top: chip.y,
            opacity: chip.opacity,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <Image
            source={require('../../assets/images/chip.png')}
            style={{ width: 50, height: 50 }}
          />
          <Text style={styles.chipAmountText}>
            {chip.amount}
          </Text>
        </Animated.View>
      ))}

      {cardAnimations.map((card) => (
        <Animated.View
          key={`card-anim-${card.id}`}
          style={{
            position: 'absolute',
            left: card.x,
            top: card.y,
            opacity: card.opacity,
            width: 40,
            height: 60,
            backgroundColor: '#fff',
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#333',
            zIndex: 200,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            transform: [{ rotate: `${Math.random() * 10 - 5}deg` }],
          }}
        >
          <Text style={{ fontSize: 22 }}>🂠</Text>
        </Animated.View>
      ))}

      {isMyTurn() && !isPacked && (
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => placeBet(10)}
            style={[
              styles.button,
              (!gameStarted || isBetting) && styles.disabledButton
            ]}
            disabled={!gameStarted || isBetting}
          >
            <Text style={styles.buttonText}>
              {isBetting ? '...' : 'Chaal 10'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => placeBet(20)}
            style={[
              styles.button,
              (!gameStarted || isBetting) && styles.disabledButton
            ]}
            disabled={!gameStarted || isBetting}
          >
            <Text style={styles.buttonText}>
              {isBetting ? '...' : 'Chaal 20'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={check}
            style={[
              styles.button,
              styles.checkButton,
              !gameStarted && styles.disabledButton
            ]}
            disabled={!gameStarted}
          >
            <Text style={styles.buttonText}>Check</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={fold}
            style={[
              styles.button,
              !gameStarted && styles.disabledButton
            ]}
            disabled={!gameStarted}
          >
            <Text style={styles.buttonText}>Pack</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={show}
            style={[
              styles.button,
              styles.showButton,
              !gameStarted && styles.disabledButton
            ]}
            disabled={!gameStarted}
          >
            <Text style={styles.buttonText}>Show</Text>
          </TouchableOpacity>

          <Text style={styles.timerText}>
            {!gameStarted ? 'Game starting...' : isPaused ? 'Paused' : `Time left: ${timeLeft}s`}
          </Text>

          <Text style={styles.turnIndicator}>
            {isMyTurn() ? 'Your turn!' : `${currentPlayerName}'s turn`}
          </Text>
        </View>
      )}

      {isChatOpen && (
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat</Text>
            <TouchableOpacity onPress={() => setIsChatOpen(false)}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatMessages}>
            {chatMessages.map((msg, index) => (
              <View key={index} style={[
                styles.chatMessage,
                msg.playerId === socketRef.current?.id ? styles.myMessage : styles.otherMessage
              ]}>
                <Text style={styles.messageSender}>
                  {msg.playerId === socketRef.current?.id ? 'You' : msg.playerName}:
                </Text>
                <Text style={styles.messageText}>{msg.message}</Text>
                <Text style={styles.messageTime}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor="#ccc"
              value={chatMessage}
              onChangeText={setChatMessage}
              onSubmitEditing={handleSendMessage}
              style={styles.chatInput}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {winnerName && (
        <Animated.View style={[styles.winnerOverlay, { opacity: fadeAnim }]}>
          <Text style={styles.winnerText}>👑 {winnerName} Wins! 👑</Text>
          <Text style={styles.potWonText}>Won {pot} chips!</Text>
        </Animated.View>
      )}

      {renderMenuModal()}
    </View>
  );
}