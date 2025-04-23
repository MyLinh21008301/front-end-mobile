import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSocket } from '../../contexts/SocketContext';
import { useUserInfo } from '../../contexts/UserInfoContext';
import { findFirstPersonByPhone } from '../../apis/FriendsAPI';
import Colors from '../../constants/colors';
import MessageItem from './components/MessageItemComponent';
import ConversationHeader from './components/ConversationHeaderComponent';
import MessageInput from './components/MessageInputComponent';

const ConversationScreen = ({ navigation }) => {
  const { currentConversation } = useSocket();
  const { userInfo } = useUserInfo();
  const [participantsInfo, setParticipantsInfo] = useState({});
  const [headerInfo, setHeaderInfo] = useState(null);
  const flatListRef = useRef(null);

  const messages = currentConversation?.messageDetails || [];
  const myInfo = userInfo;

  React.useEffect(() => {
    const fetchParticipantsInfo = async () => {
      if (currentConversation && myInfo?.phoneNumber) {
        const participants = currentConversation.participants
          .filter((p) => p !== myInfo.phoneNumber);

        try {
          const participantsData = await Promise.all(
            participants.map((phone) =>
              findFirstPersonByPhone(phone).catch(() => null)
            )
          );
          const participantsInfoMap = participants.reduce(
            (acc, phone, index) => {
              const data = participantsData[index];
              acc[phone] = data || { phoneNumber: phone };
              return acc;
            },
            {}
          );
          setParticipantsInfo(participantsInfoMap);

          if (currentConversation.type === 'private') {
            const friendPhone = participants[0];
            const friendInfo = participantsInfoMap[friendPhone];
            setHeaderInfo({ ...friendInfo, conversation: currentConversation });
          } else {
            setHeaderInfo({
              name: currentConversation.conversationName,
              avatar: currentConversation.conversationImgUrl,
              isGroup: true,
              conversation: currentConversation,
            });
          }
        } catch (error) {
          console.error('Error fetching participants info:', error);
          if (currentConversation.type === 'private') {
            const friendPhone = participants[0];
            setHeaderInfo({ phoneNumber: friendPhone, conversation: currentConversation });
          } else {
            setHeaderInfo({
              name: 'Group',
              avatar: null,
              isGroup: true,
              conversation: currentConversation,
            });
          }
        }
      }
    };
    fetchParticipantsInfo();
  }, [currentConversation, myInfo]);

  // Scroll to bottom when messages change (new message received)
  useEffect(() => {
    if (messages.length > 0) {
      jumpToBottom();
    }
  }, [messages]);

  const jumpToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ConversationHeader navigation={navigation} headerInfo={headerInfo} />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MessageItem
            item={item}
            myInfo={myInfo}
            participantsInfo={participantsInfo}
          />
        )}
        contentContainerStyle={styles.messageList}
        onLayout={jumpToBottom}
      />
      <MessageInput
        conversationId={currentConversation?.id}
        onMessageSent={jumpToBottom}
      />
    </KeyboardAvoidingView>
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
});

export default ConversationScreen;