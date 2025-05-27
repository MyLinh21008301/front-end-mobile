import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainHeader from '../components/MainHeader';
import BottomNavBar from '../components/BottomNavBar';
import { getFriendsList, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../apis/FriendsAPI';
import { fetchGroups, initConversation } from '../apis/ConversationAPI';
import { getToken } from '../apis/TokenAPI';
import { useUserInfo } from '../contexts/UserInfoContext';
import { useSocket } from '../contexts/SocketContext';
import Colors from '../constants/colors';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dvvvivioo/image/upload/v1745401126/Image_286_qj1u04.jpg'; 

export default function ContactsScreen() {
  const navigation = useNavigation();
  const { userInfo } = useUserInfo();
  const { conversations } = useSocket();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [groups, setGroups] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); 

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Lỗi', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', [
          { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
        ]);
        return;
      }

      const [requests, friendsList, groupsList] = await Promise.all([
        getFriendRequests(),
        getFriendsList(),
        fetchGroups(token),
      ]);

      // Ánh xạ dữ liệu nhóm
      const mappedGroups = groupsList.map(group => ({
        ...group,
        conversationId: group.id,
        name: group.conversationName,
        baseImg: group.conversationImgUrl,
        memberCount: group.participants ? group.participants.length : 0,
      }));

      setFriendRequests(requests);
      setFriendRequestsCount(requests?.length || 0);
      setFriends(friendsList);
      setGroups(mappedGroups);

      const online = friendsList.filter(friend => friend.online);
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

  const groupFriendsByInitial = () => {
    const grouped = {};
    friends.forEach(friend => {
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
      const jwt = await getToken();
      if (!jwt) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
        return;
      }

      if (!friend.phoneNumber || !userInfo?.phoneNumber) {
        Alert.alert('Lỗi', 'Thiếu thông tin số điện thoại để khởi tạo cuộc trò chuyện.');
        return;
      }

      let conversationId = null;
      const targetPhones = [userInfo.phoneNumber, friend.phoneNumber].sort();
      const existingConversation = conversations.find(conv => {
        const convPhones = conv.participants ? conv.participants.sort() : [];
        return (
          convPhones.length === 2 &&
          convPhones[0] === targetPhones[0] &&
          convPhones[1] === targetPhones[1]
        );
      });

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        conversationId = `${targetPhones[0]}_${targetPhones[1]}`;
      }

      console.log('Initializing conversation with:', { conversationId });
      const conversation = await initConversation(jwt, conversationId);
      navigation.navigate('ConversationScreen', { conversationId: conversation.id || conversationId });
    } catch (error) {
      console.error('Lỗi khi tạo hoặc mở cuộc trò chuyện:', error);
      const targetPhones = [userInfo.phoneNumber, friend.phoneNumber].sort();
      const conversationId = `${targetPhones[0]}_${targetPhones[1]}`;
      navigation.navigate('ConversationScreen', { conversationId });
    }
  };

  const handleGroupPress = async (group) => {
    try {
      const jwt = await getToken();
      await initConversation(jwt, group.conversationId);
      navigation.navigate('ConversationScreen', { conversationId: group.conversationId });
    } catch (error) {
      console.error('Không thể khởi tạo cuộc trò chuyện:', error);
      alert('Không thể mở nhóm. Vui lòng thử lại.');
    }
  };

  const handleAcceptRequest = async (user) => {
    try {
      setIsLoading(true);
      await acceptFriendRequest(user.phoneNumber);
      setFriendRequests(prev => prev.filter(req => req.phoneNumber !== user.phoneNumber));
      setFriendRequestsCount(prev => prev - 1);
      setFriends(prev => [...prev, user]);
      setOnlineFriends(prev => user.online ? [...prev, user] : prev);
    } catch (error) {
      console.error('Không thể chấp nhận lời mời:', error);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineRequest = async (user) => {
    try {
      setIsLoading(true);
      await rejectFriendRequest(user.phoneNumber);
      setFriendRequests(prev => prev.filter(req => req.phoneNumber !== user.phoneNumber));
      setFriendRequestsCount(prev => prev - 1);
    } catch (error) {
      console.error('Không thể từ chối lời mời:', error);
      Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn.');
    } finally {
      setIsLoading(false);
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

  const renderGroupItem = ({ item }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => handleGroupPress(item)}>
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.baseImg || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
      </View>
      <View style={styles.groupInfoContainer}>
        <Text style={styles.friendName}>{item.name || 'Nhóm không tên'}</Text>
        <Text style={styles.groupInfo}>
          {item.memberCount ? `${item.memberCount} thành viên` : 'Không có thông tin thành viên'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderOnlineFriends = () => (
    <View style={styles.recentAccessSection}>
      <Text style={styles.sectionTitle}>Mới truy cập {onlineFriends.length}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {onlineFriends.map(friend => (
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

  const renderFriendRequests = () => (
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
      {friendRequests.map(request => (
        <View key={request.phoneNumber} style={styles.requestItem}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: request.baseImg || DEFAULT_AVATAR }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.friendName}>{request.name || 'Unknown'}</Text>
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => handleAcceptRequest(request)}
              disabled={isLoading}
            >
              <Text style={styles.requestButtonText}>Đồng ý</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.requestButton, styles.declineButton]}
              onPress={() => handleDeclineRequest(request)}
              disabled={isLoading}
            >
              <Text style={styles.requestButtonText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <MainHeader />
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Bạn bè</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>Nhóm</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer}>
        {activeTab === 'friends' ? (
          <>
            {onlineFriends.length > 0 && renderOnlineFriends()}
            {renderFriendRequests()}
            <View style={styles.friendsCount}>
              <Text style={styles.countText}>Tất cả {friends.length}</Text>
              <Text style={styles.countText}>Mới truy cập {onlineFriends.length}</Text>
            </View>
            {groupKeys.map(key => (
              <View key={key}>
                <Text style={styles.groupHeader}>{key}</Text>
                <FlatList
                  data={groupedFriends[key]}
                  renderItem={renderFriendItem}
                  keyExtractor={item => item.phoneNumber}
                  scrollEnabled={false}
                />
              </View>
            ))}
          </>
        ) : (
          <View style={styles.groupsSection}>
            <Text style={styles.sectionTitle}>Danh sách nhóm ({groups.length})</Text>
            <FlatList
              data={groups}
              renderItem={renderGroupItem}
              keyExtractor={item => item.conversationId}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.addFriendButton}
        onPress={() => navigation.navigate('SearchScreen')}
      >
        <Feather name="user-plus" size={24} color="#fff" />
      </TouchableOpacity>
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    backgroundColor: Colors.background,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
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
  groupsSection: {
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
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 10,
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  groupInfoContainer: {
    flex: 1,
    marginLeft: 10,
  },
  groupInfo: {
    fontSize: 14,
    color: 'gray',
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
    bottom: 50, 
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