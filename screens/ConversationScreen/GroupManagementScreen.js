import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { getGroupMembers, removeMember, addMembers, searchMembers, updateAdmin } from '../../apis/ConversationAPI';
import { getFriendsList } from '../../apis/FriendsAPI';
import { getToken } from '../../apis/TokenAPI';
import { useUserInfo } from '../../contexts/UserInfoContext';
import { leaveGroup, deleteGroup } from '../../apis/ConversationAPI';

const GroupManagement = ({ route, navigation }) => {
  const { conversation } = route.params;
  const groupDetail = conversation;
  const { userInfo } = useUserInfo();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [isRemoveModalVisible, setIsRemoveModalVisible] = useState(false);
  const [isAddMemberPanelVisible, setIsAddMemberPanelVisible] = useState(false);
  const [isManageMemberPanelVisible, setIsManageMemberPanelVisible] = useState(false);
  const [isLeaveGroupModalVisible, setIsLeaveGroupModalVisible] = useState(false);
  const [isDeleteGroupModalVisible, setIsDeleteGroupModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [newLeader, setNewLeader] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = groupDetail.admins?.includes(userInfo.phoneNumber);
  const isLeader = groupDetail.leader === userInfo.phoneNumber;

  useEffect(() => {
    fetchMembers();
    fetchFriends();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  useEffect(() => {
    if (manageSearchQuery) {
      setFilteredMembers(
        members.filter(member =>
          (member.name?.toLowerCase().includes(manageSearchQuery.toLowerCase()) ||
           member.phoneNumber?.toLowerCase().includes(manageSearchQuery.toLowerCase())) &&
          (isLeader ? true : member.role !== 'LEADER' && member.role !== 'ADMIN' && member.phoneNumber !== userInfo.phoneNumber)
        )
      );
    } else {
      setFilteredMembers(
        members.filter(member =>
          isLeader ? true : member.role !== 'LEADER' && member.role !== 'ADMIN' && member.phoneNumber !== userInfo.phoneNumber
        )
      );
    }
  }, [manageSearchQuery, members]);

  useEffect(() => {
    if (friendSearchQuery) {
      setFilteredFriends(
        friends.filter(friend =>
          (friend.name?.toLowerCase().includes(friendSearchQuery.toLowerCase()) ||
           friend.phoneNumber?.toLowerCase().includes(friendSearchQuery.toLowerCase())) &&
          !members.some(member => member.phoneNumber === friend.phoneNumber)
        )
      );
    } else {
      setFilteredFriends(friends.filter(friend => !members.some(member => member.phoneNumber === friend.phoneNumber)));
    }
  }, [friendSearchQuery, friends, members]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await getGroupMembers(token, groupDetail.id);
      setMembers(response);
      setFilteredMembers(response);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await getFriendsList();
      setFriends(response);
      setFilteredFriends(response.filter(friend => !members.some(member => member.phoneNumber === friend.phoneNumber)));
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè');
    }
  };

  const handleSearch = async () => {
    try {
      const token = await getToken();
      const response = await searchMembers(token, groupDetail.id, searchQuery);
      setFilteredMembers(response);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tìm kiếm thành viên');
    }
  };

  const handleRemoveMember = async () => {
    if (selectedMember.role === 'LEADER') {
      Alert.alert('Lỗi', 'Không thể xóa trưởng nhóm');
      return;
    }
    try {
      const token = await getToken();
      await removeMember(token, groupDetail.id, selectedMember.phoneNumber);
      setMembers(members.filter(member => member.phoneNumber !== selectedMember.phoneNumber));
      setFilteredMembers(filteredMembers.filter(member => member.phoneNumber !== selectedMember.phoneNumber));
      setIsRemoveModalVisible(false);
      Alert.alert('Thành công', 'Đã xóa thành viên');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa thành viên');
    }
  };

  const handleAddMembers = async () => {
    try {
      const token = await getToken();
      await addMembers(token, groupDetail.id, selectedFriends);
      setSelectedFriends([]);
      setIsAddMemberPanelVisible(false);
      fetchMembers();
      Alert.alert('Thành công', 'Đã thêm thành viên');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm thành viên');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const token = await getToken();
      await leaveGroup(token, groupDetail.id, newLeader?.phoneNumber);
      setIsLeaveGroupModalVisible(false);
      navigation.goBack();
      Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể rời khỏi nhóm');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const token = await getToken();
      await deleteGroup(token, groupDetail.id);
      setIsDeleteGroupModalVisible(false);
      navigation.goBack();
      Alert.alert('Thành công', 'Đã xóa nhóm');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể xóa nhóm');
    }
  };

  const toggleFriendSelection = (phoneNumber) => {
    setSelectedFriends(prev =>
      prev.includes(phoneNumber)
        ? prev.filter(id => id !== phoneNumber)
        : [...prev, phoneNumber]
    );
  };

  // Hiển thị vai trò thành viên bằng tiếng Việt
  const renderMemberRole = (role) => {
    switch(role) {
      case 'LEADER': return 'Trưởng nhóm';
      case 'ADMIN': return 'Quản lý';
      case 'MEMBER': return 'Thành viên';
      default: return 'Thành viên';
    }
  };

  const handleAdminChange = async (member) => {
    if (!isLeader || member.role === 'LEADER') return;
    
    try {
      const token = await getToken();
      const isCurrentlyAdmin = member.role === 'ADMIN';
      const message = isCurrentlyAdmin 
        ? `Bạn có chắc muốn hủy quyền quản lý của ${member.name || member.phoneNumber}?` 
        : `Bạn có chắc muốn cấp quyền quản lý cho ${member.name || member.phoneNumber}?`;
      
      Alert.alert(
        isCurrentlyAdmin ? 'Hủy quyền quản lý' : 'Cấp quyền quản lý',
        message,
        [
          {
            text: 'Hủy',
            style: 'cancel'
          },
          {
            text: 'Xác nhận',
            onPress: async () => {
              await updateAdmin(token, groupDetail.id, member.phoneNumber, !isCurrentlyAdmin);
              fetchMembers(); // Refresh member list
              Alert.alert('Thành công', isCurrentlyAdmin 
                ? 'Đã hủy quyền quản lý' 
                : 'Đã cấp quyền quản lý'
              );
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thay đổi quyền quản lý');
    }
  };

  const renderMemberItem = ({ item }) => (
    <TouchableOpacity
      style={styles.memberItem}
      onLongPress={() => {
        if (isAdmin && item.role !== 'LEADER') {
          setSelectedMember(item);
          setIsRemoveModalVisible(true);
        }
      }}
    >
      <Image
        source={item.baseImg ? { uri: item.baseImg } : require('../../assets/icon.png')}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
        <Text style={styles.memberRole}>{renderMemberRole(item.role)}</Text>
      </View>
      {item.role === 'LEADER' && <Ionicons name="star" size={20} color="#FFD700" />}
      {item.role === 'ADMIN' && <Ionicons name="shield-checkmark" size={20} color="#4169E1" />}
      {item.role === 'MEMBER' && <Ionicons name="person" size={20} color="#808080" />}
      {isLeader && item.role !== 'LEADER' && (
        <TouchableOpacity 
          style={styles.adminButton}
          onPress={() => handleAdminChange(item)}
        >
          <Text style={styles.adminButtonText}>{item.role === 'ADMIN' ? 'Hủy quyền' : 'Cấp quyền'}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.memberItem, selectedFriends.includes(item.phoneNumber) && styles.selectedFriend]}
      onPress={() => toggleFriendSelection(item.phoneNumber)}
    >
      <Image
        source={item.baseImg ? { uri: item.baseImg } : require('../../assets/icon.png')}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
      </View>
      {selectedFriends.includes(item.phoneNumber) && (
        <Ionicons name="checkmark-circle" size={20} color="#4169E1" />
      )}
    </TouchableOpacity>
  );

  const renderLeaderSelectionItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.memberItem, newLeader?.phoneNumber === item.phoneNumber && styles.selectedFriend]}
      onPress={() => setNewLeader(item)}
    >
      <Image
        source={item.baseImg ? { uri: item.baseImg } : require('../../assets/icon.png')}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
      </View>
      {newLeader?.phoneNumber === item.phoneNumber && (
        <Ionicons name="checkmark-circle" size={20} color="#4169E1" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý nhóm</Text>
      </View>
      <View style={styles.content}>
        {/* Thông tin nhóm chat */}
        <View style={styles.conversationInfo}>
          <Image
            source={groupDetail.conversationImgUrl ? { uri: groupDetail.conversationImgUrl } : require('../../assets/icon.png')}
            style={styles.conversationAvatar}
          />
          <Text style={styles.conversationName}>{groupDetail.conversationName || 'Nhóm chat'}</Text>
        </View>

        {/* Các nút chức năng */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsAddMemberPanelVisible(true)}
            >
              <Ionicons name="person-add" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.iconButtonText}>Thêm thành viên</Text>
          </View>
          {isAdmin && (
            <View style={styles.buttonWrapper}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsManageMemberPanelVisible(true)}
              >
                <Ionicons name="settings" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.iconButtonText}>Quản lý</Text>
            </View>
          )}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsLeaveGroupModalVisible(true)}
            >
              <Ionicons name="exit" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.iconButtonText}>Rời nhóm</Text>
          </View>
          {isLeader && (
            <View style={styles.buttonWrapper}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsDeleteGroupModalVisible(true)}
              >
                <Ionicons name="trash" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.iconButtonText}>Xóa nhóm</Text>
            </View>
          )}
        </View>

        {/* Danh sách thành viên */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#808080" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm thành viên..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={filteredMembers}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.phoneNumber}
            refreshing={isLoading}
            onRefresh={fetchMembers}
          />
        </View>
      </View>

      {/* Bảng thêm thành viên */}
      <Modal
        visible={isAddMemberPanelVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.panelContainer}>
          <View style={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Thêm thành viên</Text>
              <TouchableOpacity onPress={() => setIsAddMemberPanelVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#808080" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm bạn bè..."
                value={friendSearchQuery}
                onChangeText={setFriendSearchQuery}
              />
            </View>
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.phoneNumber}
              style={styles.friendList}
            />
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { opacity: selectedFriends.length === 0 ? 0.5 : 1 }]}
              onPress={handleAddMembers}
              disabled={selectedFriends.length === 0}
            >
              <Text style={styles.buttonText}>Thêm đã chọn ({selectedFriends.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bảng quản lý thành viên */}
      <Modal
        visible={isManageMemberPanelVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.panelContainer}>
          <View style={styles.panelContent}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Quản lý thành viên</Text>
              <TouchableOpacity onPress={() => setIsManageMemberPanelVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#808080" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm thành viên..."
                value={manageSearchQuery}
                onChangeText={setManageSearchQuery}
              />
            </View>
            <FlatList
              data={filteredMembers}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item.phoneNumber}
              style={styles.friendList}
            />
          </View>
        </View>
      </Modal>

      {/* Xác nhận xóa thành viên */}
      <Modal
        visible={isRemoveModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xóa thành viên</Text>
            <Text>Bạn có chắc muốn xóa {selectedMember?.name || selectedMember?.phoneNumber}?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsRemoveModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.removeButton]}
                onPress={handleRemoveMember}
              >
                <Text style={styles.buttonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Xác nhận rời nhóm */}
      <Modal
        visible={isLeaveGroupModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rời nhóm</Text>
            <Text>Bạn có chắc muốn rời khỏi {groupDetail.conversationName || 'nhóm này'}?</Text>
            {isLeader && (
              <>
                <Text style={styles.modalSubtitle}>Chọn trưởng nhóm mới:</Text>
                <FlatList
                  data={members.filter(member => member.phoneNumber !== userInfo.phoneNumber)}
                  renderItem={renderLeaderSelectionItem}
                  keyExtractor={(item) => item.phoneNumber}
                  style={styles.friendList}
                />
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsLeaveGroupModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.removeButton, { opacity: isLeader && !newLeader ? 0.5 : 1 }]}
                onPress={handleLeaveGroup}
                disabled={isLeader && !newLeader}
              >
                <Text style={styles.buttonText}>Rời nhóm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Xác nhận xóa nhóm */}
      <Modal
        visible={isDeleteGroupModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xóa nhóm</Text>
            <Text>Bạn có chắc muốn xóa {groupDetail.conversationName || 'nhóm này'}? Hành động này không thể hoàn tác.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsDeleteGroupModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.removeButton]}
                onPress={handleDeleteGroup}
              >
                <Text style={styles.buttonText}>Xóa</Text>
              </TouchableOpacity>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  conversationInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  conversationAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  conversationName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    flex: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4169E1',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  iconButtonText: {
    color: '#000',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4169E1',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  confirmButton: {
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedFriend: {
    backgroundColor: '#e6f3ff',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberRole: {
    fontSize: 14,
    color: 'gray',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#808080',
  },
  removeButton: {
    backgroundColor: '#FF0000',
  },
  panelContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panelContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendList: {
    flexGrow: 0,
  },
  adminButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 5,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default GroupManagement;