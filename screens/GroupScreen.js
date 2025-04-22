import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Button,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserInfo } from '../contexts/UserInfoContext';
import { useSocket } from '../contexts/SocketContext';
import { initConversation, fetchGroups, createGroup, updateGroupInfo, deleteGroup, leaveGroup } from '../api/ConversationAPI';
import * as ImagePicker from 'expo-image-picker';

const DEFAULT_GROUP_IMAGE = '../assets/icon.png';

const GroupScreen = () => {
  const navigation = useNavigation();
  const { userInfo, setCurrentConversation } = useUserInfo();
  const { conversations } = useSocket();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [participants, setParticipants] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Lấy danh sách nhóm
  const fetchGroupsHandler = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
        return;
      }

      const groupConversations = await fetchGroups(token);
      setGroups(groupConversations);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách nhóm:', error.message, error.response?.data);
      if (error.message.includes('Network Error')) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else if (error.response?.status === 401) {
        Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
      } else {
        Alert.alert('Lỗi', 'Không thể lấy danh sách nhóm. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Thêm số điện thoại vào danh sách participants
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

    if (participants.includes(newPhoneNumber)) {
      Alert.alert('Lỗi', 'Số điện thoại này đã được thêm.');
      return;
    }

    setParticipants([...participants, newPhoneNumber]);
    setNewPhoneNumber('');
  };

  // Xóa số điện thoại khỏi danh sách participants
  const removePhoneNumber = (phone) => {
    setParticipants(participants.filter((p) => p !== phone));
  };

  // Tạo nhóm mới
  const createGroupHandler = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
        return;
      }

      if (!groupName || groupName.trim() === '') {
        Alert.alert('Lỗi', 'Tên nhóm không được để trống.');
        return;
      }

      if (participants.length < 2) {
        Alert.alert('Lỗi', 'Nhóm phải có ít nhất 3 thành viên (bao gồm bạn).');
        return;
      }

      if (!userInfo?.phoneNumber) {
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng.');
        return;
      }

      const participantsWithCreator = [userInfo.phoneNumber, ...participants];
      await createGroup(token, groupName, participantsWithCreator);

      Alert.alert('Thành công', 'Nhóm đã được tạo thành công!');
      setModalVisible(false);
      setGroupName('');
      setParticipants([]);
      setNewPhoneNumber('');
      fetchGroupsHandler();
    } catch (error) {
      console.error('Lỗi khi tạo nhóm:', error.response?.data || error.message);
      if (error.message.includes('Network Error')) {
        Alert.alert('Lỗi kết nối', 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else if (error.response?.status === 400) {
        const errorDetail = error.response?.data?.detail || 'Không thể tạo nhóm.';
        Alert.alert('Lỗi', `${errorDetail} Vui lòng kiểm tra thông tin và thử lại.`);
      } else if (error.response?.status === 401) {
        Alert.alert('Lỗi', 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
      } else {
        Alert.alert('Lỗi', 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    }
  };

  // Xử lý khi nhấn nút tạo nhóm
  const handleCreateGroupPress = () => {
    setModalVisible(true);
  };

  // Xử lý khi nhấn vào một nhóm
  const handleGroupPress = useCallback(
    async (group) => {
      try {
        const jwt = await AsyncStorage.getItem('authToken');
        if (!jwt) {
          Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
          navigation.navigate('LoginScreen');
          return;
        }

        if (!userInfo?.phoneNumber) {
          Alert.alert('Lỗi', 'Thiếu thông tin số điện thoại của bạn.');
          return;
        }

        if (!group?.id) {
          Alert.alert('Lỗi', 'Không tìm thấy ID của nhóm.');
          return;
        }

        const existingConversation = conversations.find(
          (conv) => conv.id === group.id && conv.type === 'GROUP'
        );

        let conversationId = existingConversation ? existingConversation.id : group.id;

        if (!conversationId) {
          Alert.alert('Lỗi', 'Không thể xác định ID của nhóm. Vui lòng thử lại sau.');
          return;
        }

        await initConversation(jwt, conversationId);

        if (typeof setCurrentConversation !== 'function') {
          console.error('setCurrentConversation is not a function:', setCurrentConversation);
          Alert.alert('Lỗi', 'Không thể cập nhật thông tin nhóm do lỗi context. Vui lòng thử lại.');
          navigation.navigate('ConversationScreen', { conversationId });
          return;
        }

        const conversation = {
          id: conversationId,
          name: group.conversationName || 'Nhóm không tên',
          participants: group.participants,
          type: 'GROUP',
          updatedAt: group.updatedAt || new Date().toISOString(),
          conversationImgUrl: group.conversationImgUrl || DEFAULT_GROUP_IMAGE,
          lastMessage: group.lastMessage || null,
          admins: group.admins || [],
          leader: group.leader || null,
        };

        setCurrentConversation(conversation);
        navigation.navigate('ConversationScreen', { conversationId });
      } catch (error) {
        console.error('Lỗi khi mở nhóm:', error.message);
        Alert.alert('Lỗi', 'Không thể mở nhóm. Vui lòng thử lại sau.');
      }
    },
    [navigation, userInfo, setCurrentConversation, conversations]
  );

  // Xử lý khi nhấn vào biểu tượng 3 chấm
  const handleMenuPress = (group) => {
    setSelectedGroup(group);
    setMenuVisible(true);
  };

  // Xử lý xem thành viên nhóm
  const handleViewMembers = () => {
    setMenuVisible(false);
    navigation.navigate('GroupMembersScreen', {
      conversationId: selectedGroup.id,
      groupName: selectedGroup.conversationName,
      isLeader: selectedGroup.leader === userInfo?.phoneNumber,
      isAdmin: selectedGroup.admins.includes(userInfo?.phoneNumber),
    });
  };

  // Xử lý đổi tên nhóm
  const handleRenameGroup = async () => {
    setMenuVisible(false);
    setNewGroupName(selectedGroup.conversationName);
    setRenameModalVisible(true);
  };

  const submitRenameGroup = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        navigation.navigate('LoginScreen');
        return;
      }

      if (!newGroupName || newGroupName.trim() === '') {
        Alert.alert('Lỗi', 'Tên nhóm không được để trống.');
        return;
      }

      await updateGroupInfo(token, selectedGroup.id, newGroupName);
      Alert.alert('Thành công', 'Đổi tên nhóm thành công!');
      setRenameModalVisible(false);
      setNewGroupName('');
      fetchGroupsHandler();
    } catch (error) {
      console.error('Lỗi khi đổi tên nhóm:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Chỉ có admin mới đổi được tên nhóm.');
    }
  };

  // Xử lý cập nhật ảnh nhóm
  const handleUpdateGroupImage = async () => {
    setMenuVisible(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
          navigation.navigate('LoginScreen');
          return;
        }

        await updateGroupInfo(token, selectedGroup.id, selectedGroup.conversationName, result.assets[0]);
        Alert.alert('Thành công', 'Cập nhật ảnh nhóm thành công!');
        fetchGroupsHandler();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật ảnh nhóm:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể cập nhật ảnh nhóm. Vui lòng thử lại sau.');
    }
  };

  // Xử lý xóa nhóm
  const handleDeleteGroup = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Xác nhận xóa nhóm',
      `Bạn có chắc chắn muốn xóa nhóm "${selectedGroup.conversationName}"? Hành động này không thể hoàn tác.`,
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

              await deleteGroup(token, selectedGroup.id);
              Alert.alert('Thành công', 'Nhóm đã được xóa.');
              fetchGroupsHandler();
            } catch (error) {
              console.error('Lỗi khi xóa nhóm:', error.response?.data || error.message);
              Alert.alert('Lỗi', 'Không thể xóa nhóm. Vui lòng thử lại sau.');
            }
          },
        },
      ]
    );
  };

  // Xử lý cấp quyền admin
  const handleGrantAdmin = () => {
    setMenuVisible(false);
    navigation.navigate('GroupMembersScreen', {
      conversationId: selectedGroup.id,
      groupName: selectedGroup.conversationName,
      isLeader: selectedGroup.leader === userInfo?.phoneNumber,
      isAdmin: selectedGroup.admins.includes(userInfo?.phoneNumber),
      showGrantAdmin: true,
    });
  };

  // Xử lý rời nhóm
  const handleLeaveGroup = async () => {
    setMenuVisible(false);
    Alert.alert(
      'Xác nhận rời nhóm',
      `Bạn có chắc chắn muốn rời nhóm "${selectedGroup.conversationName}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (!token) {
                Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
                navigation.navigate('LoginScreen');
                return;
              }

              let newLeaderPhone = null;
              if (selectedGroup.leader === userInfo?.phoneNumber) {
                const otherMembers = selectedGroup.participants.filter(
                  (p) => p !== userInfo.phoneNumber
                );
                if (otherMembers.length > 0) {
                  newLeaderPhone = otherMembers[0]; // Chọn thành viên đầu tiên làm leader mới
                } else {
                  Alert.alert('Lỗi', 'Không thể rời nhóm vì bạn là thành viên duy nhất.');
                  return;
                }
              }

              await leaveGroup(token, selectedGroup.id, newLeaderPhone);
              Alert.alert('Thành công', 'Bạn đã rời nhóm.');
              fetchGroupsHandler();
              navigation.goBack();
            } catch (error) {
              console.error('Lỗi khi rời nhóm:', error.response?.data || error.message);
              Alert.alert('Lỗi', 'Không thể rời nhóm. Vui lòng thử lại sau.');
            }
          },
        },
      ]
    );
  };

  // Tải danh sách nhóm khi màn hình được focus
  useEffect(() => {
    fetchGroupsHandler();
    const unsubscribe = navigation.addListener('focus', fetchGroupsHandler);
    return unsubscribe;
  }, [navigation]);

  // Render mỗi nhóm
  const renderGroupItem = useCallback(
    ({ item }) => (
      <View style={styles.groupItem}>
        <TouchableOpacity style={styles.groupContent} onPress={() => handleGroupPress(item)}>
          <Image
            source={{ uri: item.conversationImgUrl || DEFAULT_GROUP_IMAGE }}
            style={styles.groupImage}
          />
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.conversationName || 'Nhóm không tên'}</Text>
            <Text style={styles.memberCount}>{item.participants?.length || 0} thành viên</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => handleMenuPress(item)}>
          <Feather name="more-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    ),
    [handleGroupPress]
  );

  // Render mỗi số điện thoại trong danh sách participants
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
        <Text style={styles.headerTitle}>Nhóm</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size='large' color='#0A84FF' style={styles.loading} />
      ) : groups.length === 0 ? (
        <Text style={styles.emptyText}>Bạn chưa tham gia nhóm nào.</Text>
      ) : (
        <FlatList
          data={groups}
          renderItem={renderGroupItem}
          keyExtractor={(item) => item.id}
          style={styles.groupList}
        />
      )}

      {/* Modal tạo nhóm mới */}
      <Modal
        animationType='slide'
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setGroupName('');
          setParticipants([]);
          setNewPhoneNumber('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Tạo nhóm mới</Text>
            <TextInput
              style={styles.input}
              placeholder='Tên nhóm'
              value={groupName}
              onChangeText={setGroupName}
            />
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
            {participants.length > 0 && (
              <ScrollView style={styles.phoneList}>
                {participants.map((phone, index) => renderPhoneNumber(phone, index))}
              </ScrollView>
            )}
            <View style={styles.modalButtons}>
              <Button
                title='Hủy'
                color='#FF3B30'
                onPress={() => {
                  setModalVisible(false);
                  setGroupName('');
                  setParticipants([]);
                  setNewPhoneNumber('');
                }}
              />
              <Button title='Tạo nhóm' color='#0A84FF' onPress={createGroupHandler} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal menu 3 chấm */}
      <Modal
        animationType='fade'
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleViewMembers}>
              <Text style={styles.menuItemText}>Xem thành viên</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleRenameGroup}>
              <Text style={styles.menuItemText}>Đổi tên nhóm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleUpdateGroupImage}>
              <Text style={styles.menuItemText}>Cập nhật ảnh nhóm</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteGroup}>
              <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Xóa nhóm</Text>
            </TouchableOpacity>
            {selectedGroup?.leader === userInfo?.phoneNumber && (
              <TouchableOpacity style={styles.menuItem} onPress={handleGrantAdmin}>
                <Text style={styles.menuItemText}>Cấp quyền admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={handleLeaveGroup}>
              <Text style={[styles.menuItemText, { color: '#FF3B30' }]}>Rời nhóm</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal đổi tên nhóm */}
      <Modal
        animationType='slide'
        transparent={true}
        visible={renameModalVisible}
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Đổi tên nhóm</Text>
            <TextInput
              style={styles.input}
              placeholder='Tên nhóm mới'
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={styles.modalButtons}>
              <Button
                title='Hủy'
                color='#FF3B30'
                onPress={() => setRenameModalVisible(false)}
              />
              <Button title='Lưu' color='#0A84FF' onPress={submitRenameGroup} />
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroupPress}>
        <Feather name='plus' size={24} color='#fff' />
      </TouchableOpacity>
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
  groupList: {
    flex: 1,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  groupContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  menuButton: {
    padding: 10,
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
  createGroupButton: {
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
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
  menuOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
    paddingVertical: 10,
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
  },
});

export default GroupScreen;
