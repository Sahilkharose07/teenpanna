// app/screens/styles/WithdrawScreen.tsx

import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
 overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A1F',
    zIndex: 1000,
  },
  container: {
    flex: 1,
    backgroundColor: '#0A0A1F',
    
  },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: Platform.OS === "android" ? 40 : 20,
      borderBottomWidth: 1,
      borderBottomColor: '#1A1A3A',
      backgroundColor: '#1A1A3A',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 5,
    },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  closeButton: {
 padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#CBD5E1',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 60,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    width: '30%',
    padding: 12,
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickAmountButtonSelected: {
    backgroundColor: '#FFD700',
  },
  quickAmountButtonDisabled: {
    backgroundColor: '#1A1A1A',
    opacity: 0.5,
  },
  quickAmountText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickAmountTextSelected: {
    color: '#000000',
  },
  quickAmountTextDisabled: {
    color: '#666',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    marginBottom: 10,
  },
  methodButtonSelected: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  methodIconContainer: {
    marginRight: 15,
  },
  methodText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  methodTextSelected: {
    color: '#FFD700',
    fontWeight: '600',
  },
  selectedIndicator: {
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#CBD5E1',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputGroupWithSpacer: {
    marginBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
  },
  infoIconContainer: {
    marginRight: 15,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2D2D2D',
  },
  withdrawButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  withdrawButtonDisabled: {
    backgroundColor: '#2D2D2D',
    opacity: 0.5,
  },
  withdrawButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default styles;