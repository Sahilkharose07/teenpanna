// utils/gameLogic.ts (corrected)
// Card and hand evaluation utilities
const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Card interface
export interface Card {
  value: string;
  suit: string;
  code: string;
}

// Hand ranking values (higher is better)
export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  FLUSH = 3,
  STRAIGHT = 4,
  THREE_OF_A_KIND = 5,
  STRAIGHT_FLUSH = 6,
  PURE_SEQUENCE = 7 // Same as straight flush in Teen Patti
}

// Player hand evaluation result
export interface HandEvaluation {
  rank: HandRank;
  description: string;
  highCards: string[]; // For tie-breaking
  numericValue: number; // For comparison
}

// Create a standard 52-card deck
export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ value, suit, code: `${value}${suit}` });
    }
  }
  return deck;
};

// Shuffle the deck using Fisher-Yates algorithm
export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Deal cards to players (3 cards each)
export const dealCards = (deck: Card[], playerCount: number): { hands: Card[][], remainingDeck: Card[] } => {
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  const newDeck = [...deck];
  
  // Deal 3 cards to each player
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < playerCount; j++) {
      if (newDeck.length > 0) {
        const card = newDeck.pop()!;
        hands[j].push(card);
      }
    }
  }
  
  return { hands, remainingDeck: newDeck };
};

// Evaluate a hand and return its rank and value
export const evaluateHand = (cards: Card[]): HandEvaluation => {
  if (!cards || cards.length < 3) {
    return {
      rank: HandRank.HIGH_CARD,
      description: "Invalid hand",
      highCards: [],
      numericValue: 0
    };
  }
  
  // Get numeric values for cards (Ace is 14, King is 13, etc.)
  const getNumericValue = (value: string): number => {
    switch(value) {
      case 'A': return 14;
      case 'K': return 13;
      case 'Q': return 12;
      case 'J': return 11;
      default: return parseInt(value, 10);
    }
  };
  
  // Sort cards by numeric value (descending)
  const sortedCards = [...cards].sort((a, b) => getNumericValue(b.value) - getNumericValue(a.value));
  const numericValues = sortedCards.map(card => getNumericValue(card.value));
  
  // Check for same suit (flush)
  const isFlush = sortedCards.every(card => card.suit === sortedCards[0].suit);
  
  // Check for straight/sequence
  let isStraight = false;
  if (numericValues[0] === numericValues[1] + 1 && numericValues[1] === numericValues[2] + 1) {
    isStraight = true;
  }
  
  // Special case: A-2-3 straight
  if (numericValues[0] === 14 && numericValues[1] === 3 && numericValues[2] === 2) {
    isStraight = true;
    // For A-2-3, we want to treat 3 as the high card for comparison
    numericValues[0] = 3;
    numericValues[1] = 2;
    numericValues[2] = 1;
    sortedCards.unshift(sortedCards.pop()!); // Rotate the array
  }
  
  // Check for pairs or three of a kind
  const valueCounts: Record<string, number> = {};
  sortedCards.forEach(card => {
    valueCounts[card.value] = (valueCounts[card.value] || 0) + 1;
  });
  
  const hasThreeOfAKind = Object.values(valueCounts).some(count => count === 3);
  const hasPair = Object.values(valueCounts).some(count => count === 2);
  
  // Determine hand rank
  let rank: HandRank;
  let description: string;
  
  if (isStraight && isFlush) {
    rank = HandRank.PURE_SEQUENCE;
    description = "Pure Sequence";
  } else if (hasThreeOfAKind) {
    rank = HandRank.THREE_OF_A_KIND;
    description = "Trail";
  } else if (isStraight) {
    rank = HandRank.STRAIGHT;
    description = "Sequence";
  } else if (isFlush) {
    rank = HandRank.FLUSH;
    description = "Color";
  } else if (hasPair) {
    rank = HandRank.PAIR;
    description = "Pair";
  } else {
    rank = HandRank.HIGH_CARD;
    description = "High Card";
  }
  
  // Calculate numeric value for comparison (higher is better)
  // Format: RRHHHH (R=rank, H=high card value)
  let numericValue = rank * 10000;
  
  if (hasThreeOfAKind) {
    // For three of a kind, all cards have the same value
    numericValue += getNumericValue(sortedCards[0].value) * 100;
  } else if (hasPair) {
    // Find the pair value and the kicker
    const pairValue = Object.keys(valueCounts).find(key => valueCounts[key] === 2);
    const kickerValue = Object.keys(valueCounts).find(key => valueCounts[key] === 1);
    
    if (pairValue && kickerValue) {
      numericValue += getNumericValue(pairValue) * 100;
      numericValue += getNumericValue(kickerValue);
    }
  } else {
    // For high card, add values of all cards (weighted)
    numericValue += getNumericValue(sortedCards[0].value) * 100;
    numericValue += getNumericValue(sortedCards[1].value) * 10;
    numericValue += getNumericValue(sortedCards[2].value);
  }
  
  return {
    rank,
    description,
    highCards: sortedCards.map(card => card.value),
    numericValue
  };
};

// Compare two hands to determine which is better
export const compareHands = (hand1: Card[], hand2: Card[]): number => {
  const eval1 = evaluateHand(hand1);
  const eval2 = evaluateHand(hand2);
  
  // First compare by rank
  if (eval1.numericValue > eval2.numericValue) return 1;
  if (eval1.numericValue < eval2.numericValue) return -1;
  
  // If same rank, compare high cards
  for (let i = 0; i < Math.min(eval1.highCards.length, eval2.highCards.length); i++) {
    const value1 = eval1.highCards[i];
    const value2 = eval2.highCards[i];
    
    const numValue1 = getNumericValue(value1);
    const numValue2 = getNumericValue(value2);
    
    if (numValue1 > numValue2) return 1;
    if (numValue1 < numValue2) return -1;
  }
  
  // Hands are exactly equal
  return 0;
};

// Helper function to get numeric value of a card
const getNumericValue = (value: string): number => {
  switch(value) {
    case 'A': return 14;
    case 'K': return 13;
    case 'Q': return 12;
    case 'J': return 11;
    default: return parseInt(value, 10);
  }
};

// Determine the winner among multiple players
export const determineWinner = (players: { id: string; cards: Card[]; isFolded: boolean }[]): string[] => {
  const activePlayers = players.filter(player => !player.isFolded);
  
  if (activePlayers.length === 0) {
    return []; // All players folded, no winner
  }
  
  if (activePlayers.length === 1) {
    return [activePlayers[0].id]; // Only one player left
  }
  
  // Compare all active players' hands
  let winners: string[] = [activePlayers[0].id];
  let bestHand = activePlayers[0].cards;
  
  for (let i = 1; i < activePlayers.length; i++) {
    const comparison = compareHands(activePlayers[i].cards, bestHand);
    
    if (comparison > 0) {
      // New best hand
      winners = [activePlayers[i].id];
      bestHand = activePlayers[i].cards;
    } else if (comparison === 0) {
      // Tie
      winners.push(activePlayers[i].id);
    }
  }
  
  return winners;
};

// Calculate side pots in case some players are all-in
export const calculateSidePots = (players: { id: string; betAmount: number; isFolded: boolean }[]): { winners: string[]; amount: number }[] => {
  // Create a list of players with their bet amounts
  const playerBets = players
    .filter(player => player.betAmount > 0 && !player.isFolded)
    .map(player => ({ id: player.id, amount: player.betAmount }))
    .sort((a, b) => a.amount - b.amount);
  
  const pots: { winners: string[]; amount: number }[] = [];
  let previousLevel = 0;
  
  for (let i = 0; i < playerBets.length; i++) {
    const currentLevel = playerBets[i].amount;
    const amountAtThisLevel = (currentLevel - previousLevel) * (playerBets.length - i);
    
    if (amountAtThisLevel > 0) {
      // Players who can win this pot are those who bet at least this much
      const eligiblePlayers = playerBets
        .slice(i)
        .map(player => player.id);
      
      pots.push({
        winners: eligiblePlayers,
        amount: amountAtThisLevel
      });
      
      previousLevel = currentLevel;
    }
  }
  
  return pots;
};

// Teen Patti-specific hand descriptions
export const getHandDescription = (cards: Card[]): string => {
  const evaluation = evaluateHand(cards);
  return evaluation.description;
};

// Format card for display
export const formatCard = (card: Card): string => {
  return `${card.value}${card.suit}`;
};

// Parse card from string
export const parseCard = (cardString: string): Card => {
  const suit = cardString.slice(-1);
  const value = cardString.slice(0, -1);
  return { value, suit, code: cardString };
};