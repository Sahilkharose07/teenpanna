import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { Image } from 'expo-image';
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { styles } from '../styles/anderbahar';

const suits = ['♥', '♦', '♣', '♠'] as const;
type Suit = typeof suits[number];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const { width, height } = Dimensions.get('window');
const cardWidth = 60;
const cardHeight = 90;  

interface Card {
  value: string;
  suit: Suit;
}
type GameStatus = 'waiting' | 'betting' | 'dealing' | 'match-found' | 'result';

interface Player {
  id: string;
  name: string;
  balance: number;
  betSide: 'andar' | 'bahar' | null;
  betAmount: number;
  isCurrentTurn: boolean;
}

export default function AndarBaharScreen() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [middleCard, setMiddleCard] = useState<Card | null>(null);
  const [andarCards, setAndarCards] = useState<Card[]>([]);
  const [baharCards, setBaharCards] = useState<Card[]>([]);
  const [selectedSide, setSelectedSide] = useState<'andar' | 'bahar' | null>(null);
  const [betAmount, setBetAmount] = useState(100);
  const [playerBalance, setPlayerBalance] = useState(1000);
  const [gameStatus, setGameStatus] = useState<GameStatus>('waiting');
  const [winner, setWinner] = useState<'andar' | 'bahar' | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [matchedCard, setMatchedCard] = useState<{ card: Card, side: 'andar' | 'bahar' } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [playersList, setPlayersList] = useState<Player[]>([]);
  const [currentTurnSocketId, setCurrentTurnSocketId] = useState<string | null>(null);
  const andarCardAnimations = useRef<Animated.Value[]>([]).current;
  const baharCardAnimations = useRef<Animated.Value[]>([]).current;

  const [transactionHistory, setTransactionHistory] = useState<Array<{
    type: 'win' | 'loss' | 'bet',
    amount: number,
    side?: 'andar' | 'bahar',
    timestamp: Date
  }>>([]);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');
  const [playerName, setPlayerName] = useState('Player');
  const [showRoomInput, setShowRoomInput] = useState(true);

  const soundRef = useRef<Audio.Sound | null>(null);
  const cardAnim = useRef(new Animated.Value(0)).current;
  const matchAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;

  const initializeDeck = (): Card[] => {
    const newDeck: Card[] = [];
    suits.forEach(suit => {
      values.forEach(value => {
        newDeck.push({ suit, value });
      });
    });
    return shuffleDeck(newDeck);
  };

  const shuffleDeck = (deck: Card[]): Card[] => {
    return [...deck].sort(() => Math.random() - 0.5);
  };

  const generateRandomRoomId = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const playSound = async (soundFile: any) => {
    if (!isSoundEnabled) return;
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const { sound } = await Audio.Sound.createAsync(soundFile);
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Sound error:', error);
    }
  };

  const startNewRound = () => {
    const freshDeck = initializeDeck();
    const middle = freshDeck.pop()!;
    setDeck(freshDeck);
    setMiddleCard(middle);
    setAndarCards([]);
    setBaharCards([]);
    setSelectedSide(null);
    setWinner(null);
    setMatchedCard(null);
    setGameStatus('betting');
    matchAnim.setValue(0);
    resultAnim.setValue(0);
  };

  const handleJoinRoom = () => {
    if (!inputRoomId || !playerName) return;

    setIsJoiningRoom(true);
    setRoomId(inputRoomId);

    const newSocket = io('http://192.168.1.2:3000');
    setSocket(newSocket);

    newSocket.emit('join_room', {
      playerId: newSocket.id,
      name: playerName,
      roomId: inputRoomId
    }, (response: any) => {
      setIsJoiningRoom(false);
      if (response.success) {
        setShowRoomInput(false);
        setMiddleCard(response.gameState.middleCard);
        setAndarCards(response.gameState.andarCards);
        setBaharCards(response.gameState.baharCards);
        setGameStatus(response.gameState.gameStatus);
        setWinner(response.gameState.winner);
        setMatchedCard(response.gameState.matchedCard);
        setPlayerBalance(1000);
        setPlayersList(response.players);
        setCurrentTurnSocketId(response.currentTurn);
      } else {
        alert(response.message || 'Failed to join room');
      }
    });

    newSocket.on('game_state', (state: any) => {
      setMiddleCard(state.middleCard);
      setAndarCards(state.andarCards);
      setBaharCards(state.baharCards);
      setGameStatus(state.gameStatus);
      setWinner(state.winner);
      setMatchedCard(state.matchedCard);

      // Reset selected side when new betting round starts
      if (state.gameStatus === 'betting') {
        setSelectedSide(null);
      }
    });

    newSocket.on('player_update', (players: Player[]) => {
      setPlayersList(players);
      const me = players.find(p => p.id === newSocket.id);
      if (me) {
        setPlayerBalance(me.balance);
        // Only update bet if we're in betting phase
        if (gameStatus === 'betting') {
          setSelectedSide(me.betSide);
          setBetAmount(me.betAmount);
        }
      }
    });

    newSocket.on('turn_update', ({ currentPlayer }) => {
      setCurrentTurnSocketId(currentPlayer);
    });

    newSocket.on('player_joined', (newPlayer) => {
      setPlayersList(prev => [...prev, newPlayer]);
    });

    newSocket.on('game_result', ({ winner, winningPlayers }) => {
      if (winner && selectedSide === winner) {
        const payout = Math.floor(betAmount * 1.9);
        setPlayerBalance(prev => prev + payout);
        setTransactionHistory(prev => [...prev, {
          type: 'win',
          amount: payout,
          side: winner,
          timestamp: new Date()
        }]);
      }
    });
  };

  const handleCreateRoom = () => {
    const newRoomId = generateRandomRoomId();
    setInputRoomId(newRoomId);
  };

  const placeBet = (side: 'andar' | 'bahar', amount: number) => {
    if (!socket || gameStatus !== 'betting') return;

    if (selectedSide !== null) {
      alert('You already placed a bet this round!');
      return;
    }

    socket.emit('place_bet', { side, amount }, (response: any) => {
      if (response.success) {
        playSound(require('../../assets/sound/cash.mp3'));
        setSelectedSide(side);
        setBetAmount(amount);
        setPlayerBalance(response.balance);

        setTransactionHistory(prev => [
          ...prev,
          {
            type: 'bet',
            amount,
            side,
            timestamp: new Date(),
          },
        ]);
      } else {
        alert(response.message);
      }
    });
  };

  const PlayerList = () => (
    <View style={styles.playersContainer}>
      {playersList.map((player, index) => (
        <View
          key={`${player.id}-${index}`}
          style={[
            styles.playerCard,
            player.isCurrentTurn && styles.currentPlayerCard
          ]}
        >
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerBalance}>₹{player.balance}</Text>
          {player.betSide && (
            <View style={[
              styles.playerBet,
              player.betSide === 'andar' ? styles.andarBet : styles.baharBet
            ]}>
              <Text style={styles.playerBetText}>₹{player.betAmount}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
  useEffect(() => {
    animateCards(andarCards.length, 'andar');
  }, [andarCards]);

  useEffect(() => {
    animateCards(baharCards.length, 'bahar');
  }, [baharCards]);

  const animateCards = (count: number, side: 'andar' | 'bahar') => {
    const animations: Animated.CompositeAnimation[] = [];

    const targetArray = side === 'andar' ? andarCardAnimations : baharCardAnimations;

    // Ensure Animated.Values exist for each card
    for (let i = targetArray.length; i < count; i++) {
      targetArray.push(new Animated.Value(0));
    }

    for (let i = 0; i < count; i++) {
      animations.push(
        Animated.timing(targetArray[i], {
          toValue: 1,
          duration: 300,
          delay: i * 150, // delay each card slightly
          useNativeDriver: true,
        })
      );
    }

    Animated.stagger(100, animations).start();
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
    AsyncStorage.getItem('soundEnabled').then(pref => {
      setIsSoundEnabled(pref !== 'false');
    });

    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
      ScreenOrientation.unlockAsync();
      if (socket) socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!showRoomInput) {
      startNewRound();
    }
  }, [showRoomInput]);

  useEffect(() => {
    if (gameStatus === 'betting' && !selectedSide) {
      playSound(require('../../assets/sound/newround.wav'));
    }
  }, [gameStatus, selectedSide]);

  return (
    <View style={styles.container}>
      {showRoomInput ? (
        <View style={styles.roomSelectionContainer}>
          <Text style={styles.roomSelectionTitle}>Join Andar Bahar Room</Text>

          <TextInput
            style={styles.roomInput}
            placeholder="Enter Your Name"
            value={playerName}
            onChangeText={setPlayerName}
          />

          <View style={styles.roomIdContainer}>
            <TextInput
              style={styles.roomInput}
              placeholder="Enter Room ID"
              value={inputRoomId}
              onChangeText={setInputRoomId}
            />
            <TouchableOpacity
              style={styles.randomRoomButton}
              onPress={() => setInputRoomId(generateRandomRoomId())}
            >
              <Text style={styles.randomRoomButtonText}>Random</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roomButtonContainer}>
            <TouchableOpacity
              style={[styles.roomButton, styles.joinRoomButton]}
              onPress={handleJoinRoom}
              disabled={isJoiningRoom || !inputRoomId || !playerName}
            >
              <Text style={styles.roomButtonText}>
                {isJoiningRoom ? 'Joining...' : 'Join Room'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roomButton, styles.createRoomButton]}
              onPress={handleCreateRoom}
              disabled={isJoiningRoom}
            >
              <Text style={styles.roomButtonText}>Create New Room</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Image source={require('../../assets/images/poker table.jpg')} style={styles.tableBackground} resizeMode="cover" />

          <PlayerList />

          <View style={styles.middleCardArea}>
            <Text style={styles.middleCardLabel}>JOKER CARD</Text>
            {middleCard && (
              <View style={[styles.card, styles.middleCard]}>
                <Text style={[
                  styles.cardText,
                  middleCard.suit === '♥' || middleCard.suit === '♦' ? styles.redCard : styles.blackCard
                ]}>
                  {middleCard.value}{middleCard.suit}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.gameArea}>
            <View style={[styles.sideBox, styles.andarBox]}>
              <Text style={[styles.sideTitle, styles.andarTitle]}>ANDAR</Text>
              <View style={styles.cardContainer}>
                {andarCards.map((card, index) => renderCard(card, index, 'andar'))}
              </View>
            </View>

            <View style={styles.dividerLine} />

            <View style={[styles.sideBox, styles.baharBox]}>
              <Text style={[styles.sideTitle, styles.baharTitle]}>BAHAR</Text>
              <View style={styles.cardContainer}>
                {baharCards.map((card, index) => renderCard(card, index, 'bahar'))}
              </View>
            </View>
          </View>

          <View style={styles.gameInfo}>
            <Text style={styles.balanceText}>Balance: {playerBalance} 🪙</Text>
            {selectedSide && (
              <Text style={styles.betText}>Current bet: {betAmount} on {selectedSide}</Text>
            )}
          </View>

          <View style={styles.controlsContainer}>
            {gameStatus === 'betting' ? (
              <>
                <View style={styles.betControls}>
                  <TouchableOpacity
                    style={[styles.betButton, styles.andarButton]}
                    onPress={() => placeBet('andar', betAmount)}
                    disabled={selectedSide !== null}
                  >
                    <Text style={styles.betButtonText}>
                      {selectedSide === 'andar' ? 'Bet Placed' : 'Bet Andar'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.betButton, styles.baharButton]}
                    onPress={() => placeBet('bahar', betAmount)}
                    disabled={selectedSide !== null}
                  >
                    <Text style={styles.betButtonText}>
                      {selectedSide === 'bahar' ? 'Bet Placed' : 'Bet Bahar'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.betAmountContainer}>
                  <Text style={styles.betAmountLabel}>Bet Amount:</Text>
                  <View style={styles.betAmountControls}>
                    <TouchableOpacity
                      style={styles.betAdjustButton}
                      onPress={() => setBetAmount(prev => Math.max(50, prev - 50))}
                      disabled={gameStatus !== 'betting'}
                    >
                      <Text style={styles.betAdjustButtonText}>-50</Text>
                    </TouchableOpacity>
                    <Text style={styles.currentBetAmount}>{betAmount}</Text>
                    <TouchableOpacity
                      style={styles.betAdjustButton}
                      onPress={() => setBetAmount(prev => Math.min(playerBalance, prev + 50))}
                      disabled={gameStatus !== 'betting'}
                    >
                      <Text style={styles.betAdjustButtonText}>+50</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.gameStatusContainer}>
                <Text style={styles.gameStatusText}>
                  {gameStatus === 'dealing' ? 'Dealing cards...' :
                    gameStatus === 'match-found' ? 'Match found!' :
                      'Calculating results...'}
                </Text>
              </View>
            )}
          </View>

          <Animated.View style={[
            styles.resultOverlay,
            {
              opacity: resultAnim,
              transform: [{
                scale: resultAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}>
            {winner && (
              <Text style={styles.resultText}>
                {winner.toUpperCase()} WINS!{'\n'}
                {selectedSide === winner ? `+${Math.floor(betAmount * 1.9)} 🪙` : 'You lost'}
              </Text>
            )}
          </Animated.View>

          <TouchableOpacity
            style={styles.leaveRoomButton}
            onPress={() => {
              if (socket) socket.disconnect();
              setShowRoomInput(true);
            }}
          >
            <Text style={styles.leaveRoomButtonText}>Leave Room</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  function renderCard(card: Card, index: number, side: 'andar' | 'bahar') {
    const isRed = card.suit === '♥' || card.suit === '♦';
    const isMatched = matchedCard &&
      matchedCard.card.value === card.value &&
      matchedCard.card.suit === card.suit &&
      matchedCard.side === side;

    const totalCards = side === 'andar' ? andarCards.length : baharCards.length;
    const animationValue =
      side === 'andar'
        ? andarCardAnimations[index] || new Animated.Value(1)
        : baharCardAnimations[index] || new Animated.Value(1);

    const { transform, zIndex } = getCardAnimation(index, side === 'andar' ? 'Andar' : 'Bahar', totalCards);

    const translateX = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, typeof transform[0].translateX === 'number' ? transform[0].translateX : 0],
    });

    const scale = animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });

    return (
      <Animated.View
        key={`${side}-${index}`}
        style={[
          styles.card,
          {
            transform: [{ translateX }, { scale }],
            opacity: animationValue,
            position: 'absolute',
            zIndex,
          },
          isMatched && styles.matchedCard,
        ]}
      >
        <Text
          style={[
            styles.cardText,
            isRed ? styles.redCard : styles.blackCard,
            isMatched && styles.matchedCardText,
          ]}
        >
          {card.value}
          {card.suit}
        </Text>
        {isMatched && (
          <View style={styles.matchIndicator}>
            <Text style={styles.matchIndicatorText}>MATCH!</Text>
          </View>
        )}
      </Animated.View>
    );
  }



  function getCardAnimation(index: number, side: 'Andar' | 'Bahar', total: number) {
    const maxSpread = 240; // total space in px to cover
    const spacing = total <= 1 ? 0 : Math.min(45, maxSpread / total);
    const offset = index * spacing;
    const baseX = side === 'Andar' ? -offset : offset;

    return {
      transform: [
        { translateX: baseX },
        { translateY: 0 },
      ],
      zIndex: index,
    };
  }


}