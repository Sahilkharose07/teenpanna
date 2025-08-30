import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { BounceInDown } from 'react-native-reanimated';

export default function AnimatedLoaderScreen() {
  const router = useRouter();

  // Automatically redirect after bounce animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('./LoginScreen'); // Go to login after 1.5s
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View entering={BounceInDown.duration(800)}>
        <Image
          source={require('../../assets/images/logo1.png')}
          style={styles.logo}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    height: 200,
    width: 200,
    resizeMode: 'contain',
  },
});
