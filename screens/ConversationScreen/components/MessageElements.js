import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { parseCreatedAt } from './MessageUtils';

const RecalledMessage = ({ isMyMessage }) => {
  return (
    <View
      style={[
        styles.messageBubble,
        isMyMessage ? styles.yourMessage : styles.otherMessage,
        styles.recalledMessageBubble
      ]}
    >
      <Text style={styles.recalledText}>Tin nhắn này đã được xóa</Text>
    </View>
  );
};

const MessageTimestamp = ({ timestamp, isMyMessage }) => {
  return (
    <Text style={[styles.messageTime, isMyMessage ? styles.yourMessageTime : {}]}>
      {parseCreatedAt(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
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
  recalledMessageBubble: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  recalledText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  yourMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
});

export { RecalledMessage, MessageTimestamp };
