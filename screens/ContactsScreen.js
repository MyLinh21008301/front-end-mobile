import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SectionList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BottomNavBar from '../components/BottomNavBar';
import MainHeader from '../components/MainHeader';
import { getFriendsList, getFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../apis/FriendsAPI';

export default function ContactsScreen() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingRequests, setProcessingRequests] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [requests, friendsList] = await Promise.all([
        getFriendRequests(),
        getFriendsList(),
      ]);
      setFriendRequests(requests);
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (user) => {
    try {
      setProcessingRequests(prev => ({ ...prev, [user.phoneNumber]: 'accepting' }));
      
      // Your API uses phoneNumber for acceptFriendRequest
      await acceptFriendRequest(user.phoneNumber);
      
      // Update local state after successful API call
      setFriendRequests(friendRequests.filter(req => req.phoneNumber !== user.phoneNumber));
      setFriends([...friends, user]);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      alert('Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại.');
    } finally {
      setProcessingRequests(prev => ({ ...prev, [user.phoneNumber]: null }));
    }
  };

  const handleDecline = async (user) => {
    try {
      setProcessingRequests(prev => ({ ...prev, [user.phoneNumber]: 'rejecting' }));
      
      // Your API uses phoneNumber for rejectFriendRequest 
      await rejectFriendRequest(user.phoneNumber);
      
      // Update local state after successful API call
      setFriendRequests(friendRequests.filter(req => req.phoneNumber !== user.phoneNumber));
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      alert('Không thể từ chối lời mời kết bạn. Vui lòng thử lại.');
    } finally {
      setProcessingRequests(prev => ({ ...prev, [user.phoneNumber]: null }));
    }
  };

  const sections = [
    friendRequests.length > 0 && { title: 'Lời mời kết bạn', data: friendRequests },
    friends.length > 0 && { title: 'Bạn bè', data: friends },
  ].filter(Boolean);

  const renderItem = ({ item, section }) => {
    if (section.title === 'Lời mời kết bạn') {
      const isProcessing = processingRequests[item.phoneNumber];
      
      return (
        <View style={styles.requestCard}>
          <Image source={{ uri: item.baseImg }} style={styles.avatar} />
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.name}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, isProcessing && styles.disabledButton]} 
              onPress={() => handleAccept(item)}
              disabled={!!isProcessing}
            >
              {isProcessing === 'accepting' ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Text style={[styles.buttonText, styles.acceptText]}>Đồng ý</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, isProcessing && styles.disabledButton]} 
              onPress={() => handleDecline(item)}
              disabled={!!isProcessing}
            >
              {isProcessing === 'rejecting' ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <Text style={[styles.buttonText, styles.declineText]}>Từ chối</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <TouchableOpacity onPress={() => navigation.navigate('PersonalPageScreen', { person: item })}>
          <View style={styles.friendCard}>
            <Image source={{ uri: item.baseImg }} style={styles.avatar} />
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.status}>{item.online ? '🟢 Trực tuyến' : '⚫ Ngoại tuyến'}</Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  return (
    <View style={styles.container}>
      <MainHeader />
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải danh bạ...</Text>
        </View>
      ) : sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.phoneNumber || index.toString()}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={loadData}
        />
      ) : (
        <Text style={styles.emptyMessage}>Không có bạn bè hoặc lời mời kết bạn</Text>
      )}
      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  list: {
    paddingHorizontal: 16,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    color: 'gray',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  acceptText: {
    color: '#007AFF',
  },
  declineText: {
    color: '#FF3B30',
  },
  emptyMessage: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    padding: 20,
  },
});