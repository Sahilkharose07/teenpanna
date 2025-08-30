// app/screens/drawable/DepositScreen.tsx

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
import styles from '../styles/DepositScreen';
interface DepositScreenProps {
  onClose: () => void;
  isVisible: boolean;
}

const { width } = Dimensions.get('window');

const DepositScreen: React.FC<DepositScreenProps> = ({ onClose, isVisible }) => {
  const [amount, setAmount] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');

  const paymentMethods = [
    { id: 'upi', name: 'UPI', icon: 'phone-portrait' },
    { id: 'card', name: 'Credit/Debit Card', icon: 'card' },
    { id: 'netbanking', name: 'Net Banking', icon: 'business' },
    { id: 'wallet', name: 'Wallet', icon: 'wallet' },
  ];

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleDeposit = () => {
    // Handle deposit logic here
    console.log('Depositing:', amount, 'via', selectedMethod);
    // After successful deposit, you might want to close the screen
    // onClose();
  };

  if (!isVisible) return null;

  return (
    <SafeAreaView style={styles.overlay}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Deposit Funds</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
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
                    amount === quickAmount.toString() && styles.quickAmountButtonSelected
                  ]}
                  onPress={() => setAmount(quickAmount.toString())}
                >
                  <Text style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextSelected
                  ]}>
                    ₹{quickAmount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            {paymentMethods.map((method) => (
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

          {/* Promotional Banner */}
          <View style={[styles.promoBanner, styles.inputGroupWithSpacer]}>
            <View style={styles.promoIconContainer}>
              <Ionicons name="gift" size={28} color="#FFD700" />
            </View>
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>First Deposit Bonus!</Text>
              <Text style={styles.promoSubtitle}>Get 100% bonus up to ₹1000</Text>
            </View>
          </View>
        </ScrollView>

        {/* Deposit Button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.depositButton,
              (!amount || !selectedMethod) && styles.depositButtonDisabled
            ]}
            onPress={handleDeposit}
            disabled={!amount || !selectedMethod}
          >
            <Text style={styles.depositButtonText}>
              Deposit ₹{amount || '0.00'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};



export default DepositScreen;