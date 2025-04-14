import { View, Text, TextInput, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { FontAwesome } from '@expo/vector-icons';
import Colors from "../constants/colors"; 

const conversations = [
  { id: '1', name: 'Phạm Thế Mạnh', message: 'onl đê', time: '54 phút', unread: true, avatar: '' },
  { id: '2', name: 'Khuê', message: 'Chị ơi hôm nay cô kêu em lên...', time: '2 giờ', unread: true, avatar: '' },
  { id: '3', name: 'Hưng', message: 'Xu lễ có về không?', time: '3 giờ', unread: true, avatar: '' },
  { id: '4', name: 'Thuu Hiềnn', message: 'Bạn: [Hình ảnh]', time: '13 giờ', unread: false, avatar: '' },
  { id: '5', name: 'Có 1 chị gái iêu và 1 em gái Hiề...', message: 'Thúy: Mua sứa về ăn hè', time: '19 giờ', unread: false, avatar: '' },
  { id: '6', name: 'Cloud của tôi', message: 'Bạn: [Sticker]', time: '19 giờ', unread: false, avatar: '' },
  { id: '7', name: 'Tran Dong', message: 'e nhớ tháng 5 xuống đây th...', time: '20 giờ', unread: true, avatar: '' },
  { id: '8', name: 'REACT_DD_CN_10.12_DHKTPM16...', message: 'Hải rời khỏi nhóm.', time: '', unread: false, avatar: '' },
];

export default function Home() {
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm"
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Image
              source={{ uri: item.avatar }}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
            <View style={styles.rightSection}>
              {item.time ? (
                <Text style={styles.time}>{item.time}</Text>
              ) : null}
              {item.unread ? (
                <Badge style={styles.badge}>3</Badge>
              ) : null}
            </View>
          </Card>
        )}
      />
       <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="envelope" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="user" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <FontAwesome name="address-book" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  timeText: {
    color: 'white',
    fontSize: 24,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#fff",
    color: 'white',
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
    borderRadius: 24, // Đảm bảo avatar có hình tròn
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
});
