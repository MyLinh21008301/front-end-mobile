import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFriendsList, getFriendRequests } from '../api/FriendsAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainHeader from '../components/MainHeader';
import { useUserInfo } from '../contexts/UserInfoContext';
import { useSocket } from '../contexts/SocketContext';
import { initConversation } from '../api/ConversationAPI';
const DEFAULT_AVATAR = '../assets/icon.png';

const Contacts = () => {
  const navigation = useNavigation();
  const { userInfo } = useUserInfo(); 
  const { conversations } = useSocket(); 
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Retrieved token in ContactsScreen:', token);
      if (!token) {
        console.warn('No token found in ContactsScreen');
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', [
          { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
        ]);
        return;
      }

      const [requests, friendsList] = await Promise.all([
        getFriendRequests(),
        getFriendsList(),
      ]);
      setFriendRequests(requests);
      setFriends(friendsList);
      setFriendRequestsCount(requests?.length || 0);
      setFilteredFriends(friendsList);

      const online = friendsList.filter((friend) => friend.online);
      setOnlineFriends(online);
    } catch (error) {
      console.error('Failed to load data:', error.message);
      if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
        Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.', [
          { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const groupFriendsByInitial = () => {
    const grouped = {};
    filteredFriends.forEach((friend) => {
      const initial = friend.name?.[0]?.toUpperCase() || 'Unknown';
      if (!grouped[initial]) {
        grouped[initial] = [];
      }
      grouped[initial].push(friend);
    });
    return grouped;
  };

  const groupedFriends = groupFriendsByInitial();
  const groupKeys = Object.keys(groupedFriends).sort();

  const handleFriendPress = async (friend) => {
    try {
      const jwt = await AsyncStorage.getItem('authToken');
      if (!jwt) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
        return;
      }

      if (!friend.phoneNumber || !userInfo?.phoneNumber) {
        Alert.alert('Lỗi', 'Thiếu thông tin số điện thoại để khởi tạo cuộc trò chuyện.');
        return;
      }

      // Tìm conversation từ SocketContext
      let conversationId = null;
      const targetPhones = [userInfo.phoneNumber, friend.phoneNumber].sort();
      const existingConversation = conversations.find((conv) => {
        const convPhones = conv.participants ? conv.participants.sort() : [];
        return (
          convPhones.length === 2 &&
          convPhones[0] === targetPhones[0] &&
          convPhones[1] === targetPhones[1]
        );
      });

      if (existingConversation) {
        conversationId = existingConversation.id;
        console.log('Found existing conversation from context:', conversationId);
      } else {
        // Nếu không tìm thấy, tạo conversationId thủ công (fallback)
        conversationId = `${targetPhones[0]}_${targetPhones[1]}`;
        console.log('No existing conversation found, generated conversationId:', conversationId);
      }

      console.log('Initializing conversation with:', {
        userPhone: userInfo.phoneNumber,
        friendPhone: friend.phoneNumber,
        jwt: jwt.substring(0, 20) + '...',
        conversationId,
      });

      // Gọi API để khởi tạo hoặc lấy hội thoại
      const conversation = await initConversation(jwt, conversationId);
      console.log('Conversation response:', conversation);

      if (conversation?.id) {
        console.log('Navigating to ConversationScreen with conversationId:', conversation.id);
        navigation.navigate('ConversationScreen', { conversationId: conversation.id });
      } else {
        console.log('Conversation not found, navigating with fallback conversationId:', conversationId);
        navigation.navigate('ConversationScreen', { conversationId });
      }
    } catch (error) {
      console.error('Lỗi khi tạo hoặc mở cuộc trò chuyện:', error);
      // Nếu backend trả về lỗi 400 (Conversation not found), điều hướng với conversationId từ context hoặc thủ công
      const targetPhones = [userInfo.phoneNumber, friend.phoneNumber].sort();
      const conversationId = existingConversation
        ? existingConversation.id
        : `${targetPhones[0]}_${targetPhones[1]}`;
      console.log('Error occurred, navigating with conversationId:', conversationId);
      navigation.navigate('ConversationScreen', { conversationId });
    }
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => handleFriendPress(item)}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.baseImg || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      <Text style={styles.friendName}>{item.name || 'Unknown'}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="phone" size={20} color="#0A84FF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Feather name="video" size={20} color="#0A84FF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderOnlineFriends = () => (
    <View style={styles.recentAccessSection}>
      <Text style={styles.sectionTitle}>Mới truy cập {onlineFriends.length}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {onlineFriends.map((friend) => (
          <TouchableOpacity
            key={friend.phoneNumber}
            style={styles.recentFriend}
            onPress={() => handleFriendPress(friend)}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: friend.baseImg || DEFAULT_AVATAR }}
                style={styles.recentAvatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <Text style={styles.recentFriendName} numberOfLines={1}>
              {friend.name || 'Unknown'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <MainHeader />
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={()=>navigation.navigate('GroupScreen')}>
          <Text style={styles.tabText}>Nhóm</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer}>
        {onlineFriends.length > 0 && renderOnlineFriends()}
        <View style={styles.quickAccess}>
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={() => navigation.navigate('FriendRequests')}
          >
            <View style={styles.quickAccessIcon}>
              <Feather name="user-plus" size={24} color="#fff" />
            </View>
            <Text style={styles.quickAccessText}>
              Lời mời kết bạn ({friendRequestsCount})
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.friendsCount}>
          <Text style={styles.countText}>Tất cả {friends.length}</Text>
          <Text style={styles.countText}>Mới truy cập {onlineFriends.length}</Text>
        </View>
        {groupKeys.map((key) => (
          <View key={key}>
            <Text style={styles.groupHeader}>{key}</Text>
            <FlatList
              data={groupedFriends[key]}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.phoneNumber}
              scrollEnabled={false}
            />
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.addFriendButton} onPress={()=>navigation.navigate('SearchScreen')}>
        <Feather name="user-plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#0A84FF',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#0A84FF',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  recentAccessSection: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recentFriend: {
    alignItems: 'center',
    marginRight: 15,
  },
  recentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  recentFriendName: {
    fontSize: 12,
    marginTop: 5,
    maxWidth: 60,
  },
  quickAccess: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  quickAccessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  quickAccessIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  quickAccessText: {
    fontSize: 16,
    color: '#000',
  },
  friendsCount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  friendName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#000',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  addFriendButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default Contacts;
