import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConversationHeader = ({ navigation, headerInfo }) => {
  if (!headerInfo) {
    return null; // Or a loading indicator
  }

  const conversation = headerInfo.conversation;
  const isGroup = conversation.type === 'GROUP' ? true : false;
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <Image
        source={
          isGroup
            ? headerInfo.avatar
              ? { uri: headerInfo.avatar }
              : require('../../../assets/icon.png')
            : headerInfo.avatar
            ? { uri: headerInfo.avatar }
            : require('../../../assets/icon.png')
        }
        style={styles.headerAvatar}
      />
      <View style={styles.headerInfo}>
        <Text style={styles.headerName} numberOfLines={1}>
          {isGroup ? headerInfo.name || 'Group' : headerInfo.name || headerInfo.phoneNumber || 'Loading...'}
        </Text>
        {!isGroup && (
          <Text style={styles.headerStatus} numberOfLines={1}>
            {headerInfo.status || 'Offline'}
          </Text>
        )}
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => alert('Voice call')}
        >
          <Ionicons name="call" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => alert('Video call')}
        >
          <Ionicons name="videocam" size={24} color="#000" />
        </TouchableOpacity>
        {isGroup && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              navigation.navigate('GroupManagementScreen', { conversation: conversation });
            }}
          >
            <Ionicons name="settings" size={24} color="#000" />
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 10,
  },
});

export default ConversationHeader;