import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Badge from './Badge';
import Colors from '../constants/colors';

const ConversationItemComponent = ({ conversation, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(conversation.id)}>
      <Image
        source={{ uri: conversation.avatar || 'https://via.placeholder.com/48' }}
        style={styles.avatar}
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{conversation.id}</Text>
        <Text style={styles.message}>
          {conversation.messages?.length > 0
            ? conversation.messages[conversation.messages.length - 1]
            : 'No messages'}
        </Text>
      </View>
      <View style={styles.rightSection}>
        {conversation.time ? <Text style={styles.time}>{conversation.time}</Text> : null}
        {conversation.unread ? <Badge style={styles.badge}>3</Badge> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#000',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    color: '#000',
    fontWeight: 'bold',
  },
  message: {
    color: '#a3a3a3',
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  time: {
    color: '#737373',
    fontSize: 10,
  },
  badge: {
    backgroundColor: '#ef4444',
    marginTop: 4,
  },
});

export default ConversationItemComponent;