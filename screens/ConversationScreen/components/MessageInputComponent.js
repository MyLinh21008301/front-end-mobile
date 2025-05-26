import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform, Alert } from 'react-native';
import { getToken } from '../../../apis/TokenAPI';
import { text } from '../../../apis/MessageAPI';
import MediaUploader from './MediaUploaderComponent';
import { Ionicons } from '@expo/vector-icons';

const MessageInput = ({ conversationId, onMessageSent, replyToMessage, onCancelReply }) => {
  const [messageText, setMessageText] = useState('');
  const [replyMessage, setReplyMessage] = useState(replyToMessage || null);

  useEffect(() => {
    setReplyMessage(replyToMessage);
  }, [replyToMessage]);

  const handleSendMessage = async () => {
    if (messageText.trim() === '') return;

    try {
      const jwt = await getToken();
      await text(jwt, conversationId, messageText, replyMessage?.id || null);
      setMessageText('');
      setReplyMessage(null);
      if (onMessageSent) {
        onMessageSent();
      }
      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi gửi tin nhắn');
    }
  };

  const handleCancelReply = () => {
    setReplyMessage(null);
    if (onCancelReply) {
      onCancelReply();
    }
  };

  const getReplyContent = () => {
    if (!replyMessage) return '';
    const isMedia = replyMessage.fileType === 'image' ||
                    replyMessage.fileType === 'audio' ||
                    replyMessage.fileType === 'video' ||
                    (replyMessage.fileUrl && replyMessage.fileUrl.length > 0);
    return isMedia ? 'file' : replyMessage.content || 'Unknown';
  };

  return (
    <View style={styles.inputContainer}>
      {replyMessage && (
        <View style={styles.replyPreview}>
          <View style={styles.replyContent}>
            <Text style={styles.replyTitle}>Phản hồi: {replyMessage.senderId}</Text>
            <Text numberOfLines={1} style={styles.replyText}>
              {getReplyContent()}
            </Text>
          </View>
          <TouchableOpacity onPress={handleCancelReply} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <MediaUploader
          conversationId={conversationId}
          onUploadComplete={onMessageSent}
          styles={styles}
          replyTo={replyMessage?.id}
        />
        <TextInput
          style={[styles.textInput, replyMessage && { marginTop: 5 }]}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Nhập tin nhắn..."
          multiline
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputRow: {
    flexDirection: 'row',
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
  replyPreview: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  replyContent: {
    flex: 1,
  },
  replyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  replyText: {
    fontSize: 12,
    color: '#666',
  },
  closeButton: {
    padding: 4,
  },
});

export default MessageInput;