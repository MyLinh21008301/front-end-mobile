import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
  Button
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserInfo } from '../contexts/UserInfoContext';
import { getGroupMembers, addMembers, removeMember, updateAdmin } from '../api/ConversationAPI';

const DEFAULT_AVATAR = 'https://via.placeholder.com/50';

const GroupMembersScreen = ({ route }) => {
  const navigation = useNavigation();
  const { userInfo } = useUserInfo();
  const { conversationId, groupName, isLeader, isAdmin, showGrantAdmin = false } = route.params;
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newMembers, setNewMembers] = useState([]);

  // Lấy danh sách thành viên
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
        return;
      }

      const membersData = await getGroupMembers(token, conversationId);
      console.log('fetchMembers - membersData:', membersData);
      setMembers(membersData);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thành viên:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể lấy danh sách thành viên. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm số điện thoại vào danh sách newMembers
  const addPhoneNumber = () => {
    if (!newPhoneNumber || newPhoneNumber.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }

    const phoneRegex = /^\+\d+$/;
    if (!phoneRegex.test(newPhoneNumber)) {
      Alert.alert('Lỗi', 'Số điện thoại phải bắt đầu bằng "+" và chỉ chứa số.');
      return;
    }

    if (newMembers.includes(newPhoneNumber) || members.some((m) => m.phoneNumber === newPhoneNumber)) {
      Alert.alert('Lỗi', 'Số điện thoại này đã có trong nhóm hoặc danh sách thêm.');
      return;
    }

    setNewMembers([...newMembers, newPhoneNumber]);
    setNewPhoneNumber('');
  };

  // Xóa số điện thoại khỏi danh sách newMembers
  const removePhoneNumber = (phone) => {
    setNewMembers(newMembers.filter((p) => p !== phone));
  };

  // Thêm thành viên vào nhóm
  const submitAddMembers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
        return;
      }

      if (newMembers.length === 0) {
        Alert.alert('Lỗi', 'Vui lòng thêm ít nhất một thành viên.');
        return;
      }

      await addMembers(token, conversationId, newMembers);
      Alert.alert('Thành công', 'Thêm thành viên thành công!');
      setAddMemberModalVisible(false);
      setNewMembers([]);
      setNewPhoneNumber('');
      fetchMembers();
    } catch (error) {
      console.error('Lỗi khi thêm thành viên:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể thêm thành viên. Vui lòng thử lại sau.');
    }
  };

  // Xóa thành viên khỏi nhóm
  const handleRemoveMember = (member) => {
    if (!isLeader && !isAdmin) {
      Alert.alert('Lỗi', 'Chỉ admin hoặc leader mới có thể xóa thành viên.');
      return;
    }

    if (member.isLeader) {
      Alert.alert('Lỗi', 'Không thể xóa leader của nhóm.');
      return;
    }

    Alert.alert(
      'Xác nhận xóa thành viên',
      `Bạn có chắc chắn muốn xóa ${member.name || member.phoneNumber} khỏi nhóm?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
                navigation.navigate('LoginScreen');
                return;
              }

              await removeMember(token, conversationId, member.phoneNumber);
              Alert.alert('Thành công', 'Đã xóa thành viên.');
              fetchMembers();
            } catch (error) {
              console.error('Lỗi khi xóa thành viên:', error.response?.data || error.message);
              Alert.alert('Lỗi', 'Không thể xóa thành viên. Vui lòng thử lại sau.');
            }
          },
        },
      ]
    );
  };

  // Cấp/thu hồi quyền admin
  const handleToggleAdmin = (member) => {
    if (!isLeader) {
      Alert.alert('Lỗi', 'Chỉ leader mới có thể cấp/thu hồi quyền admin.');
      return;
    }

    if (member.isLeader) {
      Alert.alert('Lỗi', 'Không thể thay đổi quyền admin của leader.');
      return;
    }

    const action = member.isAdmin ? 'thu hồi' : 'cấp';
    Alert.alert(
      `Xác nhận ${action} quyền admin`,
      `Bạn có muốn ${action} quyền admin cho ${member.name || member.phoneNumber}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: action === 'cấp' ? 'Cấp quyền' : 'Thu hồi',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
                navigation.navigate('LoginScreen');
                return;
              }

              await updateAdmin(token, conversationId, member.phoneNumber, !member.isAdmin);
              Alert.alert('Thành công', `${action === 'cấp' ? 'Cấp' : 'Thu hồi'} quyền admin thành công!`);
              fetchMembers();
            } catch (error) {
              console.error(`Lỗi khi ${action} quyền admin:`, error.response?.data || error.message);
              Alert.alert('Lỗi', `Không thể ${action} quyền admin. Vui lòng thử lại sau.`);
            }
          },
        },
      ]
    );
  };

  // Tải danh sách thành viên khi vào màn hình
  useEffect(() => {
    console.log('GroupMembersScreen - route.params:', route.params);
    fetchMembers();
  }, [conversationId]);

  // Render mỗi thành viên
  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <Image
        source={{ uri: item.baseImg || DEFAULT_AVATAR }}
        style={styles.memberImage}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
        <Text style={styles.memberStatus}>
          {item.isLeader ? 'Leader' : item.isAdmin ? 'Admin' : 'Thành viên'}
          {item.online && ' • Online'}
        </Text>
      </View>
      {(isLeader || isAdmin) && !showGrantAdmin && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveMember(item)}
        >
          <Feather name="x" size={20} color="#FF3B30" />
        </TouchableOpacity>
      )}
      {isLeader && showGrantAdmin && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleToggleAdmin(item)}
        >
          <Text style={styles.actionText}>
            {item.isAdmin ? 'Thu hồi Admin' : 'Cấp Admin'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render mỗi số điện thoại trong danh sách newMembers
  const renderPhoneNumber = (phone, index) => (
    <View key={index} style={styles.phoneItem}>
      <Text style={styles.phoneText}>{phone}</Text>
      <TouchableOpacity onPress={() => removePhoneNumber(phone)}>
        <Feather name='x' size={20} color='#FF3B30' />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name='arrow-back' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{groupName || 'Thành viên nhóm'}</Text>
      </View>

      {(isLeader || isAdmin) && !showGrantAdmin && (
        <TouchableOpacity
          style={styles.addMemberButton}
          onPress={() => setAddMemberModalVisible(true)}
        >
          <Text style={styles.addMemberButtonText}>Thêm thành viên</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator size='large' color='#0A84FF' style={styles.loading} />
      ) : members.length === 0 ? (
        <Text style={styles.emptyText}>Không có thành viên nào.</Text>
      ) : (
        <FlatList
          data={members}
          renderItem={renderMemberItem}
          keyExtractor={(item) => item.phoneNumber}
          style={styles.memberList}
        />
      )}

      {/* Modal thêm thành viên */}
      <Modal
        animationType='slide'
        transparent={true}
        visible={addMemberModalVisible}
        onRequestClose={() => {
          setAddMemberModalVisible(false);
          setNewMembers([]);
          setNewPhoneNumber('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Thêm thành viên</Text>
            <View style={styles.phoneInputContainer}>
              <TextInput
                style={styles.phoneInput}
                placeholder='+84xxxxxxxxx'
                value={newPhoneNumber}
                onChangeText={setNewPhoneNumber}
                keyboardType='phone-pad'
              />
              <TouchableOpacity style={styles.addButton} onPress={addPhoneNumber}>
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>
            {newMembers.length > 0 && (
              <ScrollView style={styles.phoneList}>
                {newMembers.map((phone, index) => renderPhoneNumber(phone, index))}
              </ScrollView>
            )}
            <View style={styles.modalButtons}>
              <Button
                title='Hủy'
                color='#FF3B30'
                onPress={() => {
                  setAddMemberModalVisible(false);
                  setNewMembers([]);
                  setNewPhoneNumber('');
                }}
              />
              <Button title='Lưu' color='#0A84FF' onPress={submitAddMembers} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  addMemberButton: {
    backgroundColor: '#0A84FF',
    padding: 10,
    margin: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addMemberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberList: {
    flex: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  memberStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  actionButton: {
    padding: 10,
  },
  actionText: {
    color: '#0A84FF',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  loading: {
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#0A84FF',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  phoneList: {
    maxHeight: 150,
    marginBottom: 15,
  },
  phoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phoneText: {
    fontSize: 16,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default GroupMembersScreen;