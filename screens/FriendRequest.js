import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Colors from '../constants/colors';
import { FontAwesome } from '@expo/vector-icons';
import { getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../api/FriendsAPI';
import { initConversation } from '../api/ConversationAPI';
import { text } from '../api/MessageAPI';
import { getToken } from '../api/TokenAPI';

const DEFAULT_AVATAR = 'https://via.placeholder.com/50';

const FriendRequests = ({ navigation }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getFriendRequests();
      setFriendRequests(Array.isArray(data) ? data.filter(item => item && item.phoneNumber) : []);
    } catch (error) {
      console.error('Error loading friend requests:', error.message);
      if (error.message.includes('Unauthorized') || error.message.includes('Không tìm thấy thông tin đăng nhập')) {
        Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.', [
          { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
        ]);
      } else {
        Alert.alert('Lỗi', 'Không thể tải danh sách lời mời kết bạn.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (request) => {
    try {
      await acceptFriendRequest(request.phoneNumber);
      Alert.alert('Thành công', `Đã chấp nhận lời mời kết bạn từ ${request.name || request.phoneNumber}.`);
      const jwt = await getToken();
      const conversation = await initConversation(jwt, request.phoneNumber);  // truyền phoneNumber hoặc id tương ứng
      const conversationId = conversation.id; 
      
      await loadRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời. Vui lòng thử lại.');
    }
  };

  const handleReject = async (phoneNumber) => {
    try {
      await rejectFriendRequest(phoneNumber);
      Alert.alert('Thành công', 'Đã từ chối lời mời kết bạn.');
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Lỗi', 'Không thể từ chối lời mời. Vui lòng thử lại.');
    }
  };

  const renderRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <Image
        source={{ uri: item.baseImg || DEFAULT_AVATAR }}
        style={styles.avatar}
        onError={(e) => console.log('Avatar error:', e.nativeEvent.error)}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name || 'Unknown'}</Text>
        <Text style={styles.phone}>{item.phoneNumber}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAccept(item)}
        >
          <Text style={styles.buttonText}>Chấp nhận</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item.phoneNumber)}
        >
          <Text style={styles.buttonText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <FontAwesome name="arrow-left" style={styles.btnBack} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" style={styles.btnBack} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời kết bạn ({friendRequests.length})</Text>
      </View>
      {friendRequests.length === 0 ? (
        <Text style={styles.emptyText}>Không có lời mời kết bạn.</Text>
      ) : (
        <FlatList
          data={friendRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.phoneNumber}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBack: {
    color: '#000',
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  list: {
    padding: 10,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  info: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  phone: {
    fontSize: 14,
    color: '#7a7a7a',
  },
  actions: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#7a7a7a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FriendRequests;
