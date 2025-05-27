// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import {
//   View,
//   FlatList,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   Text,
//   TouchableWithoutFeedback,
// } from 'react-native';
// import { useSocket } from '../../contexts/SocketContext';
// import { useUserInfo } from '../../contexts/UserInfoContext';
// import { useReactionPicker } from '../../contexts/ReactionPickerContext';
// import { findFirstPersonByPhone } from '../../apis/FriendsAPI';
// import Colors from '../../constants/colors';
// import MessageItem from './components/MessageItemComponent';
// import ConversationHeader from './components/ConversationHeaderComponent';
// import MessageInput from './components/MessageInputComponent';

// const ConversationScreen = ({ navigation }) => {
//   const { currentConversation } = useSocket();
//   const { userInfo } = useUserInfo();
//   const { hideAllReactionPickers } = useReactionPicker();
//   const [participantsInfo, setParticipantsInfo] = useState({});
//   const [headerInfo, setHeaderInfo] = useState(null);
//   const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
//   const [replyToMessage, setReplyToMessage] = useState(null);
//   const flatListRef = useRef(null);

//   const messages = currentConversation?.messageDetails || [];
//   const myInfo = userInfo;

//   const messageMap = useMemo(() => {
//     return messages.reduce((acc, msg) => {
//       acc[msg.id] = msg;
//       return acc;
//     }, {});
//   }, [messages]);

//   const scrollToMessage = (message) => {
//     const index = messages.findIndex((msg) => msg.id === message.id);
//     if (index !== -1 && flatListRef.current) {
//       flatListRef.current.scrollToIndex({ index, animated: true });
//     } else {
//       console.warn('Message not found or FlatList not ready');
//     }
//   };

//   const handleReplyPressed = (message) => {
//     setReplyToMessage(message);
//   };

//   const handleCancelReply = () => {
//     setReplyToMessage(null);
//   };
//   useEffect(() => {
//     const fetchParticipantsInfo = async () => {
//       if (!currentConversation || !myInfo?.phoneNumber) return;
  
//       setIsLoadingParticipants(true);
//       try {
//         const participants = currentConversation.participants.filter((p) => p !== myInfo.phoneNumber);
//         const initialParticipantsInfo = participants.reduce((acc, phone) => {
//           acc[phone] = { phoneNumber: phone, name: phone };
//           return acc;
//         }, {});
//         initialParticipantsInfo[myInfo.phoneNumber] = { ...myInfo, name: myInfo.name || myInfo.phoneNumber };
//         setParticipantsInfo(initialParticipantsInfo);
  
//         if (participants.length > 0) {
//           const participantsData = await Promise.all(
//             participants.map(async (phone) => {
//               try {
//                 const data = await findFirstPersonByPhone(phone);
//                 console.log(`API response for ${phone}:`, data); // Log để debug
//                 return { phone, data };
//               } catch (error) {
//                 console.warn(`Failed to fetch info for ${phone}:`, error);
//                 return { phone, data: null };
//               }
//             })
//           );
  
//           const updatedParticipantsInfo = { ...initialParticipantsInfo };
//           participantsData.forEach(({ phone, data }) => {
//             if (data) {
//               updatedParticipantsInfo[phone] = {
//                 phoneNumber: data.phoneNumber || phone,
//                 name: data.name || phone,
//                 avatar: data.baseImg || null,
//                 status: data.status || 'Offline',
//                 backgroundImg: data.backgroundImg || null,
//                 dateOfBirth: data.dateOfBirth || null,
//                 male: data.male !== undefined ? data.male : null,
//                 bio: data.bio || null,
//                 lastOnlineTime: data.lastOnlineTime || null,
//               };
//             } else {
//               updatedParticipantsInfo[phone] = {
//                 phoneNumber: phone,
//                 name: phone,
//                 avatar: null,
//                 status: 'Offline',
//                 backgroundImg: null,
//                 dateOfBirth: null,
//                 male: null,
//                 bio: null,
//                 lastOnlineTime: null,
//               };
//             }
//           });
//           setParticipantsInfo(updatedParticipantsInfo);
  
//           if (currentConversation.type === 'PRIVATE') {
//             const friendPhone = participants[0];
//             const friendInfo = updatedParticipantsInfo[friendPhone] || {
//               phoneNumber: friendPhone,
//               name: friendPhone,
//               avatar: null,
//               status: 'Offline',
//               backgroundImg: null,
//               dateOfBirth: null,
//               male: null,
//               bio: null,
//               lastOnlineTime: null,
//             };
//             console.log('Setting headerInfo for PRIVATE:', friendInfo); // Log để debug
//             setHeaderInfo({
//               phoneNumber: friendInfo.phoneNumber,
//               name: friendInfo.name,
//               avatar: friendInfo.avatar || currentConversation.conversationImgUrl,
//               status: friendInfo.status,
//               backgroundImg: friendInfo.backgroundImg,
//               dateOfBirth: friendInfo.dateOfBirth,
//               male: friendInfo.male,
//               bio: friendInfo.bio,
//               lastOnlineTime: friendInfo.lastOnlineTime,
//               conversation: currentConversation,
//               isGroup: false, // Sửa isGroup
//             });
//           } else {
//             console.log('Setting headerInfo for GROUP'); // Log để debug
//             setHeaderInfo({
//               name: currentConversation.conversationName || 'Group Chat',
//               avatar: currentConversation.conversationImgUrl,
//               conversation: currentConversation,
//               isGroup: true,
//             });
//           }
//         } else {
//           console.warn('No participants found for conversation:', currentConversation.id);
//           if (currentConversation.type === 'PRIVATE') {
//             setHeaderInfo({
//               phoneNumber: 'Unknown',
//               name: 'Unknown User',
//               avatar: null,
//               status: 'Offline',
//               backgroundImg: null,
//               dateOfBirth: null,
//               male: null,
//               bio: null,
//               lastOnlineTime: null,
//               conversation: currentConversation,
//               isGroup: false,
//             });
//           } else {
//             setHeaderInfo({
//               name: currentConversation.conversationName || 'Group Chat',
//               avatar: currentConversation.conversationImgUrl,
//               conversation: currentConversation,
//               isGroup: true,
//             });
//           }
//         }
//       } catch (error) {
//         console.error('Error fetching participants info:', error);
//         if (currentConversation.type === 'PRIVATE') {
//           const participants = currentConversation.participants.filter((p) => p !== myInfo.phoneNumber);
//           const friendPhone = participants[0] || 'Unknown';
//           setHeaderInfo({
//             phoneNumber: friendPhone,
//             name: friendPhone,
//             avatar: null,
//             status: 'Offline',
//             backgroundImg: null,
//             dateOfBirth: null,
//             male: null,
//             bio: null,
//             lastOnlineTime: null,
//             conversation: currentConversation,
//             isGroup: false,
//           });
//         } else {
//           setHeaderInfo({
//             name: currentConversation.conversationName || 'Group Chat',
//             avatar: currentConversation.conversationImgUrl,
//             conversation: currentConversation,
//             isGroup: true,
//           });
//         }
//       } finally {
//         setIsLoadingParticipants(false);
//       }
//     };
//     fetchParticipantsInfo();
//   }, [currentConversation, myInfo]);

//   useEffect(() => {
//     if (messages.length > 0) jumpToBottom();
//   }, [messages]);

//   const jumpToBottom = () => {
//     setTimeout(() => {
//       flatListRef.current?.scrollToEnd({ animated: true });
//     }, 100);
//   };

//   const EmptyConversation = () => (
//     <View style={styles.emptyContainer}>
//       <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
//       <Text style={styles.emptySubText}>Hãy bắt đầu cuộc trò chuyện</Text>
//     </View>
//   );

//   const renderMessageItem = ({ item }) => (
//     <MessageItem
//       item={item}
//       myInfo={myInfo}
//       participantsInfo={participantsInfo}
//       messageMap={messageMap}
//       onReplyPressed={handleReplyPressed}
//     />
//   );

//   return (
//     <TouchableWithoutFeedback onPress={hideAllReactionPickers}>
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
//       >
//         <ConversationHeader navigation={navigation} headerInfo={headerInfo} isLoading={isLoadingParticipants} />
//         <FlatList
//           ref={flatListRef}
//           data={messages}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={renderMessageItem}
//           contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyMessageList]}
//           onLayout={messages.length > 0 ? jumpToBottom : null}
//           ListEmptyComponent={EmptyConversation}
//           removeClippedSubviews={false}
//           initialNumToRender={20}
//           maxToRenderPerBatch={10}
//           windowSize={10}
//           getItemLayout={(data, index) => ({ length: 100, offset: 100 * index, index })}
//         />
//   <MessageInput
//     conversationId={currentConversation?.id}
//     onMessageSent={jumpToBottom}
//     participantsInfo={participantsInfo}
//     replyToMessage={replyToMessage}
//     onCancelReply={handleCancelReply}
//   />
// </KeyboardAvoidingView>
// </TouchableWithoutFeedback>
//     );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.background,
//   },
//   messageList: {
//     padding: 16,
//     paddingBottom: 20,
//   },
//   emptyMessageList: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: Colors.textPrimary || '#333',
//     marginBottom: 8,
//   },
//   emptySubText: {
//     fontSize: 14,
//     color: Colors.textSecondary || '#777',
//   },
// });

// export default ConversationScreen;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSocket } from '../../contexts/SocketContext';
import { useUserInfo } from '../../contexts/UserInfoContext';
import { useReactionPicker } from '../../contexts/ReactionPickerContext';
import { findFirstPersonByPhone } from '../../apis/FriendsAPI';
import Colors from '../../constants/colors';
import MessageItem from './components/MessageItemComponent';
import ConversationHeader from './components/ConversationHeaderComponent';
import MessageInput from './components/MessageInputComponent';

const DEFAULT_AVATAR = 'https://res.cloudinary.com/dvvvivioo/image/upload/v1745401126/Image_286_qj1u04.jpg';

const ConversationScreen = ({ navigation }) => {
  const { currentConversation } = useSocket();
  const { userInfo } = useUserInfo();
  const { hideAllReactionPickers } = useReactionPicker();
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [headerInfo, setHeaderInfo] = useState(null);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const flatListRef = useRef(null);

  // Chuẩn hóa myInfo để có avatar
  const myInfo = useMemo(() => ({
    ...userInfo,
    avatar: userInfo?.baseImg || userInfo?.avatar || DEFAULT_AVATAR,
    baseImg: userInfo?.baseImg || userInfo?.avatar || DEFAULT_AVATAR, // Giữ baseImg để tương thích
  }), [userInfo]);

  const messages = currentConversation?.messageDetails || [];
  
  const messageMap = useMemo(() => {
    return messages.reduce((acc, msg) => {
      acc[msg.id] = msg;
      return acc;
    }, {});
  }, [messages]);

  const scrollToMessage = (message) => {
    const index = messages.findIndex((msg) => msg.id === message.id);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true });
    } else {
      console.warn('Message not found or FlatList not ready');
    }
  };

  const handleReplyPressed = (message) => {
    setReplyToMessage(message);
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  useEffect(() => {
    const fetchParticipantsInfo = async () => {
      if (!currentConversation || !myInfo?.phoneNumber) return;

      setIsLoadingParticipants(true);
      try {
        const participants = currentConversation.participants.filter((p) => p !== myInfo.phoneNumber);
        const initialParticipantsInfo = participants.reduce((acc, phone) => {
          acc[phone] = {
            phoneNumber: phone,
            name: phone,
            avatar: DEFAULT_AVATAR,
            baseImg: DEFAULT_AVATAR, // Thêm để tương thích
          };
          return acc;
        }, {});
        initialParticipantsInfo[myInfo.phoneNumber] = {
          ...myInfo,
          name: myInfo.name || myInfo.phoneNumber,
          avatar: myInfo.avatar, // Sử dụng myInfo.avatar
          baseImg: myInfo.baseImg, // Sử dụng myInfo.baseImg
        };
        setParticipantsInfo(initialParticipantsInfo);

        if (participants.length > 0) {
          const participantsData = await Promise.all(
            participants.map(async (phone) => {
              try {
                const data = await findFirstPersonByPhone(phone);
                console.log(`API response for ${phone}:`, data);
                return { phone, data };
              } catch (error) {
                console.warn(`Failed to fetch info for ${phone}:`, error);
                return { phone, data: null };
              }
            })
          );

          const updatedParticipantsInfo = { ...initialParticipantsInfo };
          participantsData.forEach(({ phone, data }) => {
            if (data) {
              updatedParticipantsInfo[phone] = {
                phoneNumber: data.phoneNumber || phone,
                name: data.name || phone,
                avatar: data.baseImg || DEFAULT_AVATAR,
                baseImg: data.baseImg || DEFAULT_AVATAR,
                status: data.status || 'Offline',
                backgroundImg: data.backgroundImg || null,
                dateOfBirth: data.dateOfBirth || null,
                male: data.male !== undefined ? data.male : null,
                bio: data.bio || null,
                lastOnlineTime: data.lastOnlineTime || null,
              };
            } else {
              updatedParticipantsInfo[phone] = {
                phoneNumber: phone,
                name: phone,
                avatar: DEFAULT_AVATAR,
                baseImg: DEFAULT_AVATAR,
                status: 'Offline',
                backgroundImg: null,
                dateOfBirth: null,
                male: null,
                bio: null,
                lastOnlineTime: null,
              };
            }
          });
          console.log('Updated participantsInfo:', updatedParticipantsInfo);
          setParticipantsInfo(updatedParticipantsInfo);

          if (currentConversation.type === 'PRIVATE') {
            const friendPhone = participants[0];
            const friendInfo = updatedParticipantsInfo[friendPhone] || {
              phoneNumber: friendPhone,
              name: friendPhone,
              avatar: DEFAULT_AVATAR,
              baseImg: DEFAULT_AVATAR,
              status: 'Offline',
              backgroundImg: null,
              dateOfBirth: null,
              male: null,
              bio: null,
              lastOnlineTime: null,
            };
            console.log('Setting headerInfo for PRIVATE:', friendInfo);
            setHeaderInfo({
              phoneNumber: friendInfo.phoneNumber,
              name: friendInfo.name,
              avatar: friendInfo.avatar || currentConversation.conversationImgUrl || DEFAULT_AVATAR,
              status: friendInfo.status,
              backgroundImg: friendInfo.backgroundImg,
              dateOfBirth: friendInfo.dateOfBirth,
              male: friendInfo.male,
              bio: friendInfo.bio,
              lastOnlineTime: friendInfo.lastOnlineTime,
              conversation: currentConversation,
              isGroup: false,
            });
          } else {
            console.log('Setting headerInfo for GROUP');
            setHeaderInfo({
              name: currentConversation.conversationName || 'Group Chat',
              avatar: currentConversation.conversationImgUrl || DEFAULT_AVATAR,
              conversation: currentConversation,
              isGroup: true,
            });
          }
        } else {
          console.warn('No participants found for conversation:', currentConversation.id);
          if (currentConversation.type === 'PRIVATE') {
            setHeaderInfo({
              phoneNumber: 'Unknown',
              name: 'Unknown User',
              avatar: DEFAULT_AVATAR,
              baseImg: DEFAULT_AVATAR,
              status: 'Offline',
              backgroundImg: null,
              dateOfBirth: null,
              male: null,
              bio: null,
              lastOnlineTime: null,
              conversation: currentConversation,
              isGroup: false,
            });
          } else {
            setHeaderInfo({
              name: currentConversation.conversationName || 'Group Chat',
              avatar: currentConversation.conversationImgUrl || DEFAULT_AVATAR,
              conversation: currentConversation,
              isGroup: true,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching participants info:', error);
        if (currentConversation.type === 'PRIVATE') {
          const participants = currentConversation.participants.filter((p) => p !== myInfo.phoneNumber);
          const friendPhone = participants[0] || 'Unknown';
          setHeaderInfo({
            phoneNumber: friendPhone,
            name: friendPhone,
            avatar: DEFAULT_AVATAR,
            baseImg: DEFAULT_AVATAR,
            status: 'Offline',
            backgroundImg: null,
            dateOfBirth: null,
            male: null,
            bio: null,
            lastOnlineTime: null,
            conversation: currentConversation,
            isGroup: false,
          });
        } else {
          setHeaderInfo({
            name: currentConversation.conversationName || 'Group Chat',
            avatar: currentConversation.conversationImgUrl || DEFAULT_AVATAR,
            conversation: currentConversation,
            isGroup: true,
          });
        }
      } finally {
        setIsLoadingParticipants(false);
      }
    };
    fetchParticipantsInfo();
  }, [currentConversation, myInfo]);

  useEffect(() => {
    if (messages.length > 0) jumpToBottom();
  }, [messages]);

  const jumpToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const EmptyConversation = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
      <Text style={styles.emptySubText}>Hãy bắt đầu cuộc trò chuyện</Text>
    </View>
  );

  const renderMessageItem = ({ item }) => (
    <MessageItem
      item={item}
      myInfo={myInfo}
      participantsInfo={participantsInfo}
      messageMap={messageMap}
      onReplyPressed={handleReplyPressed}
    />
  );

  return (
    <TouchableWithoutFeedback onPress={hideAllReactionPickers}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ConversationHeader navigation={navigation} headerInfo={headerInfo} isLoading={isLoadingParticipants} />
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyMessageList]}
          onLayout={messages.length > 0 ? jumpToBottom : null}
          ListEmptyComponent={EmptyConversation}
          removeClippedSubviews={false}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          getItemLayout={(data, index) => ({ length: 100, offset: 100 * index, index })}
        />
        <MessageInput
          conversationId={currentConversation?.id}
          onMessageSent={jumpToBottom}
          participantsInfo={participantsInfo}
          replyToMessage={replyToMessage}
          onCancelReply={handleCancelReply}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyMessageList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary || '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: Colors.textSecondary || '#777',
  },
});

export default ConversationScreen;