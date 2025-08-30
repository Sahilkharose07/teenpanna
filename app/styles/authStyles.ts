import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,   
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#1e1e1e',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 16,
  },
  linkText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});