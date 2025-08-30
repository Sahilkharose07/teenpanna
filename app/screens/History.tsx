// app/screens/drawable/HistoryScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StyleSheet,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles  from '../styles/HistoryScreen';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  date: Date;
  referenceId: string;
}

interface HistoryScreenProps {
  onClose: () => void;
  isVisible: boolean;
}

const { width } = Dimensions.get('window');

const HistoryScreen: React.FC<HistoryScreenProps> = ({ onClose, isVisible }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  // Sample transaction data
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'deposit',
      amount: 1000,
      method: 'UPI',
      status: 'completed',
      date: new Date(2023, 9, 15, 14, 30),
      referenceId: 'REF123456789'
    },
    {
      id: '2',
      type: 'withdrawal',
      amount: 500,
      method: 'Bank Transfer',
      status: 'pending',
      date: new Date(2023, 9, 14, 10, 15),
      referenceId: 'REF987654321'
    },
    {
      id: '3',
      type: 'deposit',
      amount: 2000,
      method: 'Credit Card',
      status: 'completed',
      date: new Date(2023, 9, 12, 16, 45),
      referenceId: 'REF456789123'
    }, {
      id: '4',
      type: 'deposit',
      amount: 5000,
      method: 'Net Banking',
      status: 'completed',
      date: new Date(2023, 9, 8, 11, 20),
      referenceId: 'REF321654987'
    },
    {
      id: '5',
      type: 'withdrawal',
      amount: 1000,
      method: 'UPI',
      status: 'failed',
      date: new Date(2023, 9, 10, 9, 30),
      referenceId: 'REF789123456'
    },
   
  ]);

  const filterOptions = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdrawal', label: 'Withdrawals' },
  ];

  const statusConfig = {
    pending: { color: '#FFA500', icon: 'time' },
    completed: { color: '#00CC00', icon: 'checkmark-circle' },
    failed: { color: '#FF3333', icon: 'close-circle' },
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    return transaction.type === selectedFilter;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isVisible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A1F" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Transaction History</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFD700" />
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        <View style={styles.filterContainer}>
          {filterOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterButton,
                selectedFilter === option.id && styles.filterButtonSelected
              ]}
              onPress={() => setSelectedFilter(option.id)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === option.id && styles.filterTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content}>
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(transaction => {
              const statusInfo = statusConfig[transaction.status];
              
              return (
                <View key={transaction.id} style={[styles.transactionCard , styles.inputGroupWithSpacer]}>
                  <View style={styles.transactionHeader}>
                    <View style={styles.transactionType}>
                      <View style={[
                        styles.typeIconContainer,
                        transaction.type === 'deposit' ? styles.depositIcon : styles.withdrawalIcon
                      ]}>
                        <Ionicons 
                          name={transaction.type === 'deposit' ? 'arrow-down' : 'arrow-up'} 
                          size={18} 
                          color="#FFF" 
                        />
                      </View>
                      <Text style={styles.transactionTypeText}>
                        {transaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                      </Text>
                    </View>
                    
                    <View style={styles.statusContainer}>
                      <Ionicons 
                        name={statusInfo.icon as any} 
                        size={16} 
                        color={statusInfo.color} 
                      />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.transactionDetails}>
                    <View style={styles.amountContainer}>
                      <Text style={[
                        styles.amountText,
                        transaction.type === 'deposit' ? styles.depositAmount : styles.withdrawalAmount
                      ]}>
                        {transaction.type === 'deposit' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.methodText}>
                        via {transaction.method}
                      </Text>
                    </View>
                    
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateText}>
                        {formatDate(transaction.date)}
                      </Text>
                      <Text style={styles.timeText}>
                        {formatTime(transaction.date)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.referenceContainer}>
                    <Text style={styles.referenceLabel}>Reference ID: </Text>
                    <Text style={styles.referenceId}>{transaction.referenceId}</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt" size={64} color="#363663" />
              <Text style={styles.emptyStateText}>No transactions found</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedFilter === 'all' 
                  ? 'You don\'t have any transactions yet' 
                  : `You don't have any ${selectedFilter} transactions yet`}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};



export default HistoryScreen;