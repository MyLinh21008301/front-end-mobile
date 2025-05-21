import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  sendFriendRequest,
  acceptFriendRequest,
  checkFriendStatus,
  cancelFriendRequest,
  removeFriend,
  getFriendRequests,
  rejectFriendRequest,
  checkRequestStatus,
} from '../apis/FriendsAPI';

export default function PersonalPageScreen({ route, navigation }) {
  const { person } = route.params;
  const [friendStatus, setFriendStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Set navigation header options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerTitle: 'Hồ sơ',
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  // Load initial friend status when the component mounts or person.phoneNumber changes
  useEffect(() => {
    const loadFriendStatus = async () => {
      try {
        setLoading(true);
        const myPhoneNumber = await AsyncStorage.getItem('phoneNumber');
        console.log('My phone number:', myPhoneNumber);
        console.log('Person phone number:', person.phoneNumber);

        if (myPhoneNumber === person.phoneNumber) {
          setFriendStatus('self');
          console.log('Friend status set to self');
          return;
        }

        const isFriend = await checkFriendStatus(person.phoneNumber);
        console.log('checkFriendStatus result:', isFriend);
        if (isFriend) {
          setFriendStatus('friends');
          console.log('Friend status set to friends');
          return;
        }

        const hasSentRequest = await checkRequestStatus(person.phoneNumber);
        console.log('checkRequestStatus result:', hasSentRequest);
        if (hasSentRequest) {
          setFriendStatus('pending_sent');
          console.log('Friend status set to pending_sent');
          return;
        }

        const requests = await getFriendRequests();
        console.log('getFriendRequests result:', requests);
        const incoming = requests.find((req) => req.phoneNumber === person.phoneNumber);
        setFriendStatus(incoming ? 'pending_received' : null);
        console.log('Friend status set to:', incoming ? 'pending_received' : null);
      } catch (error) {
        console.error('Error loading friend status:', error);
        Alert.alert('Lỗi', 'Không thể tải trạng thái bạn bè.');
      } finally {
        setLoading(false);
      }
    };

    loadFriendStatus();
  }, [person.phoneNumber]);

  // Action handlers with immediate state updates
  const handleSendFriendRequest = async () => {
    try {
      await sendFriendRequest(person.phoneNumber);
      setFriendStatus('pending_sent');
      console.log('Friend request sent, status updated to pending_sent');
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn.');
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      await acceptFriendRequest(person.phoneNumber);
      setFriendStatus('friends');
      console.log('Friend request accepted, status updated to friends');
      Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn!');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn.');
    }
  };

  const handleCancelFriendRequest = async () => {
    try {
      await cancelFriendRequest(person.phoneNumber);
      setFriendStatus(null);
      console.log('Friend request canceled, status updated to null');
      Alert.alert('Thành công', 'Đã hủy lời mời kết bạn!');
    } catch (error) {
      console.error('Error canceling friend request:', error);
      Alert.alert('Lỗi', 'Không thể hủy lời mời kết bạn.');
    }
  };

  const handleDeclineFriendRequest = async () => {
    try {
      await rejectFriendRequest(person.phoneNumber);
      setFriendStatus(null);
      console.log('Friend request declined, status updated to null');
      Alert.alert('Đã từ chối', 'Đã từ chối lời mời kết bạn.');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn.');
    }
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Xóa bạn bè',
      `Bạn có chắc chắn muốn xóa ${person.name || 'người này'} khỏi danh sách bạn bè?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(person.phoneNumber);
              setFriendStatus(null);
              setShowDropdown(false);
              console.log('Friend removed, status updated to null');
              Alert.alert('Thành công', 'Đã xóa bạn bè!');
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Lỗi', 'Không thể xóa bạn bè.');
            }
          },
        },
      ]
    );
  };

  // Render friend buttons based on friendStatus
  const renderFriendButton = () => {
    console.log('Rendering friend button with friendStatus:', friendStatus);
    if (loading) {
      return <Text style={styles.buttonText}>Đang tải...</Text>;
    }
    if (friendStatus === 'self') {
      return null;
    }

    return (
      <View style={styles.friendButtonContainer}>
        {friendStatus === 'friends' ? (
          <View style={{ alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.friendButton, styles.friendsButton]}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={styles.buttonText}>Bạn bè</Text>
              <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#fff"
                style={styles.dropdownArrow}
              />
            </TouchableOpacity>
            {showDropdown && (
              <TouchableOpacity
                style={[styles.dropdownItem, { marginTop: 5 }]}
                onPress={handleRemoveFriend}
              >
                <Text style={styles.dropdownText}>Hủy kết bạn</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : friendStatus === 'pending_sent' ? (
          <TouchableOpacity
            style={[styles.friendButton, styles.pendingButton]}
            onPress={handleCancelFriendRequest}
          >
            <Text style={styles.buttonText}>Hủy lời mời</Text>
          </TouchableOpacity>
        ) : friendStatus === 'pending_received' ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.friendButton, styles.acceptButton]}
              onPress={handleAcceptFriendRequest}
            >
              <Text style={styles.buttonText}>Đồng ý</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.friendButton, styles.declineButton]}
              onPress={handleDeclineFriendRequest}
            >
              <Text style={styles.buttonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.friendButton, styles.addButton]}
            onPress={handleSendFriendRequest}
          >
            <Text style={styles.buttonText}>Kết bạn</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render profile info item
  const renderProfileInfoItem = (iconName, label, value) => {
    if (!value) return null;
    
    return (
      <View style={styles.infoItem}>
        <Ionicons name={iconName} size={22} color="#666" style={styles.infoIcon} />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Main render
  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundContainer}>
          {person.backgroundImg ? (
            <Image
              source={{ uri: person.backgroundImg }}
              style={styles.backgroundImg}
              resizeMode="cover"
              onError={(e) => console.log('Background image error:', e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.backgroundPlaceholder} />
          )}
        </View>

        <View style={styles.profileContainer}>
          <Image
            source={{ uri: person.baseImg }}
            style={styles.avatar}
            resizeMode="cover"
            defaultSource={require('../assets/icon.png')}
            onError={(e) => console.log('Avatar image error:', e.nativeEvent.error)}
          />

          <Text style={styles.name}>{person.name || 'Không xác định'}</Text>
          <Text style={styles.phone}>{person.phoneNumber || 'N/A'}</Text>

          {renderFriendButton()}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            
            {renderProfileInfoItem('person', 'Họ và tên', person.name)}
            {renderProfileInfoItem('calendar', 'Ngày sinh', formatDate(person.dateOfBirth))}
            {renderProfileInfoItem('male-female', 'Giới tính', 
              person.male !== undefined ? (person.male ? 'Nam' : 'Nữ') : 'N/A'
            )}
            {renderProfileInfoItem('document-text', 'Giới thiệu', person.bio)}
            {renderProfileInfoItem('time', 'Trạng thái', person.status)}
            {renderProfileInfoItem('time-outline', 'Hoạt động gần đây', 
              person.lastOnlineTime ? new Date(person.lastOnlineTime).toLocaleString('vi-VN') : 'N/A'
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backgroundContainer: {
    width: '100%',
    height: 280,
  },
  backgroundImg: {
    width: '100%',
    height: '100%',
  },
  backgroundPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ccc',
  },
  profileContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -70,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#fff',
    marginBottom: 15,
    backgroundColor: '#eee',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
  },
  phone: {
    fontSize: 16,
    color: '#888',
    marginBottom: 12,
  },
  infoSection: {
    marginTop: 25,
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    paddingHorizontal: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 10,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  friendButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  friendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#007bff',
  },
  pendingButton: {
    backgroundColor: '#6c757d',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    flex: 1,
  },
  declineButton: {
    backgroundColor: '#dc3545',
    flex: 1,
  },
  friendsButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    paddingRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownArrow: {
    marginLeft: 8,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#dc3545',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 12,
  },
  headerButton: {
    marginLeft: 10,
  },
});