// import React, { useState, useEffect } from 'react';
// import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Platform } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import AntDesign from '@expo/vector-icons/AntDesign';
// import * as ImagePicker from 'expo-image-picker';
// import { getGroupMembers, addMembers, removeMember, searchMembers, updateAdmin, updateGroupInfo, leaveGroup, deleteGroup, getConversationDetail } from '../../apis/ConversationAPI';
// import { findFirstPersonByPhone } from '../../apis/FriendsAPI';
// import { getToken } from '../../apis/TokenAPI';
// import { useUserInfo } from '../../contexts/UserInfoContext';

// // Định nghĩa avatar mặc định
// const DEFAULT_AVATAR = 'https://res.cloudinary.com/dvvvivioo/image/upload/v1745401126/Image_286_qj1u04.jpg';

// const GroupManagement = ({ route, navigation }) => {
//   const { conversation } = route.params;
//   const [groupDetail, setGroupDetail] = useState(conversation);
//   const { userInfo } = useUserInfo();
//   const [members, setMembers] = useState([]);
//   const [filteredMembers, setFilteredMembers] = useState([]);
//   const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchedUsers, setSearchedUsers] = useState([]);
//   const [selectedPhones, setSelectedPhones] = useState([]);
//   const [newGroupName, setNewGroupName] = useState('');
//   const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
//   const [isRemoveMemberModalVisible, setIsRemoveMemberModalVisible] = useState(false);
//   const [isChangeNameModalVisible, setIsChangeNameModalVisible] = useState(false);
//   const [isLeaveGroupModalVisible, setIsLeaveGroupModalVisible] = useState(false);
//   const [isDeleteGroupModalVisible, setIsDeleteGroupModalVisible] = useState(false);
//   const [selectedMember, setSelectedMember] = useState(null);
//   const [newLeader, setNewLeader] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [groupAvatar, setGroupAvatar] = useState(groupDetail.conversationImgUrl || DEFAULT_AVATAR);

//   const isLeader = groupDetail.leader === userInfo.phoneNumber;
//   const isAdmin = groupDetail.admins?.includes(userInfo.phoneNumber) || isLeader;

//   useEffect(() => {
//     fetchMembers();
//   }, []);

//   useEffect(() => {
//     if (searchQuery) {
//       handleSearch();
//     } else {
//       setFilteredMembers(members);
//     }
//   }, [searchQuery, members]);

//   useEffect(() => {
//     if (phoneSearchQuery) {
//       handlePhoneSearch();
//     } else {
//       setSearchedUsers([]);
//     }
//   }, [phoneSearchQuery]);

//   const fetchMembers = async () => {
//     try {
//       setIsLoading(true);
//       const token = await getToken();
//       const response = await getGroupMembers(token, groupDetail.id);
//       const updatedMembers = response.map(member => ({
//         ...member,
//         role: groupDetail.leader === member.phoneNumber ? 'LEADER' :
//               groupDetail.admins?.includes(member.phoneNumber) ? 'ADMIN' : 'MEMBER',
//       }));
//       setMembers(updatedMembers);
//       setFilteredMembers(updatedMembers);
//     } catch (error) {
//       Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSearch = async () => {
//     try {
//       const token = await getToken();
//       const response = await searchMembers(token, groupDetail.id, searchQuery);
//       const updatedMembers = response.map(member => ({
//         ...member,
//         role: groupDetail.leader === member.phoneNumber ? 'LEADER' :
//               groupDetail.admins?.includes(member.phoneNumber) ? 'ADMIN' : 'MEMBER',
//       }));
//       setFilteredMembers(updatedMembers);
//     } catch (error) {
//       Alert.alert('Lỗi', 'Không thể tìm kiếm thành viên');
//     }
//   };

//   const handlePhoneSearch = async () => {
//     try {
//       const token = await getToken();
//       const response = await findFirstPersonByPhone(phoneSearchQuery);
//       if (response && !members.some(member => member.phoneNumber === response.phoneNumber)) {
//         setSearchedUsers([response]);
//       } else {
//         setSearchedUsers([]);
//         if (response) {
//           Alert.alert('Thông báo', 'Người dùng đã là thành viên của nhóm.');
//         } else {
//           Alert.alert('Thông báo', 'Không tìm thấy người dùng với số điện thoại này.');
//         }
//       }
//     } catch (error) {
//       Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng.');
//     }
//   };

//   const refreshGroupDetail = async () => {
//     try {
//       const token = await getToken();
//       const updatedGroup = await getConversationDetail(token, groupDetail.id);
//       setGroupDetail(updatedGroup);
//       setGroupAvatar(`${updatedGroup.conversationImgUrl || DEFAULT_AVATAR}?t=${Date.now()}`);
//     } catch (error) {
//       console.error('Error refreshing group detail:', error);
//     }
//   };

//   const handleChangeAvatar = async () => {
//     if (!isAdmin) {
//       Alert.alert('Lỗi', 'Chỉ trưởng nhóm hoặc quản lý mới có thể đổi avatar.');
//       return;
//     }

//     try {
//       const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [1, 1],
//         quality: 0.8,
//       });

//       if (!result.canceled && result.assets && result.assets.length > 0) {
//         const imageUri = result.assets[0].uri;
//         const filename = imageUri.split('/').pop();
//         const match = /\.(\w+)$/.exec(filename);
//         const type = match ? `image/${match[1]}` : 'image/jpeg';
//         const imageFile = {
//           uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
//           name: filename,
//           type: type,
//         };

//         setIsLoading(true);
//         const token = await getToken();
//         const response = await updateGroupInfo(token, groupDetail.id, null, imageFile);
//         console.log('Update group info response:', response);
//         await refreshGroupDetail();
//         Alert.alert('Thành công', 'Đã cập nhật avatar nhóm.');
//       }
//     } catch (error) {
//       console.error('Error updating avatar:', error);
//       Alert.alert('Lỗi', error.message || 'Không thể cập nhật avatar nhóm.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleChangeName = async () => {
//     if (!isAdmin) {
//       Alert.alert('Lỗi', 'Chỉ trưởng nhóm hoặc quản lý mới có thể đổi tên nhóm.');
//       return;
//     }
//     if (!newGroupName.trim()) {
//       Alert.alert('Lỗi', 'Tên nhóm không được để trống.');
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const token = await getToken();
//       const response = await updateGroupInfo(token, groupDetail.id, newGroupName.trim(), null);
//       console.log('Update group name response:', response);
//       await refreshGroupDetail();
//       setNewGroupName('');
//       setIsChangeNameModalVisible(false);
//       Alert.alert('Thành công', 'Đã cập nhật tên nhóm.');
//     } catch (error) {
//       console.error('Error updating group name:', error);
//       Alert.alert('Lỗi', error.message || 'Không thể cập nhật tên nhóm.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleRemoveMember = async () => {
//     if (!isAdmin) {
//       Alert.alert('Lỗi', 'Chỉ trưởng nhóm hoặc quản lý mới có thể xóa thành viên.');
//       return;
//     }
//     if (selectedMember.role === 'LEADER') {
//       Alert.alert('Lỗi', 'Không thể xóa trưởng nhóm.');
//       return;
//     }

//     Alert.alert(
//       'Xóa thành viên',
//       `Bạn có chắc muốn xóa ${selectedMember?.name || selectedMember?.phoneNumber} khỏi nhóm?`,
//       [
//         { text: 'Hủy', style: 'cancel' },
//         {
//           text: 'Xóa',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               setIsLoading(true);
//               const token = await getToken();
//               await removeMember(token, groupDetail.id, selectedMember.phoneNumber);
//               setIsRemoveMemberModalVisible(false);
//               await fetchMembers();
//               await refreshGroupDetail();
//               Alert.alert('Thành công', 'Đã xóa thành viên.');
//             } catch (error) {
//               console.error('Error removing member:', error.response?.data || error.message);
//               Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa thành viên.');
//             } finally {
//               setIsLoading(false);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleAddMembers = async () => {
//     if (!isAdmin) {
//       Alert.alert('Lỗi', 'Chỉ trưởng nhóm hoặc quản lý mới có thể thêm thành viên.');
//       return;
//     }
//     if (selectedPhones.length === 0) {
//       Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một số điện thoại để thêm.');
//       return;
//     }
//     try {
//       const token = await getToken();
//       await addMembers(token, groupDetail.id, selectedPhones);
//       setSelectedPhones([]);
//       setPhoneSearchQuery('');
//       setSearchedUsers([]);
//       setIsAddMemberModalVisible(false);
//       await fetchMembers();
//       await refreshGroupDetail();
//       Alert.alert('Thành công', 'Đã thêm thành viên.');
//     } catch (error) {
//       console.error('Error adding members:', error);
//       Alert.alert('Lỗi', error.message || 'Không thể thêm thành viên.');
//     }
//   };

//   const handleToggleAdmin = async (member) => {
//     if (!isLeader) {
//       Alert.alert('Lỗi', 'Chỉ trưởng nhóm mới có thể cấp/hủy quyền quản lý.');
//       return;
//     }
//     if (member.role === 'LEADER') {
//       Alert.alert('Lỗi', 'Không thể thay đổi quyền của trưởng nhóm.');
//       return;
//     }

//     const isCurrentlyAdmin = member.role === 'ADMIN';
//     const action = isCurrentlyAdmin ? 'hủy quyền quản lý' : 'cấp quyền quản lý';
//     Alert.alert(
//       isCurrentlyAdmin ? 'Hủy quyền quản lý' : 'Cấp quyền quản lý',
//       `Bạn có chắc muốn ${action} cho ${member.name || member.phoneNumber}?`,
//       [
//         { text: 'Hủy', style: 'cancel' },
//         {
//           text: 'Xác nhận',
//           onPress: async () => {
//             try {
//               const token = await getToken();
//               await updateAdmin(token, groupDetail.id, member.phoneNumber, !isCurrentlyAdmin);
//               await fetchMembers();
//               await refreshGroupDetail();
//               Alert.alert('Thành công', `Đã ${action} thành công.`);
//             } catch (error) {
//               console.error('Error updating admin:', error);
//               Alert.alert('Lỗi', error.message || `Không thể ${action}.`);
//             }
//           },
//         },
//       ]
//     );
//   };

//   const handleLeaveGroup = async () => {
//     if (isLeader && !newLeader) {
//       Alert.alert('Lỗi', 'Vui lòng chọn trưởng nhóm mới trước khi rời nhóm.');
//       return;
//     }
//     try {
//       const token = await getToken();
//       await leaveGroup(token, groupDetail.id, newLeader?.phoneNumber);
//       setIsLeaveGroupModalVisible(false);
//       navigation.goBack();
//       Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm.');
//     } catch (error) {
//       console.error('Error leaving group:', error);
//       Alert.alert('Lỗi', error.message || 'Không thể rời nhóm.');
//     }
//   };

//   const handleDeleteGroup = async () => {
//     if (!isLeader) {
//       Alert.alert('Lỗi', 'Chỉ trưởng nhóm mới có thể xóa nhóm.');
//       return;
//     }
//     try {
//       const token = await getToken();
//       await deleteGroup(token, groupDetail.id);
//       setIsDeleteGroupModalVisible(false);
//       navigation.goBack();
//       Alert.alert('Thành công', 'Đã xóa nhóm.');
//     } catch (error) {
//       console.error('Error deleting group:', error);
//       Alert.alert('Lỗi', error.message || 'Không thể xóa nhóm.');
//     }
//   };

//   const togglePhoneSelection = (phoneNumber) => {
//     setSelectedPhones(prev =>
//       prev.includes(phoneNumber)
//         ? prev.filter(phone => phone !== phoneNumber)
//         : [...prev, phoneNumber]
//     );
//   };

//   const renderMemberRole = (role) => {
//     switch (role) {
//       case 'LEADER': return 'Trưởng nhóm';
//       case 'ADMIN': return 'Quản lý';
//       case 'MEMBER': return 'Thành viên';
//       default: return 'Thành viên';
//     }
//   };

//   const renderMemberItem = ({ item }) => (
//     <View style={styles.memberItem}>
//       <TouchableOpacity
//         style={styles.memberInfoContainer}
//         onLongPress={() => {
//           if (isAdmin && item.role !== 'LEADER') {
//             setSelectedMember(item);
//             setIsRemoveMemberModalVisible(true);
//           }
//         }}
//       >
//         <Image
//           source={item.baseImg ? { uri: item.baseImg } : require('../../assets/icon.png')}
//           style={styles.memberAvatar}
//         />
//         <View style={styles.memberInfo}>
//           <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
//           <Text style={styles.memberRole}>{renderMemberRole(item.role)}</Text>
//         </View>
//         {(item.role === 'LEADER' || item.role === 'ADMIN') && (
//           <Ionicons name="key" size={20} color="#FFD700" />
//         )}
//         {item.role === 'MEMBER' && (
//           <Ionicons name="person" size={20} color="#808080" />
//         )}
//       </TouchableOpacity>
//       {isLeader && item.role !== 'LEADER' && (
//         <TouchableOpacity
//           style={styles.adminButton}
//           onPress={() => handleToggleAdmin(item)}
//         >
//           <Text style={styles.adminButtonText}>
//             {item.role === 'ADMIN' ? 'Hủy quyền' : 'Cấp quyền'}
//           </Text>
//         </TouchableOpacity>
//       )}
//       {isAdmin && item.role !== 'LEADER' && (
//         <TouchableOpacity
//           style={styles.removeButton}
//           onPress={() => {
//             setSelectedMember(item);
//             setIsRemoveMemberModalVisible(true);
//           }}
//         >
//           <AntDesign name="delete" size={24} color="#FF0000" />
//         </TouchableOpacity>
//       )}
//     </View>
//   );

//   const renderUserItem = ({ item }) => (
//     <TouchableOpacity
//       style={[styles.memberItem, selectedPhones.includes(item.phoneNumber) && styles.selectedFriend]}
//       onPress={() => togglePhoneSelection(item.phoneNumber)}
//     >
//       <Image
//         source={item.baseImg ? { uri: item.baseImg } : require('../../assets/icon.png')}
//         style={styles.memberAvatar}
//       />
//       <View style={styles.memberInfo}>
//         <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
//         <Text style={styles.memberRole}>{item.phoneNumber}</Text>
//       </View>
//       {selectedPhones.includes(item.phoneNumber) && (
//         <Ionicons name="checkmark-circle" size={20} color="#4169E1" />
//       )}
//     </TouchableOpacity>
//   );

//   const renderLeaderSelectionItem = ({ item }) => (
//     <TouchableOpacity
//       style={[styles.memberItem, newLeader?.phoneNumber === item.phoneNumber && styles.selectedFriend]}
//       onPress={() => setNewLeader(item)}
//     >
//       <Image
//         source={item.baseImg ? { uri: item.baseImg } : require('../../assets/icon.png')}
//         style={styles.memberAvatar}
//       />
//       <View style={styles.memberInfo}>
//         <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
//       </View>
//       {newLeader?.phoneNumber === item.phoneNumber && (
//         <Ionicons name="checkmark-circle" size={20} color="#4169E1" />
//       )}
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Quản lý nhóm</Text>
//       </View>
//       <View style={styles.content}>
//         <View style={styles.groupInfo}>
//           <TouchableOpacity onPress={handleChangeAvatar} disabled={!isAdmin}>
//             <Image
//               source={{ uri: groupAvatar }}
//               style={styles.groupAvatar}
//               key={groupAvatar}
//               onError={(e) => console.log('Avatar image error:', e.nativeEvent.error)}
//             />
//             {isAdmin && (
//               <View style={styles.changeAvatarOverlay}>
//                 <Ionicons name="camera" size={20} color="#fff" />
//               </View>
//             )}
//           </TouchableOpacity>
//           <View style={styles.groupNameContainer}>
//             <Text style={styles.groupName}>{groupDetail.conversationName || 'Nhóm chat'}</Text>
//             {isAdmin && (
//               <TouchableOpacity onPress={() => setIsChangeNameModalVisible(true)}>
//                 <Ionicons name="pencil" size={20} color="#4169E1" />
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         <View style={styles.buttonContainer}>
//           <View style={styles.buttonWrapper}>
//             <TouchableOpacity
//               style={styles.iconButton}
//               onPress={() => setIsAddMemberModalVisible(true)}
//               disabled={!isAdmin}
//             >
//               <Ionicons name="person-add" size={24} color="#fff" />
//             </TouchableOpacity>
//             <Text style={styles.iconButtonText}>Thêm thành viên</Text>
//           </View>
//           <View style={styles.buttonWrapper}>
//             <TouchableOpacity
//               style={styles.iconButton}
//               onPress={() => setIsLeaveGroupModalVisible(true)}
//             >
//               <Ionicons name="exit" size={24} color="#fff" />
//             </TouchableOpacity>
//             <Text style={styles.iconButtonText}>Rời nhóm</Text>
//           </View>
//           {isLeader && (
//             <View style={styles.buttonWrapper}>
//               <TouchableOpacity
//                 style={styles.iconButton}
//                 onPress={() => setIsDeleteGroupModalVisible(true)}
//               >
//                 <Ionicons name="trash" size={24} color="#fff" />
//               </TouchableOpacity>
//               <Text style={styles.iconButtonText}>Xóa nhóm</Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
//           <View style={styles.searchContainer}>
//             <Ionicons name="search" size={20} color="#808080" />
//             <TextInput
//               style={styles.searchInput}
//               placeholder="Tìm kiếm thành viên..."
//               value={searchQuery}
//               onChangeText={setSearchQuery}
//             />
//           </View>
//           <FlatList
//             data={filteredMembers}
//             renderItem={renderMemberItem}
//             keyExtractor={(item) => item.phoneNumber}
//             refreshing={isLoading}
//             onRefresh={fetchMembers}
//           />
//         </View>
//       </View>

//       <Modal
//         visible={isAddMemberModalVisible}
//         animationType="slide"
//         transparent={true}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Thêm thành viên</Text>
//               <TouchableOpacity onPress={() => setIsAddMemberModalVisible(false)}>
//                 <Ionicons name="close" size={24} color="#000" />
//               </TouchableOpacity>
//             </View>
//             <View style={styles.searchContainer}>
//               <Ionicons name="search" size={20} color="#808080" />
//               <TextInput
//                 style={styles.searchInput}
//                 placeholder="Nhập số điện thoại..."
//                 value={phoneSearchQuery}
//                 onChangeText={setPhoneSearchQuery}
//                 keyboardType="phone-pad"
//               />
//             </View>
//             <FlatList
//               data={searchedUsers}
//               renderItem={renderUserItem}
//               keyExtractor={(item) => item.phoneNumber}
//               style={styles.friendList}
//             />
//             <TouchableOpacity
//               style={[styles.button, styles.confirmButton, { opacity: selectedPhones.length === 0 ? 0.5 : 1 }]}
//               onPress={handleAddMembers}
//               disabled={selectedPhones.length === 0}
//             >
//               <Text style={styles.buttonText}>Thêm ({selectedPhones.length})</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       <Modal
//         visible={isRemoveMemberModalVisible}
//         transparent={true}
//         animationType="fade"
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Xóa thành viên</Text>
//             <Text>Bạn có chắc muốn xóa {selectedMember?.name || selectedMember?.phoneNumber}?</Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setIsRemoveMemberModalVisible(false)}
//               >
//                 <Text style={styles.buttonText}>Hủy</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.removeButton]}
//                 onPress={handleRemoveMember}
//               >
//                 <Text style={styles.buttonText}>Xóa</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <Modal
//         visible={isChangeNameModalVisible}
//         transparent={true}
//         animationType="fade"
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Đổi tên nhóm</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Nhập tên nhóm mới"
//               value={newGroupName}
//               onChangeText={setNewGroupName}
//             />
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => {
//                   setNewGroupName('');
//                   setIsChangeNameModalVisible(false);
//                 }}
//               >
//                 <Text style={styles.buttonText}>Hủy</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.confirmButton]}
//                 onPress={handleChangeName}
//               >
//                 <Text style={styles.buttonText}>Lưu</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <Modal
//         visible={isLeaveGroupModalVisible}
//         transparent={true}
//         animationType="fade"
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Rời nhóm</Text>
//             <Text>Bạn có chắc muốn rời khỏi {groupDetail.conversationName || 'nhóm này'}?</Text>
//             {isLeader && (
//               <>
//                 <Text style={styles.modalSubtitle}>Chọn trưởng nhóm mới:</Text>
//                 <FlatList
//                   data={members.filter(member => member.phoneNumber !== userInfo.phoneNumber)}
//                   renderItem={renderLeaderSelectionItem}
//                   keyExtractor={(item) => item.phoneNumber}
//                   style={styles.friendList}
//                 />
//               </>
//             )}
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setIsLeaveGroupModalVisible(false)}
//               >
//                 <Text style={styles.buttonText}>Hủy</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.removeButton, { opacity: isLeader && !newLeader ? 0.5 : 1 }]}
//                 onPress={handleLeaveGroup}
//                 disabled={isLeader && !newLeader}
//               >
//                 <Text style={styles.buttonText}>Rời nhóm</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <Modal
//         visible={isDeleteGroupModalVisible}
//         transparent={true}
//         animationType="fade"
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>Xóa nhóm</Text>
//             <Text>Bạn có chắc muốn xóa {groupDetail.conversationName || 'nhóm này'}? Hành động này không thể hoàn tác.</Text>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.cancelButton]}
//                 onPress={() => setIsDeleteGroupModalVisible(false)}
//               >
//                 <Text style={styles.buttonText}>Hủy</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.modalButton, styles.removeButton]}
//                 onPress={handleDeleteGroup}
//               >
//                 <Text style={styles.buttonText}>Xóa</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     padding: 10,
//   },
//   backButton: {
//     padding: 4,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginLeft: 10,
//   },
//   content: {
//     flex: 1,
//     padding: 10,
//   },
//   groupInfo: {
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   groupAvatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginBottom: 10,
//   },
//   changeAvatarOverlay: {
//     position: 'absolute',
//     bottom: 10,
//     right: 0,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 15,
//     padding: 5,
//   },
//   groupNameContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   groupName: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginRight: 10,
//   },
//   section: {
//     flex: 1,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 10,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f0f0',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     marginBottom: 10,
//   },
//   searchInput: {
//     flex: 1,
//     padding: 8,
//     fontSize: 16,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginBottom: 20,
//   },
//   buttonWrapper: {
//     alignItems: 'center',
//   },
//   iconButton: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#4169E1',
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//   },
//   iconButtonText: {
//     color: '#000',
//     fontSize: 12,
//     marginTop: 5,
//     textAlign: 'center',
//   },
//   button: {
//     backgroundColor: '#4169E1',
//     padding: 10,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   confirmButton: {
//     // marginTop: 10,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   memberItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   memberInfoContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   selectedFriend: {
//     backgroundColor: '#e6f3ff',
//   },
//   memberAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 10,
//   },
//   memberInfo: {
//     flex: 1,
//   },
//   memberName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   memberRole: {
//     fontSize: 14,
//     color: 'gray',
//   },
//   adminButton: {
//     backgroundColor: '#4169E1',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     marginRight: 10,
//   },
//   adminButtonText: {
//     color: '#fff',
//     fontSize: 12,
//   },
//   removeButton: {
//     padding: 4,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderRadius: 10,
//     width: '80%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   modalSubtitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginTop: 10,
//     marginBottom: 5,
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     marginTop: 20,
//   },
//   modalButton: {
//     backgroundColor: '#03a848',
//     padding: 10,
//     marginLeft: 10,
//   },
//   cancelButton: {
//     backgroundColor: '#808080',
//   },
//   // removeButton: {
//   //   backgroundColor: '#FF0000',
//   // },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     borderRadius: 8,
//     padding: 10,
//     marginVertical: 10,
//     fontSize: 16,
//   },
//   friendList: {
//     maxHeight: 200,
//     marginBottom: 10,
//   },
// });

// export default GroupManagement;



import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import * as ImagePicker from 'expo-image-picker';
import { getGroupMembers, addMembers, removeMember, searchMembers, updateAdmin, updateGroupInfo, leaveGroup, deleteGroup, getConversationDetail } from '../../apis/ConversationAPI';
import { findFirstPersonByPhone } from '../../apis/FriendsAPI';
import { getToken } from '../../apis/TokenAPI';
import { useUserInfo } from '../../contexts/UserInfoContext';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dvvvivioo/image/upload/v1745401126/Image_286_qj1u04.jpg';

const GroupManagement = ({ route, navigation }) => {
  const { conversation } = route.params;
  const [groupDetail, setGroupDetail] = useState(conversation);
  const { userInfo } = useUserInfo();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [selectedPhones, setSelectedPhones] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isRemoveMemberModalVisible, setIsRemoveMemberModalVisible] = useState(false);
  const [isChangeNameModalVisible, setIsChangeNameModalVisible] = useState(false);
  const [isLeaveGroupModalVisible, setIsLeaveGroupModalVisible] = useState(false);
  const [isDeleteGroupModalVisible, setIsDeleteGroupModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newLeader, setNewLeader] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [groupAvatar, setGroupAvatar] = useState(groupDetail.conversationImgUrl || DEFAULT_AVATAR);

  const isLeader = groupDetail.leader === userInfo.phoneNumber;
  const isAdmin = groupDetail.admins?.includes(userInfo.phoneNumber) || isLeader;

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  useEffect(() => {
    if (phoneSearchQuery) {
      handlePhoneSearch();
    } else {
      setSearchedUsers([]);
    }
  }, [phoneSearchQuery]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await getGroupMembers(token, groupDetail.id);
      const updatedMembers = response.map(member => ({
        ...member,
        role: groupDetail.leader === member.phoneNumber ? 'LEADER' :
              groupDetail.admins?.includes(member.phoneNumber) ? 'ADMIN' : 'MEMBER',
      }));
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const token = await getToken();
      const response = await searchMembers(token, groupDetail.id, searchQuery);
      const updatedMembers = response.map(member => ({
        ...member,
        role: groupDetail.leader === member.phoneNumber ? 'LEADER' :
              groupDetail.admins?.includes(member.phoneNumber) ? 'ADMIN' : 'MEMBER',
      }));
      setFilteredMembers(updatedMembers);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tìm kiếm thành viên');
    }
  };

  const handlePhoneSearch = async () => {
    try {
      const token = await getToken();
      const response = await findFirstPersonByPhone(phoneSearchQuery);
      if (response && !members.some(member => member.phoneNumber === response.phoneNumber)) {
        setSearchedUsers([response]);
      } else {
        setSearchedUsers([]);
        if (response) {
          Alert.alert('Thông báo', 'Người dùng đã là thành viên của nhóm.');
        } else {
          Alert.alert('Thông báo', 'Không tìm thấy người dùng với số điện thoại này.');
        }
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng.');
    }
  };

  const refreshGroupDetail = async () => {
    try {
      const token = await getToken();
      const updatedGroup = await getConversationDetail(token, groupDetail.id);
      setGroupDetail(updatedGroup);
      setGroupAvatar(`${updatedGroup.conversationImgUrl || DEFAULT_AVATAR}?t=${Date.now()}`);
    } catch (error) {
      console.error('Error refreshing group detail:', error);
    }
  };

  const handleChangeAvatar = async () => {
    if (!isAdmin) {
      Alert.alert('Lỗi', 'Chỉ trưởng nhóm hoặc quản lý mới có thể đổi avatar.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        const imageFile = {
          uri: Platform.OS === 'ios' ? imageUri.replace('file://', '') : imageUri,
          name: filename,
          type: type,
        };

        setIsLoading(true);
        const token = await getToken();
        const response = await updateGroupInfo(token, groupDetail.id, null, imageFile);
        await refreshGroupDetail();
        Alert.alert('Thành công', 'Đã cập nhật avatar nhóm.');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật avatar nhóm.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeName = async () => {
    if (!isAdmin) {
      Alert.alert('Lỗi', 'Chỉ trưởng nhóm hoặc quản lý mới có thể đổi tên nhóm.');
      return;
    }
    if (!newGroupName.trim()) {
      Alert.alert('Lỗi', 'Tên nhóm không được để trống.');
      return;
    }

    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await updateGroupInfo(token, groupDetail.id, newGroupName.trim(), null);
      await refreshGroupDetail();
      setNewGroupName('');
      setIsChangeNameModalVisible(false);
      Alert.alert('Thành công', 'Đã cập nhật tên nhóm.');
    } catch (error) {
      console.error('Error updating group name:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật tên nhóm.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!isAdmin) {
      Alert.alert('Lỗi', 'Chỉ trưởng nhóm hoặc quản lý mới có thể xóa thành viên.');
      return;
    }
    if (selectedMember.role === 'LEADER') {
      Alert.alert('Lỗi', 'Không thể xóa trưởng nhóm.');
      return;
    }

    Alert.alert(
      'Xóa thành viên',
      `Bạn có chắc muốn xóa ${selectedMember?.name || selectedMember?.phoneNumber} khỏi nhóm?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const token = await getToken();
              await removeMember(token, groupDetail.id, selectedMember.phoneNumber);
              setIsRemoveMemberModalVisible(false);
              await fetchMembers();
              await refreshGroupDetail();
              Alert.alert('Thành công', 'Đã xóa thành viên.');
            } catch (error) {
              console.error('Error removing member:', error.response?.data || error.message);
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể xóa thành viên.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleAddMembers = async () => {
    // Removed isAdmin check to allow any member to add new members
    if (selectedPhones.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một số điện thoại để thêm.');
      return;
    }
    try {
      const token = await getToken();
      await addMembers(token, groupDetail.id, selectedPhones);
      setSelectedPhones([]);
      setPhoneSearchQuery('');
      setSearchedUsers([]);
      setIsAddMemberModalVisible(false);
      await fetchMembers();
      await refreshGroupDetail();
      Alert.alert('Thành công', 'Đã thêm thành viên.');
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Lỗi', error.message || 'Không thể thêm thành viên.');
    }
  };

  const handleToggleAdmin = async (member) => {
    if (!isLeader) {
      Alert.alert('Lỗi', 'Chỉ trưởng nhóm mới có thể cấp/hủy quyền quản lý.');
      return;
    }
    if (member.role === 'LEADER') {
      Alert.alert('Lỗi', 'Không thể thay đổi quyền của trưởng nhóm.');
      return;
    }

    const isCurrentlyAdmin = member.role === 'ADMIN';
    const action = isCurrentlyAdmin ? 'hủy quyền quản lý' : 'cấp quyền quản lý';
    Alert.alert(
      isCurrentlyAdmin ? 'Hủy quyền quản lý' : 'Cấp quyền quản lý',
      `Bạn có chắc muốn ${action} cho ${member.name || member.phoneNumber}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const token = await getToken();
              await updateAdmin(token, groupDetail.id, member.phoneNumber, !isCurrentlyAdmin);
              await fetchMembers();
              await refreshGroupDetail();
              Alert.alert('Thành công', `Đã ${action} thành công.`);
            } catch (error) {
              console.error('Error updating admin:', error);
              Alert.alert('Lỗi', error.message || `Không thể ${action}.`);
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = async () => {
    if (isLeader && !newLeader) {
      Alert.alert('Lỗi', 'Vui lòng chọn trưởng nhóm mới trước khi rời nhóm.');
      return;
    }
    try {
      const token = await getToken();
      await leaveGroup(token, groupDetail.id, newLeader?.phoneNumber);
      setIsLeaveGroupModalVisible(false);
      navigation.goBack();
      Alert.alert('Thành công', 'Bạn đã rời khỏi nhóm.');
    } catch (error) {
      console.error('Error leaving group:', error);
      Alert.alert('Lỗi', error.message || 'Không thể rời nhóm.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!isLeader) {
      Alert.alert('Lỗi', 'Chỉ trưởng nhóm mới có thể xóa nhóm.');
      return;
    }
    try {
      const token = await getToken();
      await deleteGroup(token, groupDetail.id);
      setIsDeleteGroupModalVisible(false);
      navigation.goBack();
      Alert.alert('Thành công', 'Đã xóa nhóm.');
    } catch (error) {
      console.error('Error deleting group:', error);
      Alert.alert('Lỗi', error.message || 'Không thể xóa nhóm.');
    }
  };

  const togglePhoneSelection = (phoneNumber) => {
    setSelectedPhones(prev =>
      prev.includes(phoneNumber)
        ? prev.filter(phone => phone !== phoneNumber)
        : [...prev, phoneNumber]
    );
  };

  const renderMemberRole = (role) => {
    switch (role) {
      case 'LEADER': return 'Trưởng nhóm';
      case 'ADMIN': return 'Quản lý';
      case 'MEMBER': return 'Thành viên';
      default: return 'Thành viên';
    }
  };

  const renderMemberItem = ({ item }) => (
    <View style={styles.memberItem}>
      <TouchableOpacity
        style={styles.memberInfoContainer}
        onLongPress={() => {
          if (isAdmin && item.role !== 'LEADER') {
            setSelectedMember(item);
            setIsRemoveMemberModalVisible(true);
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
        {(item.role === 'LEADER' || item.role === 'ADMIN') && (
          <Ionicons name="key" size={20} color="#FFD700" />
        )}
        {item.role === 'MEMBER' && (
          <Ionicons name="person" size={20} color="#808080" />
        )}
      </TouchableOpacity>
      {isLeader && item.role !== 'LEADER' && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => handleToggleAdmin(item)}
        >
          <Text style={styles.adminButtonText}>
            {item.role === 'ADMIN' ? 'Hủy quyền' : 'Cấp quyền'}
          </Text>
        </TouchableOpacity>
      )}
      {isAdmin && item.role !== 'LEADER' && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => {
            setSelectedMember(item);
            setIsRemoveMemberModalVisible(true);
          }}
        >
          <AntDesign name="delete" size={24} color="#FF0000" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.memberItem, selectedPhones.includes(item.phoneNumber) && styles.selectedFriend]}
      onPress={() => togglePhoneSelection(item.phoneNumber)}
    >
      <Image
        source={item.baseImg ? { uri: item.baseImg } : require('../../assets/icon.png')}
        style={styles.memberAvatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name || item.phoneNumber}</Text>
        <Text style={styles.memberRole}>{item.phoneNumber}</Text>
      </View>
      {selectedPhones.includes(item.phoneNumber) && (
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
        <View style={styles.groupInfo}>
          <TouchableOpacity onPress={handleChangeAvatar} disabled={!isAdmin}>
            <Image
              source={{ uri: groupAvatar }}
              style={styles.groupAvatar}
              key={groupAvatar}
              onError={(e) => console.log('Avatar image error:', e.nativeEvent.error)}
            />
            {isAdmin && (
              <View style={styles.changeAvatarOverlay}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.groupNameContainer}>
            <Text style={styles.groupName}>{groupDetail.conversationName || 'Nhóm chat'}</Text>
            {isAdmin && (
              <TouchableOpacity onPress={() => setIsChangeNameModalVisible(true)}>
                <Ionicons name="pencil" size={20} color="#4169E1" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsAddMemberModalVisible(true)}
              // Removed disabled={!isAdmin} to allow all members to add new members
            >
              <Ionicons name="person-add" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.iconButtonText}>Thêm thành viên</Text>
          </View>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thành viên ({members.length})</Text>
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

      <Modal
        visible={isAddMemberModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm thành viên</Text>
              <TouchableOpacity onPress={() => setIsAddMemberModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#808080" />
              <TextInput
                style={styles.searchInput}
                placeholder="Nhập số điện thoại..."
                value={phoneSearchQuery}
                onChangeText={setPhoneSearchQuery}
                keyboardType="phone-pad"
              />
            </View>
            <FlatList
              data={searchedUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.phoneNumber}
              style={styles.friendList}
            />
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { opacity: selectedPhones.length === 0 ? 0.5 : 1 }]}
              onPress={handleAddMembers}
              disabled={selectedPhones.length === 0}
            >
              <Text style={styles.buttonText}>Thêm ({selectedPhones.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isRemoveMemberModalVisible}
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
                onPress={() => setIsRemoveMemberModalVisible(false)}
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

      <Modal
        visible={isChangeNameModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi tên nhóm</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập tên nhóm mới"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewGroupName('');
                  setIsChangeNameModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleChangeName}
              >
                <Text style={styles.buttonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  groupInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  changeAvatarOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 5,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 10,
  },
  section: {
    flex: 1,
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
    alignItems: 'center',
  },
  confirmButton: {
    // marginTop: 10,
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
  memberInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  adminButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  removeButton: {
    padding: 4,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: '#03a848',
    padding: 10,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#808080',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    fontSize: 16,
  },
  friendList: {
    maxHeight: 200,
    marginBottom: 10,
  },
});

export default GroupManagement;