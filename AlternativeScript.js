import { View, Text, TextInput, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { FontAwesome } from '@expo/vector-icons';
import Colors from "../constants/colors"; 
import { useNavigation, useRoute } from '@react-navigation/native';
import BottomNavBar from '../components/BottomNavBar';
import MainHeader from '../components/MainHeader';
import useSocket from '../hooks/useSocket';
import {getToken} from '../api/TokenAPI';

const sample_conversations = [
  { id: '1', name: 'Phạm Thế Mạnh', message: 'onl đê', time: '54 phút', unread: true, avatar: '' },
  { id: '2', name: 'Khuê', message: 'Chị ơi hôm nay cô kêu em lên...', time: '2 giờ', unread: true, avatar: '' },
  { id: '3', name: 'Hưng', message: 'Xu lễ có về không?', time: '3 giờ', unread: true, avatar: '' },
  { id: '4', name: 'Thuu Hiềnn', message: 'Bạn: [Hình ảnh]', time: '13 giờ', unread: false, avatar: '' },
  { id: '5', name: 'Có 1 chị gái iêu và 1 em gái Hiề...', message: 'Thúy: Mua sứa về ăn hè', time: '19 giờ', unread: false, avatar: '' },
  { id: '6', name: 'Cloud của tôi', message: 'Bạn: [Sticker]', time: '19 giờ', unread: false, avatar: '' },
  { id: '7', name: 'Tran Dong', message: 'e nhớ tháng 5 xuống đây th...', time: '20 giờ', unread: true, avatar: '' },
  { id: '8', name: 'REACT_DD_CN_10.12_DHKTPM16...', message: 'Hải rời khỏi nhóm.', time: '', unread: false, avatar: '' },
  { id: '9', name: 'Có 1 chị gái iêu và 1 em gái Hiề...', message: 'Thúy: Mua sứa về ăn hè', time: '19 giờ', unread: false, avatar: '' },
  { id: '10', name: 'Cloud của tôi', message: 'Bạn: [Sticker]', time: '19 giờ', unread: false, avatar: '' },
  { id: '11', name: 'Tran Dong', message: 'e nhớ tháng 5 xuống đây th...', time: '20 giờ', unread: true, avatar: '' },
  { id: '12', name: 'REACT_DD_CN_10.12_DHKTPM16...', message: 'Hải rời khỏi nhóm.', time: '', unread: false, avatar: '' },
  
];

export default function ConversationsScreen() {
  const [search, setSearch] = useState('');
  const [jwt, setJwt] = useState(null);
  const navigation = useNavigation();

  // Lấy token bất đồng bộ
  useEffect(() => {
    async function fetchToken() {
      try {
        const token = await getToken(); // Chờ Promise giải quyết
        setJwt(token); // Lưu token vào state
      } catch (error) {
        console.error('Lỗi khi lấy token:', error);
        // Xử lý lỗi: chuyển hướng đến màn hình đăng nhập
        navigation.navigate('Login');
      }
    }
    fetchToken();
  }, [navigation]); // Thêm navigation vào dependencies để tránh cảnh báo

  // Khởi tạo socket chỉ khi jwt có giá trị
  const {conversations, currentConversation } = useSocket(jwt ? 'http://localhost:3002' : null, jwt);


  
  if (!!jwt) {
    // return null; // Hoặc có thể hiển thị một loading spinner nếu cần
    console.log("conversation: {}",conversations)
  }
  return (
    <View style={styles.container}>
      <MainHeader />
      <FlatList
        style={styles.conversationsListContainer}
        // data={conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))}
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Image source={{ uri: sample_conversations[0].avatar }} style={styles.avatar} />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{item.id}</Text>
              <Text style={styles.message}>{item.messages[-1]}</Text>
            </View>
            <View style={styles.rightSection}>
              {item.time ? <Text style={styles.time}>{item.time}</Text> : null}
              {item.unread ? <Badge style={styles.badge}>3</Badge> : null}
            </View>
          </Card>
        )}
        contentContainerStyle={{ paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
      />

      <BottomNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  conversationsListContainer: {
    paddingHorizontal: 16,
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
    backgroundColor: "#000",
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