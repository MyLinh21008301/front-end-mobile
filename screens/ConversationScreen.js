import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSocket } from '../contexts/SocketContext';
import { useUserInfo } from '../contexts/UserInfoContext';
import Colors from '../constants/colors';
import { text } from '../api/MessageAPI';
import { getToken } from '../api/TokenAPI';
import { findFirstPersonByPhone } from '../api/FriendsAPI';
import { Ionicons } from '@expo/vector-icons';

const MessageItem = ({ item, myInfo, friendInfo }) => {
  const isMyMessage = item.senderId === myInfo?.phoneNumber;
  const sender = isMyMessage ? myInfo : friendInfo;

  let contentElement;

  switch (item.type) {
    case 'TEXT':
      contentElement = <Text style={styles.messageText}>{item.content}</Text>;
      break;
    case 'MEDIA':
    case 'FILE':
      contentElement = (
        <TouchableOpacity onPress={() => Linking.openURL(item.content)}>
          <Text style={[styles.messageText, { color: '#007aff', textDecorationLine: 'underline' }]}>
            {item.content.includes('.mp4') ? '📹 Video' : '📎 File'}: Tap to open
          </Text>
        </TouchableOpacity>
      );
      break;
    default:
      contentElement = <Text style={styles.messageText}>Unsupported message type</Text>;
  }

  return (
    <View
      style={[
        styles.messageBubble,
        isMyMessage ? styles.yourMessage : styles.otherMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <Image
          source={
            sender?.baseImg
              ? { uri: sender.baseImg }
              : require('../assets/icon.png')
          }
          style={styles.messageAvatar}
        />
        <Text style={styles.messageSenderName}>
          {sender?.name || sender?.phoneNumber || 'Unknown'}
        </Text>
      </View>
      {contentElement}
      <Text style={styles.messageTime}>
        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const ConversationScreen = ({ navigation }) => {
  const { currentConversation, sendTextMessage } = useSocket();
  const { userInfo } = useUserInfo();
  const [friendInfo, setFriendInfo] = useState(null);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef(null);

  const messages = currentConversation?.messageDetails || [];
  const myInfo = userInfo;

  useEffect(() => {
    const fetchFriendInfo = async () => {
      if (currentConversation?.id && myInfo?.phoneNumber) {
        try {
          const [id1, id2] = currentConversation.id.split('_');
          const friendId = id1 === myInfo.phoneNumber ? id2 : id1;
          const friendData = await findFirstPersonByPhone(friendId);
          setFriendInfo(friendData || { phoneNumber: friendId });
        } catch (error) {
          console.error('Error fetching friend info:', error);
          setFriendInfo({ phoneNumber: 'Unknown' });
        }
      }
    };

    fetchFriendInfo();
  }, [currentConversation, myInfo]);

  // Scroll to bottom on initial mount and when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      // Use setTimeout to ensure FlatList has rendered
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: false });
      }, 0);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (messageText.trim() === '') return;

    try {
      const jwt = await getToken();
      const success = await text(jwt, currentConversation.id, messageText);
      if (success) {
        setMessageText('');
        // Scroll to bottom after sending a message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 0);
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Image
          source={
            friendInfo?.baseImg
              ? { uri: friendInfo.baseImg }
              : require('../assets/icon.png')
          }
          style={styles.headerAvatar}
        />

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {friendInfo?.name || friendInfo?.phoneNumber || 'Loading...'}
          </Text>
          <Text style={styles.headerStatus}>
            {friendInfo?.status || 'Offline'}
          </Text>
        </View>
      </View>


      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MessageItem
            item={item}
            myInfo={myInfo}
            friendInfo={friendInfo || {}}
          />
        )}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => {
          // Scroll to bottom when content size changes (e.g., new messages)
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          // Scroll to bottom when FlatList is first laid out
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#eee',
    borderBottomColor: '#eee',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButton: {
    padding: 4,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 8,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  headerStatus: {
    fontSize: 13,
    color: 'gray',
  },
  
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  yourMessage: {
    backgroundColor: '#007aff',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  messageSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007aff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConversationScreen;