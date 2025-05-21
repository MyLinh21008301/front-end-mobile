import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { findPeople, getSavedQueries } from '../apis/FriendsAPI';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedQueries, setSavedQueries] = useState([]);
  const [recentPeople, setRecentPeople] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadSavedData();
  }, []);

  // Tải các tìm kiếm đã lưu và danh sách người xem gần đây từ AsyncStorage.
  const loadSavedData = async () => {
    try {
      const queries = await getSavedQueries();
      const people = await AsyncStorage.getItem('recentPeople');
      setSavedQueries(queries);
      setRecentPeople(people ? JSON.parse(people) : []);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu đã lưu:', error);
    }
  };

  /**
   * Lưu một người vào danh sách người xem gần đây, giới hạn tối đa 100 người.
   * @param {Object} person - Đối tượng người cần lưu
   */
  const saveRecentPerson = async (person) => {
    try {
      const existingPeople = await AsyncStorage.getItem('recentPeople');
      let people = existingPeople ? JSON.parse(existingPeople) : [];

      // Xóa nếu đã tồn tại
      people = people.filter(p => p.phoneNumber !== person.phoneNumber);

      // Thêm vào đầu danh sách
      people.unshift(person);

      // Giới hạn 100 người
      if (people.length > 100) {
        people = people.slice(0, 100);
      }

      await AsyncStorage.setItem('recentPeople', JSON.stringify(people));
      setRecentPeople(people);
    } catch (error) {
      console.error('Lỗi khi lưu người gần đây:', error);
    }
  };

  const handleSearch = async () => {
    // Bỏ qua nếu truy vấn rỗng
    if (!query || query.trim() === '') return;

    setLoading(true);
    setResults([]);

    try {
      const trimmedQuery = query.trim();
      const res = await findPeople(trimmedQuery);
      setResults(res.data || []);

      // Cập nhật trạng thái savedQueries để khớp với logic AsyncStorage
      setSavedQueries(prevQueries => {
        const filteredQueries = prevQueries.filter(q => q !== trimmedQuery);
        const updatedQueries = [trimmedQuery, ...filteredQueries].slice(0, 100);
        return updatedQueries;
      });
    } catch (error) {
      console.error('Lỗi tìm kiếm:', error);
    }

    setLoading(false);
  };

  /**
   * Điều hướng đến trang cá nhân và lưu vào danh sách người xem gần đây.
   * @param {Object} person - Người được chọn
   */
  const handlePersonSelect = (person) => {
    saveRecentPerson(person);
    navigation.navigate('PersonalPageScreen', { person });
  };

  /**
   * Hiển thị một mục người trong kết quả tìm kiếm.
   * @param {Object} param - Dữ liệu mục
   * @param {Object} param.item - Đối tượng người
   */
  const renderPersonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handlePersonSelect(item)}
    >
      <Image
        source={{ uri: item.baseImg }}
        style={styles.avatar}
        resizeMode="cover"
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.phoneNumber}</Text>
        <Text>Trạng thái: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Hiển thị một mục người gần đây với chức năng nhấn giữ để xóa.
   * @param {Object} param - Dữ liệu mục
   * @param {Object} param.item - Đối tượng người
   */
  const renderRecentPersonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handlePersonSelect(item)}
      onLongPress={() => {
        Alert.alert(
          'Xóa người gần đây',
          `Bạn có muốn xóa "${item.name}" khỏi danh sách người đã xem gần đây không?`,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Xóa',
              onPress: async () => {
                try {
                  const existingPeople = await AsyncStorage.getItem('recentPeople');
                  let people = existingPeople ? JSON.parse(existingPeople) : [];
                  people = people.filter(p => p.phoneNumber !== item.phoneNumber);
                  await AsyncStorage.setItem('recentPeople', JSON.stringify(people));
                  setRecentPeople(people);
                } catch (error) {
                  console.error('Lỗi khi xóa người gần đây:', error);
                }
              },
            },
          ]
        );
      }}
    >
      <Image
        source={{ uri: item.baseImg }}
        style={styles.avatar}
        resizeMode="cover"
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.phoneNumber}</Text>
        <Text>Trạng thái: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Hiển thị một mục tìm kiếm đã lưu với chức năng nhấn giữ để xóa.
   * @param {Object} param - Dữ liệu mục
   * @param {string} param.item - Chuỗi truy vấn
   */
  const renderQueryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.queryItem}
      onPress={() => {
        setQuery(item);
        handleSearch();
      }}
      onLongPress={() => {
        Alert.alert(
          'Xóa tìm kiếm gần đây',
          `Bạn có muốn xóa "${item}" khỏi danh sách tìm kiếm gần đây không?`,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Xóa',
              onPress: async () => {
                try {
                  const existingQueries = await AsyncStorage.getItem('searchQueries');
                  let queries = existingQueries ? JSON.parse(existingQueries) : [];
                  queries = queries.filter(q => q !== item);
                  await AsyncStorage.setItem('searchQueries', JSON.stringify(queries));
                  setSavedQueries(queries);
                } catch (error) {
                  console.error('Lỗi khi xóa truy vấn tìm kiếm:', error);
                }
              },
            },
          ]
        );
      }}
    >
      <Text>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TextInput
          placeholder="Nhập số điện thoại hoặc tên..."
          value={query}
          onChangeText={setQuery}
          style={styles.headerInput}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} disabled={loading} style={styles.iconButton}>
          <Ionicons name="search" size={24} color={loading ? '#ccc' : '#000'} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.phoneNumber}
        renderItem={renderPersonItem}
        ListEmptyComponent={
          !loading && results.length === 0 && (
            <Text style={styles.emptyText}>Không tìm thấy kết quả.</Text>
          )
        }
        ListHeaderComponent={loading && <Text>Đang tìm kiếm...</Text>}
        style={styles.resultsList}
      />

      {recentPeople.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Những người đã xem gần đây</Text>
          <FlatList
            data={recentPeople}
            keyExtractor={item => item.phoneNumber}
            renderItem={renderRecentPersonItem}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {savedQueries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
          <FlatList
            data={savedQueries}
            keyExtractor={item => item}
            renderItem={renderQueryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconButton: {
    padding: 4,
  },
  headerInput: {
    flex: 1,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  queryItem: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});