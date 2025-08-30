import React, { useEffect, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface Message {
  id: string;
  sender: string;
  text: string;
  isYou: boolean;
  timestamp: Date;
}

const ChatScreen = ({ route, navigation }: any) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'Bot 1', text: 'Good luck everyone!', isYou: false, timestamp: new Date() },
    { id: '2', sender: 'You', text: 'Thanks!', isYou: true, timestamp: new Date() },
    { id: '3', sender: 'Bot 2', text: 'Let the game begin!', isYou: false, timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = React.useRef<ScrollView>(null);

  const handleSend = () => {
    if (newMessage.trim() === '') return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      text: newMessage,
      isYou: true,
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate bot responses
    setTimeout(() => {
      const botResponses = [
        "Nice move!",
        "I'll raise you next round",
        "Good game!",
        "I'm all in!",
        "You're bluffing!"
      ];
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: `Bot ${Math.floor(Math.random() * 4) + 1}`,
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        isYou: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000 + Math.random() * 3000);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game Chat</Text>
        <View style={{ width: 30 }} /> {/* For balance */}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble,
              message.isYou ? styles.yourMessage : styles.otherMessage
            ]}
          >
            {!message.isYou && (
              <Image
                source={{ uri: `https://i.pravatar.cc/50?img=${message.sender.replace('Bot ', '')}` }}
                style={styles.avatar}
              />
            )}
            <View style={styles.messageContent}>
              {!message.isYou && (
                <Text style={styles.senderName}>{message.sender}</Text>
              )}
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.timestamp}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  messagesContent: {
    paddingVertical: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 10,
    flexDirection: 'row',
  },
  yourMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4a8cff',
    borderRadius: 15,
    padding: 10,
    borderBottomRightRadius: 0,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 10,
    borderBottomLeftRadius: 0,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 2,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#ccc',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4a8cff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ChatScreen;