import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Colors from '../constants/colors';
import { fetchFriendsList, searchUserByPhone, sendFriendRequest } from '../api/authApi';

const conversations = [
  {
    id: '1',
    name: 'Phạm Thế Mạnh',
    message: 'onl đê',
    time: '54 phút',
    unread: true,
    avatar: '',
  },
  {
    id: '2',
    name: 'Khuê',
    message: 'Chị ơi hôm nay cô kêu em lên...',
    time: '2 giờ',
    unread: true,
    avatar: '',
  },
  {
    id: '3',
    name: 'Hưng',
    message: 'Xu lễ có về không?',
    time: '3 giờ',
    unread: true,
    avatar: '',
  },
  {
    id: '4',
    name: 'Thuu Hiềnn',
    message: 'Bạn: [Hình ảnh]',
    time: '13 giờ',
    unread: false,
    avatar: '',
  },
  {
    id: '5',
    name: 'Có 1 chị gái iêu và 1 em gái Hiề...',
    message: 'Thúy: Mua sứa về ăn hè',
    time: '19 giờ',
    unread: false,
    avatar: '',
  },
  {
    id: '6',
    name: 'Cloud của tôi',
    message: 'Bạn: [Sticker]',
    time: '19 giờ',
    unread: false,
    avatar: '',
  },
  {
    id: '7',
    name: 'Tran Dong',
    message: 'e nhớ tháng 5 xuống đây th...',
    time: '20 giờ',
    unread: true,
    avatar: '',
  },
  {
    id: '8',
    name: 'REACT_DD_CN_10.12_DHKTPM16...',
    message: 'Hải rời khỏi nhóm.',
    time: '',
    unread: false,
    avatar: '',
  },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false); // Thêm trạng thái lời mời
  const [modalVisible, setModalVisible] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const navigation = useNavigation();

  // Lấy danh sách bạn bè
  useEffect(() => {
    fetchFriendsList()
      .then((friends) => setFriendsList(friends))
      .catch(() => Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè.'));
  }, []);

  const handleSearch = async () => {
    if (!search) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }

    try {
      const users = await searchUserByPhone(search);
      if (users && users.length > 0) {
        const user = users[0];
        setSearchResult(user);
        setIsFriend(friendsList.includes(user.phoneNumber));
        setRequestSent(false); // Reset trạng thái lời mời
        setModalVisible(true);
      } else {
        Alert.alert('Thông báo', 'Không tìm thấy người dùng với số điện thoại này.');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
    }
  };

  const handleAddFriend = async () => {
    try {
      await sendFriendRequest(searchResult.phoneNumber);
      setRequestSent(true); // Cập nhật trạng thái sau khi gửi
      Alert.alert('Thành công', 'Đã gửi yêu cầu kết bạn!');
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi khi gửi yêu cầu kết bạn.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Nhập số điện thoại"
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={handleSearch}
        keyboardType="phone-pad"
      />
      <FlatList
        data={conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Image
              source={item.avatar ? { uri: item.avatar } : { uri: 'https://via.placeholder.com/48' }}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
            <View style={styles.rightSection}>
              {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
              {item.unread ? <Badge style={styles.badge}>3</Badge> : null}
            </View>
          </Card>
        )}
      />
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="envelope" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Profile')}>
          <FontAwesome name="user" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="address-book" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal hiển thị kết quả tìm kiếm */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {searchResult && (
              <>
                <Image
                  source={
                    searchResult.baseImg
                      ? { uri: searchResult.baseImg }
                      : { uri: 'https://via.placeholder.com/80' }
                  }
                  style={styles.modalAvatar}
                />
                <Text style={styles.modalName}>{searchResult.name}</Text>
                <Text style={styles.modalPhone}>{searchResult.phoneNumber}</Text>
                <Text style={styles.modalStatus}>{searchResult.online ? 'Đang hoạt động' : 'Offline'}</Text>
                {isFriend ? (
                  <TouchableOpacity style={styles.friendButton}>
                    <FontAwesome name="check" size={20} color="white" />
                    <Text style={styles.friendButtonText}>Bạn bè</Text>
                  </TouchableOpacity>
                ) : requestSent ? (
                  <TouchableOpacity style={styles.requestSentButton} disabled>
                    <Text style={styles.requestSentButtonText}>Đã gửi lời mời kết bạn</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
                    <FontAwesome name="plus" size={20} color="white" />
                    <Text style={styles.addFriendButtonText}>Kết bạn</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Đóng</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    color: '#000',
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  menuContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.btnBackground,
    paddingVertical: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  menuItem: {
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#000',
  },
  modalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  modalPhone: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  modalStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addFriendButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addFriendButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  requestSentButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  requestSentButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  friendButton: {
    flexDirection: 'row',
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  friendButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
});