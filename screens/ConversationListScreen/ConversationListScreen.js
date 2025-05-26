import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Modal } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import BottomNavBar from '../../components/BottomNavBar';
import MainHeader from '../../components/MainHeader';
import ConversationItem from './components/ConversationItemComponent';
import { useSocket } from '../../contexts/SocketContext';
import Colors from '../../constants/colors';
import { initConversation } from '../../apis/ConversationAPI';
import { getToken } from '../../apis/TokenAPI';
import { useUserInfo } from '../../contexts/UserInfoContext';

export default function ConversationListScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { conversations, messages, socket, isLoggedIn, token } = useSocket();
  const { userInfo } = useUserInfo();
  const [isLoading, setIsLoading] = useState(true);
  const [conversationData, setConversationData] = useState([]);
  const [showSocketPanel, setShowSocketPanel] = useState(false);
  const [socketStatus, setSocketStatus] = useState({
    connected: false,
    error: null,
    lastEvent: null,
    eventCount: 0,
    connectionTime: null
  });
  const flatListRef = useRef(null);
  const prevMessagesRef = useRef(messages);

  // Monitor socket status
  useEffect(() => {
    if (!socket) {
      setSocketStatus(prev => ({
        ...prev,
        connected: false,
        error: 'Socket not initialized'
      }));
      return;
    }

    const handleConnect = () => {
      console.log('Socket connected');
      setSocketStatus(prev => ({
        ...prev,
        connected: true,
        error: null,
        connectionTime: new Date().toLocaleTimeString(),
        lastEvent: 'Connected'
      }));
    };

    const handleDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      setSocketStatus(prev => ({
        ...prev,
        connected: false,
        error: `Disconnected: ${reason}`,
        lastEvent: 'Disconnected'
      }));
    };

    const handleConnectError = (error) => {
      console.log('Socket connection error:', error);
      setSocketStatus(prev => ({
        ...prev,
        connected: false,
        error: `Connection error: ${error.message || error}`,
        lastEvent: 'Connection Error'
      }));
    };

    const handleNewMessage = (message) => {
      setSocketStatus(prev => ({
        ...prev,
        lastEvent: 'New Message Received',
        eventCount: prev.eventCount + 1
      }));
    };

    const handleNewConversation = (conversation) => {
      setSocketStatus(prev => ({
        ...prev,
        lastEvent: 'New Conversation',
        eventCount: prev.eventCount + 1
      }));
    };

    // Set initial connection status
    setSocketStatus(prev => ({
      ...prev,
      connected: socket.connected,
      connectionTime: socket.connected ? new Date().toLocaleTimeString() : null
    }));

    // Add event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('newMessage', handleNewMessage);
    socket.on('newConversation', handleNewConversation);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('newMessage', handleNewMessage);
      socket.off('newConversation', handleNewConversation);
    };
  }, [socket]);

  // Show socket panel automatically on screen focus (for debugging)
  useEffect(() => {
    if (isFocused) {
      // Auto-show panel for 3 seconds when screen loads
      setShowSocketPanel(true);
      const timer = setTimeout(() => {
        setShowSocketPanel(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  // Helper function to parse any date/time format to a comparable timestamp
  const parseDateTime = useCallback((dateTimeStr) => {
    try {
      // First try to parse as a complete ISO timestamp
      const date = new Date(dateTimeStr);
      
      // Check if it's a valid date
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
      
      // If not a valid complete timestamp, try to parse partial formats
      
      // Format like "17:14" (HH:MM today)
      if (/^\d{1,2}:\d{2}$/.test(dateTimeStr)) {
        const [hours, minutes] = dateTimeStr.split(':').map(Number);
        const today = new Date();
        today.setHours(hours, minutes, 0, 0);
        return today.getTime();
      }
      
      // Format like "15-04-2025" (DD-MM-YYYY)
      if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateTimeStr)) {
        const [day, month, year] = dateTimeStr.split('-').map(Number);
        return new Date(year, month - 1, day).getTime();
      }
      
      // If we can't parse it, return a very old date (will sort to bottom)
      return new Date(0).getTime();
    } catch (error) {
      console.error('Failed to parse date:', dateTimeStr, error);
      return new Date(0).getTime(); // Default to very old date
    }
  }, []);

  // Helper function to sort conversations by updatedAt
  const sortConversationsByUpdatedAt = useCallback((convData) => {
    return [...convData].sort((a, b) => {
      const timeA = parseDateTime(a.conversation.updatedAt);
      const timeB = parseDateTime(b.conversation.updatedAt);
      return timeB - timeA; // Sort descending (newest first)
    });
  }, [parseDateTime]);

  // Fetch initial conversation data
  useEffect(() => {
    console.log('Fetching conversations...');
    const fetchAllData = async () => {
      if (!userInfo?.phoneNumber || !conversations?.length) {
        setIsLoading(false);
        return;
      }

      try {
        const data = conversations.map((conversation) => ({
          conversation,
        }));
        
        // Sort conversations by updatedAt
        const sortedData = sortConversationsByUpdatedAt(data);
        console.log('Initial sorted data:', sortedData.map(item => ({
          id: item.conversation.id,
          updatedAt: item.conversation.updatedAt,
          timestamp: parseDateTime(item.conversation.updatedAt)
        })));
        
        setConversationData(sortedData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [conversations, userInfo?.phoneNumber, sortConversationsByUpdatedAt, parseDateTime]);

  // Handle new conversations via socket
  useEffect(() => {
    if (!socket || !userInfo?.phoneNumber) return;

    const handleNewConversation = async (newConversation) => {
      try {
        setConversationData((prev) => {
          // Check if conversation already exists
          if (prev.some((item) => item.conversation.id === newConversation.id)) {
            return prev;
          }
          
          // Add new conversation
          const newData = [
            {
              conversation: newConversation,
            },
            ...prev,
          ];
          
          // Sort by updatedAt timestamp
          const sortedData = sortConversationsByUpdatedAt(newData);
          
          // Scroll to top if needed
          if (flatListRef.current && isFocused) {
            setTimeout(() => {
              flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }, 100);
          }

          return sortedData;
        });
      } catch (error) {
        console.error('Error handling new conversation:', error);
      }
    };

    socket.on('newConversation', handleNewConversation);
    return () => socket.off('newConversation', handleNewConversation);
  }, [socket, userInfo?.phoneNumber, isFocused, sortConversationsByUpdatedAt]);

  // Update conversation list when new messages arrive
  const updateConversations = useCallback(() => {
    if (!isFocused || !messages.length || !userInfo?.phoneNumber) return;

    const newMessages = messages.filter(
      (msg) => !prevMessagesRef.current.some((prevMsg) => prevMsg.id === msg.id)
    );

    if (newMessages.length === 0) return;

    console.log('New messages received:', newMessages);

    setConversationData((prevData) => {
      let updatedData = [...prevData];
      let needsResorting = false;

      newMessages.forEach((newMessage) => {
        const conversationIndex = updatedData.findIndex(
          (item) => item.conversation.id === newMessage.conversationId
        );

        if (conversationIndex !== -1) {
          const currentConversation = updatedData[conversationIndex].conversation;
          
          // Create timestamp in format like "2025-04-21T17:15:00.000Z"
          const now = new Date();
          const timestamp = now.toISOString();
          
          // Update the conversation with new message and set updatedAt to current timestamp
          updatedData[conversationIndex] = {
            conversation: {
              ...currentConversation,
              lastMessage: newMessage,
              updatedAt: timestamp, // Use ISO format timestamp
            }
          };
          
          needsResorting = true;
        } else {
          console.warn('Message received for unknown conversation:', newMessage.conversationId);
        }
      });

      // Only resort if we have updates
      if (needsResorting) {
        updatedData = sortConversationsByUpdatedAt(updatedData);
        
        // Log the new order for debugging
        console.log('Sorted conversations after updates:',
          updatedData.map(item => ({
            id: item.conversation.id.substring(0, 10) + '...',
            updatedAt: item.conversation.updatedAt,
            parsedTime: parseDateTime(item.conversation.updatedAt)
          }))
        );
        
        // Scroll to top if needed
        if (flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        }
      }

      return updatedData;
    });

    prevMessagesRef.current = [...messages];
  }, [isFocused, messages, userInfo?.phoneNumber, sortConversationsByUpdatedAt, parseDateTime]);

  // Run updateConversations when isFocused or messages change
  useEffect(() => {
    updateConversations();
  }, [updateConversations]);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: 90,
      offset: 90 * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ConversationItem
        conversation={item.conversation}
        userInfo={userInfo}
        onPress={async (id) => {
          const jwt = await getToken();
          await initConversation(jwt, id);
          navigation.navigate('ConversationScreen', { conversationId: id });
        }}
      />
    ),
    [userInfo, navigation]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <MainHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
        <BottomNavBar />
      </View>
    );
  }

  // Force a resort before rendering to ensure correct order
  const sortedData = sortConversationsByUpdatedAt(conversationData);

  return (
    <View style={styles.container}>
      <MainHeader />
      
      {/* Socket Status Indicator (Always visible in corner) */}
      <TouchableOpacity
        style={[styles.socketIndicator, { backgroundColor: socketStatus.connected ? '#4CAF50' : '#F44336' }]}
        onPress={() => setShowSocketPanel(true)}
      >
        <Text style={styles.socketIndicatorText}>
          {socketStatus.connected ? '●' : '○'}
        </Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        style={styles.conversationsListContainer}
        data={sortedData}
        keyExtractor={(item) => item.conversation.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        maxToRenderPerBatch={10}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          console.warn('Scroll to index failed:', info);
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }, 100);
        }}
        extraData={sortedData.map(item => item.conversation.updatedAt).join(',')}
      />

      {/* Socket Status Panel Modal */}
      <Modal
        visible={showSocketPanel}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.socketPanel}>
            <Text style={styles.panelTitle}>Socket Connection Status</Text>
            
            <View style={styles.statusContainer}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Connection:</Text>
                <View style={[styles.statusIndicator, { backgroundColor: socketStatus.connected ? '#4CAF50' : '#F44336' }]}>
                  <Text style={styles.statusText}>
                    {socketStatus.connected ? '✓ Connected' : '✗ Disconnected'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Login Status:</Text>
                <Text style={[styles.statusValue, { color: isLoggedIn ? '#4CAF50' : '#F44336' }]}>
                  {isLoggedIn ? '✓ Logged In' : '✗ Not Logged In'}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Token:</Text>
                <Text style={[styles.statusValue, { color: token ? '#4CAF50' : '#F44336' }]}>
                  {token ? `✓ ${token.substring(0, 20)}...` : '✗ No Token'}
                </Text>
              </View>

              {socketStatus.connectionTime && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Connected At:</Text>
                  <Text style={styles.statusValue}>{socketStatus.connectionTime}</Text>
                </View>
              )}

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last Event:</Text>
                <Text style={styles.statusValue}>{socketStatus.lastEvent || 'None'}</Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Events Count:</Text>
                <Text style={styles.statusValue}>{socketStatus.eventCount}</Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Conversations:</Text>
                <Text style={styles.statusValue}>{conversations?.length || 0}</Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Messages:</Text>
                <Text style={styles.statusValue}>{messages?.length || 0}</Text>
              </View>

              {socketStatus.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorLabel}>Error:</Text>
                  <Text style={styles.errorText}>{socketStatus.error}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSocketPanel(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsListContainer: {
    paddingHorizontal: 8,
  },
  // Socket Status Indicator
  socketIndicator: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  socketIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal and Socket Panel Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  socketPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '95%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.logoPrimary || '#007AFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 2,
    alignItems: 'flex-end',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    lineHeight: 16,
  },
  closeButton: {
    backgroundColor: Colors.btnBackground || '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});