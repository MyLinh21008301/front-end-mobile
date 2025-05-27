import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';

const ConversationHeader = ({ navigation, headerInfo }) => {
  if (!headerInfo || !headerInfo.conversation) {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerName}>Đang tải...</Text>
      </View>
    );
  }

  const conversation = headerInfo.conversation;
  const isGroup = conversation.type === 'GROUP';

  // Hàm xử lý khi nhấn vào avatar hoặc tên
  const handleProfilePress = () => {
    console.log('headerInfo:', headerInfo); // Log để debug
    if (isGroup) {
      navigation.navigate('GroupManagementScreen', { conversation });
    } else {
      if (!headerInfo.phoneNumber) {
        Alert.alert('Lỗi', 'Không thể xem thông tin cá nhân do thiếu số điện thoại.');
        console.warn('Missing phoneNumber in headerInfo:', headerInfo);
        return;
      }
      navigation.navigate('PersonalPageScreen', {
        person: {
          phoneNumber: headerInfo.phoneNumber,
          name: headerInfo.name || headerInfo.phoneNumber || 'Unknown',
          baseImg: headerInfo.avatar || null,
          status: headerInfo.status || 'Offline',
          backgroundImg: headerInfo.backgroundImg || null,
          dateOfBirth: headerInfo.dateOfBirth || null,
          male: headerInfo.male !== undefined ? headerInfo.male : null,
          bio: headerInfo.bio || null,
          lastOnlineTime: headerInfo.lastOnlineTime || null,
        },
      });
      console.log('Navigating to PersonalPageScreen with person:', {
        phoneNumber: headerInfo.phoneNumber,
        name: headerInfo.name,
        baseImg: headerInfo.avatar,
        status: headerInfo.status,
        backgroundImg: headerInfo.backgroundImg,
      });
    }
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Avatar - có thể nhấn */}
      <TouchableOpacity onPress={handleProfilePress}>
        <Image
          source={
            headerInfo.avatar
              ? { uri: headerInfo.avatar }
              : require('../../../assets/icon.png')
          }
          style={styles.headerAvatar}
        />
      </TouchableOpacity>

      {/* Thông tin tên và trạng thái - có thể nhấn */}
      <TouchableOpacity style={styles.headerInfo} onPress={handleProfilePress}>
        <Text style={styles.headerName} numberOfLines={1}>
          {headerInfo.name || headerInfo.phoneNumber || 'Loading...'}
        </Text>
        {!isGroup && (
          <Text style={styles.headerStatus} numberOfLines={1}>
            {headerInfo.status || 'Offline'}
          </Text>
        )}
      </TouchableOpacity>

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
            onPress={() => navigation.navigate('GroupManagementScreen', { conversation })}
          >
            <Feather name="more-vertical" size={24} color="black" />
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