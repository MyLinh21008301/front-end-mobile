import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet,ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConversationHeader = ({ navigation, headerInfo }) => {
  console.log('ConversationHeader - headerInfo:', headerInfo);
  if (!headerInfo) { return(
    // return null; // Or a loading indicator
    <View style={styles.header}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
    >
      <Ionicons name='arrow-back' size={24} color='#000' />
    </TouchableOpacity>
    <ActivityIndicator size='small' color='#0A84FF' style={styles.loading} />
    <Text style={styles.headerName}>Đang tải...</Text>
  </View>
);
  }

  if (headerInfo.isGroup) {
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
            headerInfo.avatar
              ? { uri: headerInfo.avatar }
              : require('../../../assets/icon.png') // Use a default group icon if preferred
          }
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {headerInfo.name || 'Group'}
          </Text>
        </View>
      </View>
    );
  } else {
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
            headerInfo.baseImg
              ? { uri: headerInfo.baseImg }
              : require('../../../assets/icon.png')
          }
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {headerInfo.name || headerInfo.phoneNumber || 'Loading...'}
          </Text>
          <Text style={styles.headerStatus}>
            {headerInfo.status || 'Offline'}
          </Text>
        </View>
      </View>
    );
  }
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
});

export default ConversationHeader;