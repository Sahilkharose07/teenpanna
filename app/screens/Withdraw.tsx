// app/screens/drawable/WithdrawScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/WithdrawScreen';

interface WithdrawScreenProps {
  onClose: () => void;
  isVisible: boolean;
  availableBalance: number;
}

const { width } = Dimensions.get('window');

const WithdrawScreen: React.FC<WithdrawScreenProps> = ({ 
  onClose, 
  isVisible, 
  availableBalance = 0 
}) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [accountDetails, setAccountDetails] = useState({
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const withdrawalMethods = [
    { id: 'upi', name: 'UPI Transfer', icon: 'phone-portrait', requiresInput: true, inputLabel: 'UPI ID' },
    { id: 'bank', name: 'Bank Transfer', icon: 'business', requiresInput: true, inputLabel: 'Account Details' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet', requiresInput: false },
  ];

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const handleWithdrawal = () => {
    // Handle withdrawal logic here
    console.log('Withdrawing:', amount, 'via', selectedMethod);
    // After successful withdrawal, you might want to close the screen
    // onClose();
  };

  const renderMethodInput = () => {
    if (selectedMethod === 'upi') {
      return (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>UPI ID</Text>
          <TextInput
            style={styles.textInput}
            placeholder="yourname@upi"
            value={accountDetails.upiId}
            onChangeText={(text) => setAccountDetails({...accountDetails, upiId: text})}
            placeholderTextColor="#666"
          />
        </View>
      );
    } else if (selectedMethod === 'bank') {
      return (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Holder Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Full Name"
              value={accountDetails.accountHolderName}
              onChangeText={(text) => setAccountDetails({...accountDetails, accountHolderName: text})}
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Account Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="1234567890"
              keyboardType="numeric"
              value={accountDetails.accountNumber}
              onChangeText={(text) => setAccountDetails({...accountDetails, accountNumber: text})}
              placeholderTextColor="#666"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>IFSC Code</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ABCD0123456"
              value={accountDetails.ifscCode}
              onChangeText={(text) => setAccountDetails({...accountDetails, ifscCode: text})}
              placeholderTextColor="#666"
            />
          </View>
        </>
      );
    }
    return null;
  };

  const isFormValid = () => {
    if (!amount || !selectedMethod) return false;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > availableBalance) return false;
    
    if (selectedMethod === 'upi' && !accountDetails.upiId) return false;
    
    if (selectedMethod === 'bank') {
      if (!accountDetails.accountHolderName || 
          !accountDetails.accountNumber || 
          !accountDetails.ifscCode) return false;
    }
    
    return true;
  };

  if (!isVisible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Withdraw Funds</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Available Balance */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>₹{availableBalance.toLocaleString()}</Text>
          </View>

          {/* Amount Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enter Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#666"
              />
            </View>
            
            <View style={styles.quickAmounts}>
              {quickAmounts.map((quickAmount) => (
                <TouchableOpacity
                  key={quickAmount}
                  style={[
                    styles.quickAmountButton,
                    amount === quickAmount.toString() && styles.quickAmountButtonSelected,
                    quickAmount > availableBalance && styles.quickAmountButtonDisabled
                  ]}
                  onPress={() => {
                    if (quickAmount <= availableBalance) {
                      setAmount(quickAmount.toString());
                    }
                  }}
                  disabled={quickAmount > availableBalance}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextSelected,
                    quickAmount > availableBalance && styles.quickAmountTextDisabled
                  ]}>
                    ₹{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Withdrawal Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Withdrawal Method</Text>
            {withdrawalMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  selectedMethod === method.id && styles.methodButtonSelected
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodIconContainer}>
                  <Ionicons 
                    name={method.icon as any} 
                    size={22} 
                    color={selectedMethod === method.id ? '#FFD700' : '#CBD5E1'} 
                  />
                </View>
                <Text style={[
                  styles.methodText,
                  selectedMethod === method.id && styles.methodTextSelected
                ]}>
                  {method.name}
                </Text>
                {selectedMethod === method.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Method-specific input fields */}
          {selectedMethod && (
            <View style={styles.section}>
              {renderMethodInput()}
            </View>
          )}

          
        </ScrollView>

        {/* Withdraw Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.withdrawButton,
              !isFormValid() && styles.withdrawButtonDisabled
            ]}
            onPress={handleWithdrawal}
            disabled={!isFormValid()}
          >
            <Text style={styles.withdrawButtonText}>
              Withdraw ₹{amount || '0.00'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default WithdrawScreen;