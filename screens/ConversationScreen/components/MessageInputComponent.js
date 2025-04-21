// MessageInput.js
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { getToken } from '../../../apis/TokenAPI';
import { text } from '../../../apis/MessageAPI';
import MediaUploader from './MediaUploaderComponent';

const MessageInput = ({ conversationId, onMessageSent }) => {
  const [messageText, setMessageText] = useState('');

  const handleSendMessage = async () => {
    if (messageText.trim() === '') return;

    try {
      const jwt = await getToken();
      await text(jwt, conversationId, messageText);
      setMessageText('');
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'An error occurred while sending the message');
    }
  };

  return (
    <View style={styles.inputContainer}>
      <MediaUploader 
        conversationId={conversationId} 
        onUploadComplete={onMessageSent}
        styles={styles}
      />
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
  );
};

const styles = StyleSheet.create({
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
  icon: {
    marginRight: 10,
  },
});

export default MessageInput;