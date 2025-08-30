import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import styles from '../../styles/ChatScreen';

interface Message {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  isYou: boolean;
  timestamp: Date;
  avatar?: string;
}

interface User {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'playing';
  level: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      sender: 'Alex Johnson', 
      senderId: 'bot1',
      text: 'Good luck everyone!', 
      isYou: false, 
      timestamp: new Date(),
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    { 
      id: '2', 
      sender: 'You', 
      senderId: 'user',
      text: 'Thanks! Looking forward to this game.', 
      isYou: true, 
      timestamp: new Date() 
    },
    { 
      id: '3', 
      sender: 'Maria Garcia', 
      senderId: 'bot2',
      text: 'Let the game begin! I\'m ready to win this.', 
      isYou: false, 
      timestamp: new Date(),
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
  ]);
  
  const [users, setUsers] = useState<User[]>([
    { id: 'user', name: 'You', avatar: 'https://i.pravatar.cc/150?img=3', status: 'online', level: 'Gold' },
    { id: 'bot1', name: 'Alex Johnson', avatar: 'https://i.pravatar.cc/150?img=1', status: 'playing', level: 'Platinum' },
    { id: 'bot2', name: 'Maria Garcia', avatar: 'https://i.pravatar.cc/150?img=5', status: 'online', level: 'Diamond' },
    { id: 'bot3', name: 'James Wilson', avatar: 'https://i.pravatar.cc/150?img=7', status: 'offline', level: 'Silver' },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [showUserInfo, setShowUserInfo] = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = () => {
    if (newMessage.trim() === '') return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      senderId: 'user',
      text: newMessage,
      isYou: true,
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');

    setTimeout(() => {
      const botResponses = [
        "Nice move! I didn't see that coming.",
        "I'll raise you next round, just wait!",
        "Good game so far, but I'm just getting started.",
        "I'm all in! Let's see what you've got.",
        "You're bluffing! I can sense it."
      ];
      
      const availableBots = users.filter(user => user.id !== 'user');
      const randomBot = availableBots[Math.floor(Math.random() * availableBots.length)];
      
      const botResponse: Message = {
        id: Date.now().toString(),
        sender: randomBot.name,
        senderId: randomBot.id,
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        isYou: false,
        timestamp: new Date(),
        avatar: randomBot.avatar
      };
      
      setMessages(prev => [...prev, botResponse]);
    }, 1000 + Math.random() * 3000);
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const getUserInfo = (senderId: string) => {
    return users.find(user => user.id === senderId);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return '#4CAF50';
      case 'playing': return '#FF9800';
      case 'offline': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header - Updated to match ProfileScreen style */}
       <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
               <Text style={styles.title}>Game Chat</Text>
           <TouchableOpacity style={styles.iconButton} onPress={() => setShowParticipants(true)}
        >
          <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
        </TouchableOpacity>  
        </View>
 
      {/* User Info Modal */}
      {showUserInfo && (
        <View style={styles.userInfoOverlay}>
          <TouchableOpacity 
            style={styles.userInfoBackground} 
            onPress={() => setShowUserInfo(null)}
          />
          <View style={styles.userInfoCard}>
            {users.filter(user => user.id === showUserInfo).map(user => (
              <View key={user.id} style={styles.userInfoContent}>
                <Image source={{ uri: user.avatar }} style={styles.userInfoAvatar} />
                <View style={styles.userInfoStatus}>
                  <View 
                    style={[
                      styles.statusIndicator, 
                      { backgroundColor: getStatusColor(user.status) }
                    ]} 
                  />
                  <Text style={styles.userInfoStatusText}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.userInfoName}>{user.name}</Text>
                <View style={styles.userInfoLevel}>
                  <Text style={styles.userInfoLevelText}>{user.level} Level</Text>
                </View>
                <TouchableOpacity 
                  style={styles.userInfoButton}
                  onPress={() => {
                    // Handle view profile action
                    setShowUserInfo(null);
                  }}
                >
                  <Text style={styles.userInfoButtonText}>View Profile</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Participants Modal */}
      {showParticipants && (
        <View style={styles.userInfoOverlay}>
          <TouchableOpacity 
            style={styles.userInfoBackground} 
            onPress={() => setShowParticipants(false)}
          />
          <View style={styles.participantsCard}>
            <Text style={styles.participantsTitle}>Participants ({users.length})</Text>
            <ScrollView style={styles.participantsList}>
              {users.map(user => (
                <TouchableOpacity 
                  key={user.id}
                  style={styles.participantItem}
                  onPress={() => {
                    setShowParticipants(false);
                    setShowUserInfo(user.id);
                  }}
                >
                  <Image source={{ uri: user.avatar }} style={styles.participantAvatar} />
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{user.name}</Text>
                    <View style={styles.participantDetails}>
                      <View style={[
                        styles.participantStatus, 
                        { backgroundColor: getStatusColor(user.status) }
                      ]} />
                      <Text style={styles.participantLevel}>{user.level}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowParticipants(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((message) => {
          const userInfo = getUserInfo(message.senderId);
          return (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isYou ? styles.yourMessageContainer : styles.otherMessageContainer
              ]}
            >
              {!message.isYou && userInfo && (
                <TouchableOpacity 
                  onPress={() => setShowUserInfo(message.senderId)}
                  style={styles.avatarContainer}
                >
                  <Image
                    source={{ uri: userInfo.avatar }}
                    style={styles.avatar}
                  />
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(userInfo.status) }
                  ]} />
                </TouchableOpacity>
              )}
              
              <View style={[
                styles.messageBubble,
                message.isYou ? styles.yourMessage : styles.otherMessage
              ]}>
                {!message.isYou && (
                  <Text style={styles.senderName}>{message.sender}</Text>
                )}
                <Text style={styles.messageText}>{message.text}</Text>
                <Text style={styles.timestamp}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>

              {message.isYou && (
                <View style={styles.yourAvatarContainer}>
                  <Image
                    source={{ uri: getUserInfo('user')?.avatar }}
                    style={styles.yourAvatar}
                  />
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(getUserInfo('user')?.status || 'online') }
                  ]} />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          placeholderTextColor="#999"
        />
        <TouchableOpacity 
          style={[styles.sendButton, newMessage.trim() === '' && styles.sendButtonDisabled]} 
          onPress={handleSend}
          disabled={newMessage.trim() === ''}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

