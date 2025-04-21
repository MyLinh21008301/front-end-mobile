import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
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
  const { conversations, messages, socket } = useSocket();
  const { userInfo } = useUserInfo();
  const [isLoading, setIsLoading] = useState(true);
  const [conversationData, setConversationData] = useState([]);
  const flatListRef = useRef(null);
  const prevMessagesRef = useRef(messages); // Initialize with current messages

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

  // // Debug: log current order of conversation data whenever it changes
  // useEffect(() => {
  //   if (conversationData.length > 0) {
  //     console.log('Current conversation order:');
  //     conversationData.forEach((item, index) => {
  //       console.log(`${index}: ID=${item.conversation.id}, updatedAt=${item.conversation.updatedAt}, parsedTime=${parseDateTime(item.conversation.updatedAt)}`);
  //     });
  //   }
  // }, [conversationData, parseDateTime]);

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
      <FlatList
        ref={flatListRef}
        style={styles.conversationsListContainer}
        data={sortedData} // Use sorted data here
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
        extraData={sortedData.map(item => item.conversation.updatedAt).join(',')} // Better way to track updates
      />
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
});