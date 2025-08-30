import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';

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
import { styles } from '../styles/teenpatti';

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

interface CardAnimation {
    id: number;
    card: string;
    playerIndex: number;
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
  const jokerValues = ['A', 'K', '4', '7'];
  const cardRanks = cards.map(card => card.slice(0, -1));
  const cardSuits = cards.map(card => card.slice(-1));

  const jokers = cards.filter(card => jokerValues.includes(card.slice(0, -1)));
  const normalCards = cards.filter(card => !jokerValues.includes(card.slice(0, -1)));

  const jokerCount = jokers.length;
  const normalValues = normalCards.map(card => values.indexOf(card.slice(0, -1))).sort((a, b) => a - b);
  const normalSuits = normalCards.map(card => card.slice(-1));

  // Best hand if all 3 are jokers
  if (jokerCount === 3) return 6; // Trail of Aces (best possible hand)

  const isSameSuit = normalSuits.length === 0 || normalSuits.every(suit => suit === normalSuits[0]);

  // Try forming Trail
  if (normalValues.length === 1 || (normalValues.length === 2 && normalValues[0] === normalValues[1])) {
    return 6; // Trail with jokers
  }

  // Try forming Pure Sequence (Straight Flush)
  for (let i = 0; i <= 13 - (3 - jokerCount); i++) {
    const seq = [i, i + 1, i + 2];
    const matchCount = normalValues.filter(val => seq.includes(val)).length;
    if (matchCount + jokerCount === 3 && isSameSuit) {
      return 5;
    }
  }

  // Try Flush
  if (isSameSuit) return 4;

  // Try Sequence
  for (let i = 0; i <= 13 - (3 - jokerCount); i++) {
    const seq = [i, i + 1, i + 2];
    const matchCount = normalValues.filter(val => seq.includes(val)).length;
    if (matchCount + jokerCount === 3) {
      return 3;
    }
  }

  // Try Pair
  const counts: Record<number, number> = {};
  for (const val of normalValues) {
    counts[val] = (counts[val] || 0) + 1;
  }
  const hasPair = Object.values(counts).some(c => c >= 2);
  if (hasPair || jokerCount >= 1) {
    return 2;
  }

  // High Card
  return 1;
}

const initialPlayers = (): Player[] => [
    { id: 1, name: 'You', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=1', betAmount: 0, status: 'Blind' },
    { id: 2, name: 'Bot 1', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=2', betAmount: 0, status: 'Blind' },
    { id: 3, name: 'Bot 2', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=3', betAmount: 0, status: 'Blind' },
    { id: 4, name: 'Bot 3', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=4', betAmount: 0, status: 'Blind' },
    { id: 5, name: 'Bot 4', cards: [], chips: 1000, isFolded: false, avatar: 'https://i.pravatar.cc/100?img=5', betAmount: 0, status: 'Blind' },
];

export default function AK47Screen() {
    const navigation = useNavigation();
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [turn, setTurn] = useState(0);
    const [pot, setPot] = useState(0);
    const [round, setRound] = useState(1);
    const [isPacked, setIsPacked] = useState(false);
    const [showCards, setShowCards] = useState<Record<number, boolean>>({});
    const [winnerName, setWinnerName] = useState<string | null>(null);
    const [winnerDeclared, setWinnerDeclared] = useState(false);
    const [timeLeft, setTimeLeft] = useState(20); // Changed from 10 to 20
    const [isPaused, setIsPaused] = useState(false);
    const [chipAnimations, setChipAnimations] = useState<ChipAnimation[]>([]);
    const [nextChipId, setNextChipId] = useState(1);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [cardAnimations, setCardAnimations] = useState<CardAnimation[]>([]);
    const [nextCardId, setNextCardId] = useState(1);
    const [gameStarted, setGameStarted] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const soundRef = useRef<Audio.Sound | null>(null);
    const { width, height } = Dimensions.get('window');
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const router = useRouter();
    const componentMountTime = useRef(Date.now()).current;

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
        }).settingsButton,
        disabledButton: {
            opacity: 0.5,
        },
        gameStartingText: {
            color: 'white',
            fontSize: 16,
            marginTop: 10,
            textAlign: 'center',
        },
        timerWarning: {
            borderWidth: 2,
            borderColor: 'red',
            borderRadius: 8,
        }
    };

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

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setGameStarted(true);
                    dealCards();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            clearInterval(countdownInterval);
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
        if (isBotTurn() && !players[turn].isFolded && !isPaused && gameStarted) {
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
    }, [turn, isPaused, gameStarted]);

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

    const dealCards = () => {
        const deck = shuffle(getDeck());

        const resetPlayers = players.map(p => ({
            ...p,
            cards: [],
            isFolded: false,
            betAmount: 0,
            status: 'Blind'
        }));

        setPlayers(resetPlayers);
        setPot(0);
        setTurn(0);
        setIsPacked(false);
        setShowCards({});
        setIsPaused(false);
        setChipAnimations([]);
        setCardAnimations([]);
        setNextCardId(1);

        let cardCount = 0;
        const totalCards = players.length * 3;

        const interval = setInterval(() => {
            const playerIndex = cardCount % players.length;
            const card = deck[cardCount];

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
                setPlayers(prev =>
                    prev.map((p, i) =>
                        i === playerIndex ? { ...p, cards: [...p.cards, card] } : p
                    )
                );
                setCardAnimations(prev => prev.filter(c => c.id !== animationId));
            });

            cardCount++;
            if (cardCount >= totalCards) {
                clearInterval(interval);
            }
        }, 200);
    };

    const showCardsHandler = (playerId: number) => {
        if (!gameStarted) return;
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
        }, 1000);
    };

    const placeBet = (amount: number) => {
        if (!gameStarted) return;
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
        if (!gameStarted) return;
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
        if (!gameStarted) return;
        stopTimer();

        if (players[turn].id === 1) {
            // Show all players' cards when user folds
            const visibility: Record<number, boolean> = {};
            players.forEach(p => visibility[p.id] = true);
            setShowCards(visibility);
            setIsPacked(true);
        }

        setPlayers((prev) => prev.map((p, i) => (i === turn ? { ...p, isFolded: true } : p)));
        nextTurn();
    };

    const show = () => {
        if (!gameStarted) return;
        setIsPaused(true);
        stopTimer();
        const activePlayers = players.filter((p) => !p.isFolded);
        const scores = activePlayers.map((p) => ({ id: p.id, score: evaluateHand(p.cards) }));
        scores.sort((a, b) => b.score - a.score);
        const winner = players.find((p) => p.id === scores[0].id);
        if (winner) {
            // Show all players' cards when winner is declared
            const visibility: Record<number, boolean> = {};
            players.forEach((p) => (visibility[p.id] = true));
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
        if (activePlayers.length === 1 && !winnerDeclared && gameStarted) {
            const winner = activePlayers[0];
            // Show all players' cards when only one player remains
            const visibility: Record<number, boolean> = {};
            players.forEach(p => visibility[p.id] = true);
            setShowCards(visibility);
            setWinnerDeclared(true);
            animateWinner(winner.name);
            distributePot(winner.id);
        }
    }, [players, winnerDeclared, gameStarted]);

    useEffect(() => {
        if (players[turn].isFolded || isPaused || !gameStarted) return;
        setTimeLeft(20); // Changed from 10 to 20
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
    }, [turn, isPaused, gameStarted]);

    return (
        <View style={mergedStyles.container}>
            <StatusBar hidden />
            <Image source={require('../../assets/images/table-1.jpg')} style={mergedStyles.tableImage}
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
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={{ position: 'absolute', top: 40, left: 20, zIndex: 100 }}
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
                const [showWarning, setShowWarning] = useState(false);

                useEffect(() => {
                    if (turn === index && !p.isFolded && !winnerDeclared && gameStarted) {
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
                        
                        // Show warning when 5 seconds left
                        if (timeLeft <= 5) {
                            setShowWarning(true);
                        } else {
                            setShowWarning(false);
                        }
                    } else {
                        pulseAnim.setValue(1);
                        setShowWarning(false);
                    }
                }, [turn, p.isFolded, winnerDeclared, gameStarted, timeLeft]);

                return (
                    <View key={`player-${p.id}`} style={[mergedStyles.playerContainer, getPlayerPosition(index)]}>
                        <View style={[
                            mergedStyles.playerInfo,
                            showWarning && mergedStyles.timerWarning
                        ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Animated.Image
                                    source={{ uri: p.avatar }}
                                    style={[
                                        mergedStyles.avatar,
                                        turn === index && !p.isFolded && !winnerDeclared && mergedStyles.activePlayerAvatar,
                                        turn === index && !p.isFolded && !winnerDeclared && gameStarted && { transform: [{ scale: pulseAnim }] }
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
                                    <Animated.View
                                        key={`player-${p.id}-card-${idx}`}
                                        style={[
                                            mergedStyles.card,
                                            p.id === players[turn].id && mergedStyles.currentPlayerCard,
                                            !showCards[p.id] && mergedStyles.hiddenCard
                                        ]}
                                    >
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
                                                disabled={!gameStarted}
                                            >
                                                <Text style={mergedStyles.cardShowButtonText}>Show</Text>
                                            </TouchableOpacity>
                                        )}
                                    </Animated.View>
                                ))}
                            </View>
                        </View>
                    </View>
                );
            })}

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
                    <Text style={mergedStyles.chipAmountText}>
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

            {!isBotTurn() && !isPacked && (
                <View style={mergedStyles.controls}>
                    <TouchableOpacity
                        onPress={() => placeBet(10)}
                        style={[
                            mergedStyles.button,
                            !gameStarted && mergedStyles.disabledButton
                        ]}
                        disabled={!gameStarted}
                    >
                        <Text style={mergedStyles.buttonText}>Chaal 10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => placeBlindBet(5)}
                        style={[
                            mergedStyles.button,
                            !gameStarted && mergedStyles.disabledButton
                        ]}
                        disabled={!gameStarted}
                    >
                        <Text style={mergedStyles.buttonText}>Blind 5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={fold}
                        style={[
                            mergedStyles.button,
                            !gameStarted && mergedStyles.disabledButton
                        ]}
                        disabled={!gameStarted}
                    >
                        <Text style={mergedStyles.buttonText}>Pack</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={show}
                        style={[
                            mergedStyles.button,
                            mergedStyles.showButton,
                            !gameStarted && mergedStyles.disabledButton
                        ]}
                        disabled={!gameStarted}
                    >
                        <Text style={mergedStyles.buttonText}>Show</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setIsPaused(!isPaused)}
                        style={[
                            mergedStyles.button,
                            isPaused ? mergedStyles.playButton : mergedStyles.pauseButton,
                            !gameStarted && mergedStyles.disabledButton
                        ]}
                        disabled={!gameStarted}
                    >
                        <Text style={mergedStyles.buttonText}>
                            {isPaused ? '▶ Play' : '⏸ Pause'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={mergedStyles.timerText}>
                        {!gameStarted ? 'Game starting...' : isPaused ? 'Paused' : `Time left: ${timeLeft}s`}
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