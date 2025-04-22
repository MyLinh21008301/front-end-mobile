import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { findFirstPersonByPhone } from '../../../api/FriendsAPI';
import { Ionicons } from '@expo/vector-icons';

// Function to parse createdAt
const parseCreatedAt = (createdAt) => {
  try {
    // Handle HH:mm format (e.g., "16:43")
    if (/^\d{2}:\d{2}$/.test(createdAt)) {
      const today = new Date();
      const [hours, minutes] = createdAt.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today;
    }
    // Handle ISO format with nanoseconds (e.g., "2025-04-21T15:39:36.994258700")
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/.test(createdAt)) {
      return new Date(createdAt.replace(/(\.\d{3})\d+/, '$1Z'));
    }
    // Fallback: return current date/time
    console.warn('Invalid createdAt format:', createdAt);
    return new Date();
  } catch (error) {
    console.error('Error parsing createdAt:', createdAt, error);
    return new Date();
  }
};

const ConversationItem = ({ conversation, userInfo, onPress }) => {
  const [friendInfo, setFriendInfo] = useState(null);
  const [senderInfo, setSenderInfo] = useState(null);
  const latestMessage = conversation.lastMessage;

  useEffect(() => {
    const fetchFriendInfo = async () => {
      if (conversation.type === 'PRIVATE') {
        const friend = conversation.participants.find(
          (p) => p !== userInfo.phoneNumber
        );
        if (friend) {
          try {
            const friendData = await findFirstPersonByPhone(friend).catch(() => ({
              phoneNumber: friend,
              name: friend,
            }));
            setFriendInfo(friendData);
          } catch (error) {
            console.error('Error fetching friend info:', error);
          }
        }
      }
    };

    const fetchSenderInfo = async () => {
      if (latestMessage && latestMessage.senderId !== userInfo.phoneNumber && conversation.type === 'GROUP') {
        try {
          const sender = await findFirstPersonByPhone(latestMessage.senderId).catch(() => ({
            phoneNumber: latestMessage.senderId,
            name: latestMessage.senderId,
          }));
          setSenderInfo(sender);
        } catch (error) {
          console.error('Error fetching sender info:', error);
        }
      }
    };

    fetchFriendInfo();
    fetchSenderInfo();
  }, [conversation, userInfo.phoneNumber, latestMessage]);

  const getSenderPrefix = () => {
    if (!latestMessage) return '';
    
    if (latestMessage.senderId === userInfo.phoneNumber) {
      return 'You: ';
    }
    
    if (conversation.type === 'GROUP') {
      return `${senderInfo?.name || 'Unknown'}: `;
    } else {
      return '';
    }
  };

  const displayName = conversation.type === 'PRIVATE' 
    ? friendInfo?.name || friendInfo?.phoneNumber || 'Unknown'
    : conversation.conversationName || 'Group Chat';
  const displayImage = conversation.type === 'PRIVATE'
    ? friendInfo?.baseImg
      ? { uri: friendInfo.baseImg }
      : require('../../../assets/icon.png')
    : conversation.conversationImgUrl
      ? { uri: conversation.conversationImgUrl }
      : require('../../../assets/icon.png');
  

  return (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => onPress(conversation.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={displayImage}
          style={styles.avatar}
        />
        {friendInfo?.status === 'Online' && conversation.type === 'PRIVATE' && (
          <View style={styles.onlineIndicator} />
        )}
      </View>
      <View style={styles.conversationInfo}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{displayName}</Text>
            {conversation.type === 'GROUP' && (
              <Ionicons name="people" size={16} color="#666" style={styles.groupIcon} />
            )}
          </View>
          {latestMessage && (
            <Text style={styles.time}>
              {parseCreatedAt(latestMessage.createdAt).toLocaleDateString() ===
              new Date().toLocaleDateString()
                ? parseCreatedAt(latestMessage.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : parseCreatedAt(latestMessage.createdAt).toLocaleDateString([], {
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
            {latestMessage.senderId !== userInfo.phoneNumber && !latestMessage.read && (
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
    height: 90,
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  groupIcon: {
    marginLeft: 6,
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

export default ConversationItem;