import { View, FlatList, StyleSheet, ActivityIndicator, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BottomNavBar from '../components/BottomNavBar';
import MainHeader from '../components/MainHeader';
import { useSocket } from '../contexts/SocketContext';
import Colors from '../constants/colors';
import { initConversation } from '../api/ConversationAPI';
import { getToken } from '../api/TokenAPI';
import { findFirstPersonByPhone } from '../api/FriendsAPI';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useUserInfo } from '../contexts/UserInfoContext';

export default function ConversationsScreen() {
  const navigation = useNavigation();
  const { conversations: socketConversations } = useSocket();
  const { userInfo } = useUserInfo();
  const [isLoading, setIsLoading] = useState(true);
  const [conversationData, setConversationData] = useState([]);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!userInfo?.phoneNumber) {
        setIsLoading(false);
        return;
      }

      try {
        const jwt = await getToken();
        if (!jwt) {
          setIsLoading(false);
          return;
        }

        // Dùng dữ liệu tĩnh từ DynamoDB nếu socket không gửi conversations
        const conversations = socketConversations?.length
          ? socketConversations
          : [{ id: "+8433390901_+8433667701" }]; // Dữ liệu tĩnh từ DynamoDB

        if (!conversations?.length) {
          setIsLoading(false);
          return;
        }

        const data = await Promise.all(
          conversations.map(async (conversation) => {
            const [id1, id2] = conversation.id.split('_');
            const friendId = id1 === userInfo.phoneNumber ? id2 : id1;

            // Fetch friend info
            const friendData = await findFirstPersonByPhone(friendId).catch(() => ({
              phoneNumber: friendId,
              name: friendId,
            }));

            // Fetch latest message
            const conversationData = await initConversation(jwt, conversation.id).catch(() => ({
              messageDetails: [],
            }));
            const messages = conversationData.messageDetails || [];
            const lastMessage = messages[messages.length - 1] || null;

            return {
              conversation,
              friendInfo: friendData,
              latestMessage: lastMessage,
            };
          })
        );

        setConversationData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [socketConversations, userInfo?.phoneNumber]);

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

  return (
    <View style={styles.container}>
      <MainHeader />
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Conversations</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ContactsScreen', { startNewChat: true })}
          style={styles.newChatButton}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <FlatList
        style={styles.conversationsListContainer}
        data={conversationData}
        keyExtractor={(item) => item.conversation.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item.conversation}
            friendInfo={item.friendInfo}
            latestMessage={item.latestMessage}
            myPhoneNumber={userInfo?.phoneNumber}
            onPress={async (id) => {
              const jwt = await getToken();
              await initConversation(jwt, id);
              navigation.navigate('ConversationScreen', { conversationId: id });
            }}
          />
        )}
        contentContainerStyle={{ paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
      />
      {/* <BottomNavBar /> */}
    </View>
  );
}

const ConversationItem = ({ conversation, friendInfo, latestMessage, myPhoneNumber, onPress }) => {
  const getSenderPrefix = () => {
    if (!latestMessage) return '';
    return latestMessage.senderId === myPhoneNumber
      ? 'You: '
      : `${friendInfo?.name || friendInfo?.phoneNumber || 'Unknown'}: `;
  };

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(conversation.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={
            friendInfo?.baseImg
              ? { uri: friendInfo.baseImg }
              : require('../assets/icon.png')
          }
          style={styles.avatar}
        />
        {friendInfo?.status === 'Online' && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {friendInfo?.name || friendInfo?.phoneNumber || 'Unknown'}
          </Text>
          {latestMessage && (
            <Text style={styles.time}>
              {new Date(latestMessage.createdAt).toLocaleDateString() ===
              new Date().toLocaleDateString()
                ? new Date(latestMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : new Date(latestMessage.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
            </Text>
          )}
        </View>
        {latestMessage ? (
          <View style={styles.messagePreview}>
            <Text style={styles.latestMessage} numberOfLines={1}>
              {getSenderPrefix()}
              {latestMessage.type === 'TEXT'
                ? latestMessage.content
                : latestMessage.type === 'MEDIA' || latestMessage.type === 'FILE'
                ? latestMessage.content.includes('.mp4')
                  ? 'Sent a video'
                  : 'Sent a file'
                : 'Unsupported message'}
            </Text>
            {latestMessage.senderId !== myPhoneNumber && !latestMessage.read && (
              <View style={styles.unreadIndicator} />
            )}
          </View>
        ) : (
          <Text style={styles.latestMessage} numberOfLines={1}>
            No messages yet
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  newChatButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsListContainer: {
    paddingHorizontal: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  latestMessage: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
});
