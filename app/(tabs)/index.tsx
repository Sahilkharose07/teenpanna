import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity , View ,Text } from 'react-native';
import { text } from 'stream/consumers';

export default function HomeScreen() {
  const router = useRouter();

  const handlePlayNow = () => {
    router.push('../screens/HomeScreen'); 
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
              <Image
          source={require('@/assets/images/logo1.png')} 
          style={styles.logo}
        />
      
      <View style={styles.titleContainer}>
        <Text style={{ color: '#fff' , fontSize: 32, fontWeight: 'bold' }}>Teen Panna</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Welcome to the Game!
        </Text>
        <Text style={styles.cardText}>
          Join the table, place your bets, and play Teen Patti with real players.
        </Text>

        <TouchableOpacity style={styles.playButton} onPress={handlePlayNow}>
          <Text style={styles.playButtonText}>Play Now</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.textTitle}>
          Play responsibly. Must be 18+ to participate.
        </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    
  },
  logo: {
    height: 180,
    width: 180,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: 25,
    margin: 18,
    marginTop: 50,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 20,
    marginBottom: 10,
  },
  textTitle: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 20,
    marginLeft: 45,
  },
  cardText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
