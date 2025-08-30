// app/styles/DashboardScreen.ts

import { Dimensions, Platform, StatusBar, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
    paddingBottom: 10,
    backgroundColor: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  profileContainer: {
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF00',
    borderWidth: 2,
    borderColor: '#0A0A1F',
  },
  userInfo: {
    alignItems: 'flex-start',
  },
  username: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  balance: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 5,
  },
  // Updated Actions Section
// In your DashboardScreen styles
actions: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  padding: 5, // Reduced from 15
  backgroundColor: 'rgba(30, 30, 63, 0.7)',
  marginHorizontal: 15,
  marginTop: 10, // Reduced from 15
  borderRadius: 100, // Reduced from 20
  borderWidth: 1,
  borderColor: '#363663',
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 }, // Reduced from 4
  shadowOpacity: 0.25, // Reduced from 0.3
  shadowRadius: 3.84, // Reduced from 4.65
  elevation: 6, // Reduced from 8
},
actionButton: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 8, // Reduced from 12
  paddingHorizontal: 12, // Reduced from 20
  position: 'relative',
  borderRadius: 100, // Reduced from 15
  borderWidth: 1.5, // Reduced from 2
  borderColor: 'transparent',
  flex: 1,
  marginHorizontal: 4, // Reduced from 5
  minHeight: 40, // Added min height for consistency
},
actionButtonSelected: {
  backgroundColor: 'rgba(255, 215, 0, 0.1)',
  borderColor: '#FFD700',
},
actionText: {
  color: '#CBD5E1',
  fontSize: 14, // Reduced from 16
  fontWeight: '600',
  textAlign: 'center',
},
actionTextSelected: {
  color: '#FFD700',
  fontWeight: 'bold',
},
actionBadge: {
  position: 'absolute',
  top: -4, // Reduced from -5
  right: -4, // Reduced from -5
  backgroundColor: '#FFD700',
  borderRadius: 8, // Reduced from 10
  width: 16, // Reduced from 20
  height: 16, // Reduced from 20
  justifyContent: 'center',
  alignItems: 'center',
},
badgeText: {
  color: '#0A0A1F',
  fontSize: 10, // Reduced from 12
  fontWeight: 'bold',
},
  gamesSection: {
    paddingBottom: 30,
  },
  sliderContainer: {
    marginTop: 20,
    marginBottom: 25,
  },
  slider: {
    height: 200,
  },
  slide: {
    width: width - 40,
    height: 180,
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
slideOverlay: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: 12,
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
},
slideContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
slideTextContainer: {
  flex: 1,
  marginRight: 10,
},
slideTitle: {
  color: '#FFD700',
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 4,
},
slideSubtitle: {
  color: '#FFF',
  fontSize: 12,
},
playNowButton: {
  backgroundColor: '#FFD700',
  paddingVertical: 8,
  paddingHorizontal: 15,
  borderRadius: 20,
  minWidth: 100,
},
playNowText: {
  color: '#0A0A1F',
  fontWeight: 'bold',
  fontSize: 12,
  textAlign: 'center',
},
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A3A5A',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#FFD700',
    width: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  // Updated Game Cards
  gameCard: {
    width: (width - 40) / 2 - 5,
    marginBottom: 20,
    backgroundColor: 'rgba(30, 30, 63, 0.7)',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#363663',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameImageContainer: {
    position: 'relative',
    height: 120,
  },
  gameImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  playersBadge: {
    position: 'absolute',
    padding:20,
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playersText: {
    color: '#0A0A1F',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  gameInfo: {
    padding: 10,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 4,
  },
  // Updated Promo Banner
  promoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 20, 140, 0.3)',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#9C27B0',
  },
  promoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoIcon: {
    marginRight: 15,
  },
  promoTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  promoSubtitle: {
    color: '#FFF',
    fontSize: 14,
  },
  claimButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  claimText: {
    color: '#0A0A1F',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: '#1A1A3A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalAvatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  modalOnlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00FF00',
    borderWidth: 2,
    borderColor: '#1A1A3A',
  },
  modalUsername: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  modalLevel: {
    color: '#FFD700',
    fontSize: 16,
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    color: '#FFF',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  logoutText: {
    color: '#FF0000',
    fontWeight: 'bold',
    fontSize: 16,
  },
// Add to your existing app/styles/DashboardScreen.tsx

// ... existing styles

swipeIndicatorContainer: {
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: [{ translateY: -25 }],
  zIndex: 5,
},
swipeIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(10, 10, 31, 0.8)',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderTopLeftRadius: 12,
  borderBottomLeftRadius: 12,
},
swipeText: {
  color: '#FFD700',
  fontSize: 12,
  marginLeft: 5,
},
actionScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: '#0A0A1F',
  },
  dashboardContent: {
    flex: 1,
  },
  hiddenContent: {
    display: 'none',
  },
  actionScreenWrapper: {
  flex: 1,
  backgroundColor: '#0A0A1F',
},
closeActionButton: {
  position: 'absolute',
  top: 40,
  right: 20,
  zIndex: 10,
  padding: 10,
},
actionScreenContent: {
  flex: 1,
  marginTop: 60, // Adjust based on your header height
},
});