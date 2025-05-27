// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Alert,
//   ScrollView,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
//   FlatList,
// } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { Feather } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { getFriendsList } from '../apis/FriendsAPI';
// import { createGroupWithImage } from '../apis/ConversationAPI';
// import { getToken } from '../apis/TokenAPI';
// import { useUserInfo } from '../contexts/UserInfoContext';

// const CreateGroupScreen = () => {
//   const navigation = useNavigation();
//   const { userInfo } = useUserInfo();
//   const [groupName, setGroupName] = useState('');
//   const [groupImage, setGroupImage] = useState(null);
//   const [friendsList, setFriendsList] = useState([]);
//   const [selectedMembers, setSelectedMembers] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState('');

//   // Fetch friends list from the API on component mount
//   useEffect(() => {
//     const loadFriends = async () => {
//       setIsLoading(true);
//       try {
//         const friends = await getFriendsList();
//         setFriendsList(friends);
//       } catch (error) {
//         Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè. Vui lòng thử lại.');
//         console.error('Failed to fetch friends:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     loadFriends();

//     // Add current user to participants when screen loads
//     if (userInfo && userInfo.phoneNumber) {
//       setSelectedMembers([userInfo.phoneNumber]);
//     }
//   }, [userInfo]);

//   // Filter friends list based on search query
//   const filteredFriends = friendsList.filter(friend => 
//     (friend.name || friend.phoneNumber).toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   // Handle image selection from gallery
//   const selectImage = async () => {
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập vào ảnh của bạn.');
//       return;
//     }

//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [1, 1],
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       setGroupImage(result.assets[0]);
//     }
//   };

//   // Toggle friend selection for group members
//   const toggleMember = useCallback((phone) => {
//     // Don't allow removing current user
//     if (phone === userInfo?.phoneNumber) {
//       return;
//     }
    
//     setSelectedMembers((prev) =>
//       prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
//     );
//   }, [userInfo]);

//   // Handle group creation with API
//   const handleCreateGroup = async () => {
//     if (!groupName.trim()) {
//       Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm.');
//       return;
//     }
//     if (selectedMembers.length < 2) {
//       Alert.alert('Lỗi', 'Vui lòng chọn ít nhất hai thành viên để tạo nhóm.');
//       return;
//     }

//     setIsLoading(true);
//     try {
        
//       const jwt = await getToken();

//       const result = await createGroupWithImage(jwt, groupName, groupImage, selectedMembers);
//       Alert.alert('Thành công', 'Đã tạo nhóm thành công!');
//       navigation.goBack();
//     } catch (error) {
//       console.error('Group creation error:', error.response?.data || error.message);
//       Alert.alert('Lỗi', `Không thể tạo nhóm: ${error.message || 'Vui lòng thử lại.'}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Find member details by phone number
//   const getMemberDetails = (phone) => {
//     // For current user
//     if (phone === userInfo?.phoneNumber) {
//       return {
//         name: userInfo.name || userInfo.phoneNumber,
//         baseImg: userInfo.baseImg,
//         phoneNumber: userInfo.phoneNumber,
//         isCurrentUser: true
//       };
//     }
//     // For friends
//     return friendsList.find(friend => friend.phoneNumber === phone) || { phoneNumber: phone };
//   };

//   // Render selected member in horizontal list
//   const renderSelectedMember = ({ item }) => {
//     const phone = item;
//     const member = getMemberDetails(phone);
//     return (
//       <View style={styles.selectedMemberItem}>
//         {member.baseImg ? (
//           <Image source={{ uri: member.baseImg }} style={styles.selectedMemberAvatar} />
//         ) : (
//           <View style={styles.selectedMemberAvatarPlaceholder}>
//             <Text style={styles.avatarInitial}>
//               {(member.name || member.phoneNumber).charAt(0).toUpperCase()}
//             </Text>
//           </View>
//         )}
//         <Text style={styles.selectedMemberName} numberOfLines={2} ellipsizeMode="tail">
//           {member.name || member.phoneNumber}
//           {member.isCurrentUser ? ' (Bạn)' : ''}
//         </Text>
//         {!member.isCurrentUser && (
//           <TouchableOpacity
//             style={styles.removeButton}
//             onPress={() => toggleMember(phone)}
//           >
//             <Feather name="x" size={16} color="#FFF" />
//           </TouchableOpacity>
//         )}
//       </View>
//     );
//   };

//   // Render each friend item in the list
//   const renderFriend = ({ item }) => {
//     // Don't show current user in the friends list
//     if (item.phoneNumber === userInfo?.phoneNumber) {
//       return null;
//     }

//     return (
//       <TouchableOpacity
//         style={styles.friendRow}
//         onPress={() => toggleMember(item.phoneNumber)}
//       >
//         <View style={styles.friendDetails}>
//           {item.baseImg ? (
//             <Image source={{ uri: item.baseImg }} style={styles.friendAvatar} />
//           ) : (
//             <View style={styles.avatarPlaceholder}>
//               <Text style={styles.avatarInitial}>
//                 {(item.name || item.phoneNumber).charAt(0).toUpperCase()}
//               </Text>
//             </View>
//           )}
//           <Text style={styles.friendName}>{item.name || item.phoneNumber}</Text>
//         </View>
//         <Feather
//           name={selectedMembers.includes(item.phoneNumber) ? 'check-square' : 'square'}
//           size={20}
//           color={selectedMembers.includes(item.phoneNumber) ? '#1E90FF' : '#888'}
//         />
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       {/* Fixed Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Feather name="arrow-left" size={24} color="#333" />
//         </TouchableOpacity>
//         <Text style={styles.headerText}>Nhóm Mới</Text>
//         <TouchableOpacity onPress={handleCreateGroup} disabled={isLoading}>
//           <Text style={[styles.doneButton, isLoading && styles.disabledButton]}>
//             {isLoading ? 'Đang tạo...' : 'Xong'}
//           </Text>
//         </TouchableOpacity>
//       </View>
      
//       <KeyboardAvoidingView 
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.keyboardAvoid}
//       >
//         <ScrollView 
//           contentContainerStyle={styles.scrollContent}
//           showsVerticalScrollIndicator={true}
//         >
//           {/* Group Name Input */}
//           <View style={styles.section}>
//             <TextInput
//               style={styles.nameInput}
//               placeholder="Nhập tên nhóm"
//               value={groupName}
//               onChangeText={setGroupName}
//               editable={!isLoading}
//             />
//           </View>
          
//           {/* Image Picker */}
//           <TouchableOpacity
//             style={styles.imageSection}
//             onPress={selectImage}
//             disabled={isLoading}
//           >
//             {groupImage ? (
//               <Image source={{ uri: groupImage.uri }} style={styles.groupImage} />
//             ) : (
//               <View style={styles.imagePlaceholder}>
//                 <Feather name="camera" size={30} color="#888" />
//                 <Text style={styles.imageText}>Thêm Ảnh Nhóm</Text>
//               </View>
//             )}
//           </TouchableOpacity>
          
//           {/* Selected Members - Horizontal Scrolling */}
//           <View style={styles.selectedMembersSection}>
//             <Text style={styles.sectionTitle}>
//               Thành viên đã chọn ({selectedMembers.length})
//             </Text>
            
//             <FlatList
//               data={selectedMembers}
//               renderItem={renderSelectedMember}
//               keyExtractor={(item) => item}
//               horizontal
//               showsHorizontalScrollIndicator={false}
//               contentContainerStyle={styles.selectedMembersContainer}
//             />
//           </View>
          
//           {/* Search Box */}
//           <View style={styles.searchSection}>
//             <View style={styles.searchInputContainer}>
//               <Feather name="search" size={18} color="#888" style={styles.searchIcon} />
//               <TextInput
//                 style={styles.searchInput}
//                 placeholder="Tìm kiếm bạn bè theo tên"
//                 value={searchQuery}
//                 onChangeText={setSearchQuery}
//                 clearButtonMode="while-editing"
//               />
//             </View>
//           </View>
          
//           {/* Friend List */}
//           <View style={styles.membersHeader}>
//             <Text style={styles.sectionTitle}>Bạn bè</Text>
//           </View>
//           {isLoading ? (
//             <ActivityIndicator size="large" color="#1E90FF" style={styles.loader} />
//           ) : (
//             filteredFriends.map(friend => renderFriend({ item: friend }))
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#F7F7F7',
//   },
//   keyboardAvoid: {
//     flex: 1,
//   },
//   scrollContent: {
//     paddingBottom: 100,
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//     backgroundColor: '#FFF',
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//     zIndex: 10,
//     elevation: 3, // For Android shadow
//     shadowColor: '#000', // iOS shadow
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   headerText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//   },
//   doneButton: {
//     fontSize: 16,
//     color: '#1E90FF',
//     fontWeight: '500',
//   },
//   disabledButton: {
//     color: '#888',
//   },
//   section: {
//     padding: 15,
//     backgroundColor: '#FFF',
//     marginTop: 10,
//   },
//   nameInput: {
//     borderWidth: 1,
//     borderColor: '#DDD',
//     borderRadius: 8,
//     padding: 10,
//     fontSize: 16,
//     backgroundColor: '#F9F9F9',
//   },
//   imageSection: {
//     alignItems: 'center',
//     padding: 15,
//     backgroundColor: '#FFF',
//     marginTop: 10,
//   },
//   groupImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//   },
//   imagePlaceholder: {
//     alignItems: 'center',
//   },
//   imageText: {
//     marginTop: 5,
//     color: '#888',
//     fontSize: 14,
//   },
//   selectedMembersSection: {
//     backgroundColor: '#FFF',
//     marginTop: 10,
//     paddingTop: 15,
//     paddingBottom: 15,
//   },
//   selectedMembersContainer: {
//     paddingLeft: 15,
//     paddingRight: 15,
//   },
//   selectedMemberItem: {
//     alignItems: 'center',
//     marginRight: 18,
//     width: 70,
//     position: 'relative',
//   },
//   selectedMemberAvatar: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginBottom: 5,
//   },
//   selectedMemberAvatarPlaceholder: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#DDD',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 5,
//   },
//   selectedMemberName: {
//     fontSize: 12,
//     color: '#333',
//     textAlign: 'center',
//     width: '100%',
//     height: 32, // Fixed height to accommodate 2 lines
//   },
//   removeButton: {
//     position: 'absolute',
//     top: 0,
//     right: 5,
//     backgroundColor: '#FF6B6B',
//     borderRadius: 10,
//     width: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   searchSection: {
//     backgroundColor: '#FFF',
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     marginTop: 10,
//   },
//   searchInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#DDD',
//     borderRadius: 8,
//     backgroundColor: '#F9F9F9',
//     paddingHorizontal: 10,
//   },
//   searchIcon: {
//     marginRight: 10,
//   },
//   searchInput: {
//     flex: 1,
//     height: 40,
//     fontSize: 14,
//     padding: 0,
//   },
//   membersHeader: {
//     padding: 15,
//     backgroundColor: '#FFF',
//     marginTop: 0,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     paddingHorizontal: 15,
//     marginBottom: 10,
//   },
//   friendRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     paddingHorizontal: 15,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E0E0E0',
//     backgroundColor: '#FFF',
//   },
//   friendDetails: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   friendAvatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     marginRight: 10,
//   },
//   avatarPlaceholder: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#DDD',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//   },
//   avatarInitial: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#FFF',
//   },
//   friendName: {
//     fontSize: 16,
//     color: '#333',
//   },
//   loader: {
//     marginTop: 20,
//   },
// });

// export default CreateGroupScreen;


import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getFriendsList, findFirstPersonByPhone } from '../apis/FriendsAPI';
import { createGroupWithImage } from '../apis/ConversationAPI';
import { getToken } from '../apis/TokenAPI';
import { useUserInfo } from '../contexts/UserInfoContext';

const CreateGroupScreen = () => {
  const navigation = useNavigation();
  const { userInfo } = useUserInfo();
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [friendsList, setFriendsList] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [addedNonFriends, setAddedNonFriends] = useState([]); // Lưu danh sách người không phải bạn bè

  // Fetch danh sách bạn bè từ API khi component mount
  useEffect(() => {
    const loadFriends = async () => {
      setIsLoading(true);
      try {
        const friends = await getFriendsList();
        setFriendsList(friends);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè. Vui lòng thử lại.');
        console.error('Failed to fetch friends:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFriends();

    // Thêm người dùng hiện tại vào danh sách thành viên khi màn hình tải
    if (userInfo && userInfo.phoneNumber) {
      setSelectedMembers([userInfo.phoneNumber]);
    }
  }, [userInfo]);

  // Xử lý chọn ảnh từ thư viện
  const selectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập vào ảnh của bạn.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setGroupImage(result.assets[0]);
    }
  };

  // Xử lý thêm thành viên bằng số điện thoại
  const handleAddByPhone = async () => {
    if (!phoneInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại.');
      return;
    }

    // Kiểm tra xem số điện thoại đã được thêm chưa
    if (selectedMembers.includes(phoneInput.trim())) {
      Alert.alert('Lỗi', 'Số điện thoại này đã được thêm.');
      setPhoneInput('');
      return;
    }

    setIsLoading(true);
    try {
      const person = await findFirstPersonByPhone(phoneInput.trim());
      if (!person) {
        Alert.alert('Lỗi', 'Không tìm thấy người dùng với số điện thoại này.');
        return;
      }

      // Thêm số điện thoại vào danh sách thành viên
      setSelectedMembers((prev) => [...prev, person.phoneNumber]);
      
      // Lưu thông tin người dùng không phải bạn bè
      setAddedNonFriends((prev) => [
        ...prev,
        {
          phoneNumber: person.phoneNumber,
          name: person.name || person.phoneNumber,
          baseImg: person.baseImg,
        },
      ]);

      Alert.alert('Thành công', `Đã thêm ${person.name || person.phoneNumber} vào nhóm.`);
      setPhoneInput('');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm thành viên. Vui lòng kiểm tra số điện thoại và thử lại.');
      console.error('Error adding member by phone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle chọn bạn bè từ danh sách
  const toggleMember = useCallback((phone) => {
    // Không cho phép xóa người dùng hiện tại
    if (phone === userInfo?.phoneNumber) {
      return;
    }

    setSelectedMembers((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );

    // Cập nhật danh sách người không phải bạn bè khi xóa
    setAddedNonFriends((prev) => prev.filter((p) => p.phoneNumber !== phone));
  }, [userInfo]);

  // Xử lý tạo nhóm với API
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm.');
      return;
    }
    if (selectedMembers.length < 2) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất hai thành viên để tạo nhóm.');
      return;
    }

    setIsLoading(true);
    try {
      const jwt = await getToken();
      await createGroupWithImage(jwt, groupName, groupImage, selectedMembers);
      Alert.alert('Thành công', 'Đã tạo nhóm thành công!');
      navigation.goBack();
    } catch (error) {
      console.error('Group creation error:', error.response?.data || error.message);
      Alert.alert('Lỗi', `Không thể tạo nhóm: ${error.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Tìm thông tin thành viên bằng số điện thoại
  const getMemberDetails = (phone) => {
    // Cho người dùng hiện tại
    if (phone === userInfo?.phoneNumber) {
      return {
        name: userInfo.name || userInfo.phoneNumber,
        baseImg: userInfo.baseImg,
        phoneNumber: userInfo.phoneNumber,
        isCurrentUser: true,
      };
    }
    // Cho bạn bè
    const friend = friendsList.find((f) => f.phoneNumber === phone);
    if (friend) {
      return friend;
    }
    // Cho người không phải bạn bè
    return addedNonFriends.find((p) => p.phoneNumber === phone) || { phoneNumber: phone };
  };

  // Render thành viên đã chọn trong danh sách ngang
  const renderSelectedMember = ({ item }) => {
    const phone = item;
    const member = getMemberDetails(phone);
    return (
      <View style={styles.selectedMemberItem}>
        {member.baseImg ? (
          <Image source={{ uri: member.baseImg }} style={styles.selectedMemberAvatar} />
        ) : (
          <View style={styles.selectedMemberAvatarPlaceholder}>
            <Text style={styles.avatarInitial}>
              {(member.name || member.phoneNumber).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.selectedMemberName} numberOfLines={2} ellipsizeMode="tail">
          {member.name || member.phoneNumber}
          {member.isCurrentUser ? ' (Bạn)' : ''}
        </Text>
        {!member.isCurrentUser && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => toggleMember(phone)}
          >
            <Feather name="x" size={16} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render mỗi bạn bè trong danh sách
  const renderFriend = ({ item }) => {
    // Không hiển thị người dùng hiện tại trong danh sách bạn bè
    if (item.phoneNumber === userInfo?.phoneNumber) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.friendRow}
        onPress={() => toggleMember(item.phoneNumber)}
      >
        <View style={styles.friendDetails}>
          {item.baseImg ? (
            <Image source={{ uri: item.baseImg }} style={styles.friendAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(item.name || item.phoneNumber).charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.friendName}>{item.name || item.phoneNumber}</Text>
        </View>
        <Feather
          name={selectedMembers.includes(item.phoneNumber) ? 'check-square' : 'square'}
          size={20}
          color={selectedMembers.includes(item.phoneNumber) ? '#1E90FF' : '#888'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Nhóm Mới</Text>
        <TouchableOpacity onPress={handleCreateGroup} disabled={isLoading}>
          <Text style={[styles.doneButton, isLoading && styles.disabledButton]}>
            {isLoading ? 'Đang tạo...' : 'Xong'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Nhập tên nhóm */}
          <View style={styles.section}>
            <TextInput
              style={styles.nameInput}
              placeholder="Nhập tên nhóm"
              value={groupName}
              onChangeText={setGroupName}
              editable={!isLoading}
            />
          </View>

          {/* Chọn ảnh nhóm */}
          <TouchableOpacity
            style={styles.imageSection}
            onPress={selectImage}
            disabled={isLoading}
          >
            {groupImage ? (
              <Image source={{ uri: groupImage.uri }} style={styles.groupImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="camera" size={30} color="#888" />
                <Text style={styles.imageText}>Thêm Ảnh Nhóm</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Danh sách thành viên đã chọn */}
          <View style={styles.selectedMembersSection}>
            <Text style={styles.sectionTitle}>
              Thành viên đã chọn ({selectedMembers.length})
            </Text>
            <FlatList
              data={selectedMembers}
              renderItem={renderSelectedMember}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedMembersContainer}
            />
          </View>

          {/* Thêm thành viên bằng số điện thoại */}
          <View style={styles.searchSection}>
            <View style={styles.searchInputContainer}>
              <Feather name="phone" size={18} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Nhập số điện thoại để thêm thành viên"
                value={phoneInput}
                onChangeText={setPhoneInput}
                keyboardType="phone-pad"
                clearButtonMode="while-editing"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddByPhone}
                disabled={isLoading}
              >
                <Text style={styles.addButtonText}>Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Danh sách bạn bè */}
          <View style={styles.membersHeader}>
            <Text style={styles.sectionTitle}>Chọn từ bạn bè</Text>
          </View>
          {isLoading ? (
            <ActivityIndicator size="large" color="#1E90FF" style={styles.loader} />
          ) : (
            friendsList.map((friend) => renderFriend({ item: friend }))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  doneButton: {
    fontSize: 16,
    color: '#1E90FF',
    fontWeight: '500',
  },
  disabledButton: {
    color: '#888',
  },
  section: {
    padding: 15,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  imageSection: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF',
    marginTop: 10,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imageText: {
    marginTop: 5,
    color: '#888',
    fontSize: 14,
  },
  selectedMembersSection: {
    backgroundColor: '#FFF',
    marginTop: 10,
    paddingTop: 15,
    paddingBottom: 15,
  },
  selectedMembersContainer: {
    paddingLeft: 15,
    paddingRight: 15,
  },
  selectedMemberItem: {
    alignItems: 'center',
    marginRight: 18,
    width: 70,
    position: 'relative',
  },
  selectedMemberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
  },
  selectedMemberAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  selectedMemberName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    width: '100%',
    height: 32,
  },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    padding: 0,
  },
  addButton: {
    backgroundColor: '#1E90FF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  membersHeader: {
    padding: 15,
    backgroundColor: '#FFF',
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  friendDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  friendName: {
    fontSize: 16,
    color: '#333',
  },
  loader: {
    marginTop: 20,
  },
});

export default CreateGroupScreen;