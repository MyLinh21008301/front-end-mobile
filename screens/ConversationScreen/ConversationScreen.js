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

const ConversationScreen = ({ navigation }) => {
  const { currentConversation } = useSocket();
  const { userInfo } = useUserInfo();
  const { hideAllReactionPickers } = useReactionPicker();
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [headerInfo, setHeaderInfo] = useState(null);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const flatListRef = useRef(null);

  const messages = currentConversation?.messageDetails || [];
  const myInfo = userInfo;

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

  React.useEffect(() => {
    const fetchParticipantsInfo = async () => {
      if (!currentConversation || !myInfo?.phoneNumber) return;

      setIsLoadingParticipants(true);
      try {
        const participants = currentConversation.participants.filter((p) => p !== myInfo.phoneNumber);
        const initialParticipantsInfo = participants.reduce((acc, phone) => {
          acc[phone] = { phoneNumber: phone, name: phone };
          return acc;
        }, {});
        initialParticipantsInfo[myInfo.phoneNumber] = { ...myInfo, name: myInfo.name || myInfo.phoneNumber };
        setParticipantsInfo(initialParticipantsInfo);

        if (participants.length > 0) {
          const participantsData = await Promise.all(
            participants.map(async (phone) => {
              try {
                const data = await findFirstPersonByPhone(phone);
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
              updatedParticipantsInfo[phone] = { ...data, name: data.name || data.phoneNumber || phone };
            }
          });
          setParticipantsInfo(updatedParticipantsInfo);

          if (currentConversation.type === 'private') {
            const friendPhone = participants[0];
            const friendInfo = updatedParticipantsInfo[friendPhone];
            setHeaderInfo({ ...friendInfo, conversation: currentConversation, isGroup: false });
          } else {
            setHeaderInfo({
              name: currentConversation.conversationName || 'Group Chat',
              avatar: currentConversation.conversationImgUrl,
              isGroup: true,
              conversation: currentConversation,
            });
          }
        } else {
          if (currentConversation.type === 'private') {
            setHeaderInfo({
              name: 'Unknown User',
              phoneNumber: 'Unknown',
              conversation: currentConversation,
              isGroup: false,
            });
          } else {
            setHeaderInfo({
              name: currentConversation.conversationName || 'Group Chat',
              avatar: currentConversation.conversationImgUrl,
              isGroup: true,
              conversation: currentConversation,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching participants info:', error);
        if (currentConversation.type === 'private') {
          const participants = currentConversation.participants.filter((p) => p !== myInfo.phoneNumber);
          const friendPhone = participants[0] || 'Unknown';
          setHeaderInfo({ phoneNumber: friendPhone, name: friendPhone, conversation: currentConversation, isGroup: false });
        } else {
          setHeaderInfo({
            name: currentConversation.conversationName || 'Group Chat',
            avatar: currentConversation.conversationImgUrl,
            isGroup: true,
            conversation: currentConversation,
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