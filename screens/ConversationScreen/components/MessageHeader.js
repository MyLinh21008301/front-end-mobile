import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'react-native';

const MessageHeader = ({ sender, isMyMessage }) => {
  return (
    <View style={styles.messageHeader}>
      <Image
        source={
          sender?.baseImg
            ? { uri: sender.baseImg }
            : require('../../../assets/icon.png')
        }
        style={styles.messageAvatar}
      />
      <Text style={styles.messageSenderName}>
        {sender?.name || sender?.phoneNumber || 'Unknown'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default MessageHeader;
