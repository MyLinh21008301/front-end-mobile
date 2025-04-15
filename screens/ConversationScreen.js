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
} from 'react-native';
import { useSocket } from '../SocketContext';
import Colors from '../constants/colors';
import { text } from '../api/MessageAPI';
import { getToken } from '../api/TokenAPI';

const ConversationScreen = () => {
  const { currentConversation, sendTextMessage } = useSocket();
  const messages = currentConversation?.messageDetails || [];
  const myPhoneNumber = '+84376626025'; // Replace with dynamic user ID if needed
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef(null);

  // Scroll to the bottom when messages update
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    console.log('Current conversation:', currentConversation);
  }, [currentConversation]);

  const handleSendMessage = async () => {
    if (messageText.trim() === '') return;

    try {
      const jwt = await getToken();
      console.log('JWT:', jwt);
      console.log('CCID:', currentConversation.id);
      const success = await text(jwt, currentConversation.id, messageText);
      if (success) {
        setMessageText('');
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === myPhoneNumber;
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
        {contentElement}
        <Text style={styles.messageTime}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Text style={styles.title}>Conversation</Text>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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