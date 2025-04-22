import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
} from 'react-native';
import { initConversation } from '../api/ConversationAPI';
import { text } from '../api/MessageAPI';
import { getToken } from '../api/TokenAPI';
import { findFirstPersonByPhone } from '../api/FriendsAPI';
import { getUserInfo } from '../api/UserAPI'; // Import getUserInfo
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import BASE_URL from '../api/BaseURL';

// Component hiển thị từng tin nhắn (giữ nguyên)
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

// API để tạo cuộc hội thoại mới
const createConversation = async (jwt, userPhone, friendPhone) => {
  try {
    console.log('Creating conversation between', userPhone, 'and', friendPhone);
    const response = await axios.post(
      `${BASE_URL}/conversations/create`, // Sử dụng endpoint từ mã cũ
      { friendPhone },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('Create conversation response:', response.data);
    return response.data; // Giả định backend trả về ConversationDetailDto
  } catch (error) {
    console.error('Error creating conversation:', error.response?.data || error.message);
    throw error;
  }
};

const ConversationScreen = ({ route, navigation }) => {
  const { conversationId, friendPhone } = route.params; // userPhone không cần từ route.params
  const [jwt, setJwt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [friendInfo, setFriendInfo] = useState(null);
  const [myInfo, setMyInfo] = useState(null);
  const [conversationExists, setConversationExists] = useState(false);
  const [effectiveConversationId, setEffectiveConversationId] = useState(conversationId);
  const flatListRef = useRef(null);

  // Khởi tạo thông tin người dùng và bạn bè
  useEffect(() => {
    const initialize = async () => {
      try {
        const token = await getToken();
        if (!token) {
          Alert.alert('Lỗi', 'Không tìm thấy token xác thực.');
          navigation.goBack();
          return;
        }
        setJwt(token);

        // Lấy thông tin người dùng từ getUserInfo
        const userData = await getUserInfo();
        if (!userData || !userData.phoneNumber) {
          Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng.');
          navigation.goBack();
          return;
        }
        setMyInfo({ phoneNumber: userData.phoneNumber });

        // Lấy thông tin bạn bè
        if (friendPhone) {
          try {
            const friendData = await findFirstPersonByPhone(friendPhone);
            setFriendInfo(friendData || { phoneNumber: friendPhone });
          } catch (error) {
            console.error('Error fetching friend info:', error);
            setFriendInfo({ phoneNumber: friendPhone });
          }
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy thông tin bạn bè.');
          navigation.goBack();
          return;
        }

        // Thử khởi tạo cuộc hội thoại
        let convo = await tryInitConversation(token, conversationId);
        if (!convo) {
          console.log('Conversation not found, trying alternate ID');
          const alternateId = `${friendPhone}_${userData.phoneNumber}`;
          convo = await tryInitConversation(token, alternateId);
          if (convo) {
            setEffectiveConversationId(alternateId);
          } else {
            // Tạo cuộc hội thoại mới nếu cả hai ID đều không tồn tại
            console.log('Creating new conversation');
            try {
              convo = await createConversation(token, userData.phoneNumber, friendPhone);
              setEffectiveConversationId(convo.id);
            } catch (createError) {
              Alert.alert(
                'Lỗi',
                'Không thể tạo hội thoại mới. Vui lòng kiểm tra kết nối hoặc thử lại sau.'
              );
              return;
            }
          }
        }
        setConversationExists(true);
        setMessages(convo.messageDetails || []);
      } catch (error) {
        console.error('Error initializing conversation:', error.response?.data || error);
        Alert.alert('Lỗi', 'Không thể khởi tạo hội thoại. Vui lòng thử lại sau.');
      }
    };

    initialize();
  }, [conversationId, friendPhone, navigation]);

  const tryInitConversation = async (jwt, id) => {
    try {
      console.log('Trying to initialize conversation with ID:', id);
      const convo = await initConversation(jwt, id);
      return convo;
    } catch (error) {
      console.log('Failed to initialize conversation with ID:', id);
      return null;
    }
  };

  // Cuộn xuống cuối danh sách tin nhắn khi messages thay đổi
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: false });
      }, 0);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !jwt || !effectiveConversationId) return;

    if (!conversationExists) {
      Alert.alert(
        'Thông báo',
        `Vui lòng chờ hội thoại với ${friendInfo?.name || friendPhone} được khởi tạo.`
      );
      return;
    }

    try {
      const response = await text(jwt, effectiveConversationId, messageText);
      setMessages((prev) => [...prev, response]);
      setMessageText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 0);
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error);
      Alert.alert(
        'Lỗi',
        `Không thể gửi tin nhắn đến ${friendInfo?.name || friendPhone}. Vui lòng thử lại sau.`
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
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

      {/* Danh sách tin nhắn */}
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
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />

      {/* Input gửi tin nhắn */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder={conversationExists ? 'Nhập tin nhắn...' : 'Đang chờ khởi tạo hội thoại...'}
          multiline
          placeholderTextColor="#999"
          editable={conversationExists}
        />
        <TouchableOpacity
          style={[styles.sendButton, !conversationExists && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!conversationExists}
        >
          <Text style={styles.sendButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// Styles (giữ nguyên)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  backButton: { padding: 5 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: 'bold' },
  headerStatus: { fontSize: 12, color: '#666' },
  messageList: { padding: 10 },
  messageBubble: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: '80%' },
  yourMessage: { backgroundColor: '#ccc', alignSelf: 'flex-end' },
  otherMessage: { backgroundColor: '#f1f1f1', alignSelf: 'flex-start' },
  messageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  messageAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 5 },
  messageSenderName: { fontSize: 12, fontWeight: 'bold' },
  messageText: { fontSize: 14 },
  messageTime: { fontSize: 10, color: '#666', marginTop: 5, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
  textInput: { flex: 1, borderRadius: 20, padding: 10, backgroundColor: '#f1f1f1', maxHeight: 100 },
  sendButton: { backgroundColor: '#000', borderRadius: 20, padding: 10, marginLeft: 10, justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#ccc' },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});

export default ConversationScreen;