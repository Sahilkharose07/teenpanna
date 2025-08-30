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
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A3A',
    backgroundColor: '#1A1A3A',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: 'rgba(30, 30, 63, 0.7)',
    borderWidth: 1,
    borderColor: '#363663',
  },
  filterButtonSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  filterText: {
    color: '#CBD5E1',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  transactionCard: {
    backgroundColor: 'rgba(30, 30, 63, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#363663',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  depositIcon: {
    backgroundColor: '#00CC00',
  },
  withdrawalIcon: {
    backgroundColor: '#FF3333',
  },
  transactionTypeText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountContainer: {
    alignItems: 'flex-start',
  },
  amountText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  depositAmount: {
    color: '#00CC00',
  },
  withdrawalAmount: {
    color: '#FF3333',
  },
  methodText: {
    color: '#CBD5E1',
    fontSize: 14,
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 2,
  },
  timeText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  referenceContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#363663',
    paddingTop: 12,
  },
  referenceLabel: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  referenceId: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#CBD5E1',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
    inputGroupWithSpacer: {
    marginBottom: 40,
  },
});

export default styles;  