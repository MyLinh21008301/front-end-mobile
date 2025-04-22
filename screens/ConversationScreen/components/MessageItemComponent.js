
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Video, Audio } from 'expo-av';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recallMessage, addReaction } from '../../../api/MessageAPI';

// Định nghĩa danh sách emoji cho reaction
const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎'];

// Định nghĩa các loại file
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'];
const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mpeg'];
const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv'];
const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

// Hàm lấy phần mở rộng file
const getFileExtension = (url) => {
  if (!url) return '';
  const parts = url.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase();
};

// Hàm lấy tên file
const getFileName = (url) => {
  if (!url) return 'Unknown file';
  const parts = url.split('/');
  return parts[parts.length - 1] || 'Unknown file';
};

// Hàm lấy biểu tượng file dựa trên phần mở rộng
const getFileIcon = (extension) => {
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'videocam';
  if (audioExtensions.includes(extension)) return 'musical-notes';
  if (documentExtensions.includes(extension)) {
    if (extension === 'pdf') return 'document-text';
    if (['doc', 'docx'].includes(extension)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'grid';
    if (['ppt', 'pptx'].includes(extension)) return 'easel';
    return 'document';
  }
  if (archiveExtensions.includes(extension)) return 'archive';
  return 'document-attach';
};

// Hàm phân tích createdAt
const parseCreatedAt = (createdAt) => {
  try {
    if (/^\d{2}:\d{2}$/.test(createdAt)) {
      const today = new Date();
      const [hours, minutes] = createdAt.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today;
    }
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/.test(createdAt)) {
      return new Date(createdAt.replace(/(\.\d{3})\d+/, '$1Z'));
    }
    console.warn('Invalid createdAt format:', createdAt);
    return new Date();
  } catch (error) {
    console.error('Error parsing createdAt:', createdAt, error);
    return new Date();
  }
};

// Hàm định dạng thời gian mm:ss
const formatTime = (millis) => {
  if (!millis) return '00:00';
  const seconds = Math.floor((millis / 1000) % 60);
  const minutes = Math.floor(millis / 1000 / 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Component ImageViewer
const ImageViewer = ({ visible, imageUri, onClose }) => {
  const [scale, setScale] = useState(1);
  const baseScale = useRef(1);
  const pinchRef = useRef();

  const onPinchGestureEvent = (event) => {
    const newScale = baseScale.current * event.nativeEvent.scale;
    setScale(Math.max(0.5, Math.min(newScale, 3)));
  };

  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      baseScale.current = scale;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <Image
            source={{ uri: imageUri }}
            style={[styles.fullImage, { transform: [{ scale }] }]}
            resizeMode="contain"
          />
        </PinchGestureHandler>
      </View>
    </Modal>
  );
};

const MessageItem = ({ item, myInfo, participantsInfo }) => {
  const isMyMessage = item.senderId === myInfo?.phoneNumber;
  const sender = isMyMessage
    ? myInfo
    : participantsInfo[item.senderId] || { phoneNumber: item.senderId };
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({
    positionMillis: 0,
    durationMillis: 0,
  });
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [reactions, setReactions] = useState(item.reactions || []); // Lưu trữ reactions
  const [isRecalled, setIsRecalled] = useState(item.isRecalled || false); // Trạng thái thu hồi

  // Cleanup âm thanh khi component unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Xử lý nhấn giữ để hiển thị menu ngữ cảnh
  const handleLongPress = () => {
    if (isRecalled) return; // Không hiển thị menu nếu tin nhắn đã thu hồi

    const options = ['Thêm Reaction'];
    if (isMyMessage) {
      options.push('Thu hồi');
    }
    options.push('Hủy');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            showReactionPicker();
          } else if (buttonIndex === 1 && isMyMessage) {
            handleRecallMessage();
          }
        }
      );
    } else {
      Alert.alert(
        'Tùy chọn',
        '',
        [
          { text: 'Thêm Reaction', onPress: showReactionPicker },
          isMyMessage ? { text: 'Thu hồi', onPress: handleRecallMessage } : null,
          { text: 'Hủy', style: 'cancel' },
        ].filter(Boolean)
      );
    }
  };

  // Hiển thị danh sách emoji để chọn reaction
  const showReactionPicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...REACTION_EMOJIS, 'Hủy'],
          cancelButtonIndex: REACTION_EMOJIS.length,
        },
        (buttonIndex) => {
          if (buttonIndex < REACTION_EMOJIS.length) {
            handleAddReaction(REACTION_EMOJIS[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        'Chọn Reaction',
        '',
        [
          ...REACTION_EMOJIS.map((emoji) => ({
            text: emoji,
            onPress: () => handleAddReaction(emoji),
          })),
          { text: 'Hủy', style: 'cancel' },
        ]
      );
    }
  };

  // Xử lý thu hồi tin nhắn
  const handleRecallMessage = async () => {
    try {
      const jwt = await AsyncStorage.getItem('authToken');
      if (!jwt) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        return;
      }

      await recallMessage(jwt, item.id);
      setIsRecalled(true);
      Alert.alert('Thành công', 'Tin nhắn đã được thu hồi.');
    } catch (error) {
      console.error('Lỗi khi thu hồi tin nhắn:', error);
      Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn. Vui lòng thử lại.');
    }
  };

  // Xử lý thêm reaction
  const handleAddReaction = async (emoji) => {
    try {
      const jwt = await AsyncStorage.getItem('authToken');
      if (!jwt) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
        return;
      }

      const updatedMessage = await addReaction(jwt, item.id, emoji);
      setReactions(updatedMessage.reactions || []);
    } catch (error) {
      console.error('Lỗi khi thêm reaction:', error);
      Alert.alert('Lỗi', 'Không thể thêm reaction. Vui lòng thử lại.');
    }
  };

  // Xử lý phát audio
  const playAudio = async (uri) => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      setIsPlaying(true);
      const { sound: audioSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => onPlaybackStatusUpdate(status)
      );
      setSound(audioSound);
    } catch (error) {
      console.error('Audio playback error:', error);
      Alert.alert('Error', 'Failed to play audio');
      setIsPlaying(false);
      setSound(null);
    }
  };

  // Theo dõi trạng thái phát audio
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackStatus({
        positionMillis: status.positionMillis,
        durationMillis: status.durationMillis,
      });
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setSound(null);
        setPlaybackStatus({
          positionMillis: 0,
          durationMillis: status.durationMillis,
        });
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      Alert.alert('Error', 'Failed to play audio');
      setIsPlaying(false);
      setSound(null);
    }
  };

  // Xử lý kéo thanh tiến độ audio
  const handleSeek = async (value) => {
    if (sound && playbackStatus.durationMillis) {
      const position = value * playbackStatus.durationMillis;
      await sound.setPositionAsync(position);
      setPlaybackStatus((prev) => ({ ...prev, positionMillis: position }));
    }
  };

  // Mở trình xem ảnh
  const openImageViewer = (uri) => {
    setSelectedImageUri(uri);
    setImageViewerVisible(true);
  };

  // Nếu tin nhắn đã thu hồi, hiển thị thông báo
  if (isRecalled) {
    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.yourMessage : styles.otherMessage,
        ]}
      >
        <Text style={styles.recalledText}>Tin nhắn đã được thu hồi</Text>
      </View>
    );
  }

  let contentElement;

  // Xử lý các loại tin nhắn
  if (item.type === 'TEXT') {
    contentElement = (
      <Text
        style={[
          styles.messageText,
          isMyMessage ? styles.yourMessageText : styles.otherMessageText,
        ]}
      >
        {item.content}
      </Text>
    );
  } else if (item.type === 'MEDIA' || item.type === 'FILE') {
    const fileUrl = item.mediaUrl || item.content;
    const extension = getFileExtension(fileUrl);
    const fileName = getFileName(fileUrl);

    if (imageExtensions.includes(extension) || item.content === 'Image') {
      contentElement = (
        <TouchableOpacity onPress={() => openImageViewer(fileUrl)}>
          <Image
            source={{ uri: fileUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    } else if (videoExtensions.includes(extension) || item.content === 'Video') {
      contentElement = (
        <Video
          source={{ uri: fileUrl }}
          style={styles.mediaVideo}
          useNativeControls
          resizeMode="contain"
        />
      );
    } else if (audioExtensions.includes(extension) || item.content === 'Audio') {
      const progress = playbackStatus.durationMillis
        ? playbackStatus.positionMillis / playbackStatus.durationMillis
        : 0;
      contentElement = (
        <View style={styles.audioContainer}>
          <TouchableOpacity onPress={() => playAudio(fileUrl)}>
            <Ionicons
              name={isPlaying ? 'pause-circle' : 'play-circle'}
              size={28}
              color={isMyMessage ? '#fff' : '#007aff'}
            />
          </TouchableOpacity>
          <View style={styles.audioProgress}>
            <Text
              style={[styles.audioTime, isMyMessage ? styles.yourFileText : {}]}
            >
              {formatTime(playbackStatus.positionMillis)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>
            <Text
              style={[styles.audioTime, isMyMessage ? styles.yourFileText : {}]}
            >
              {formatTime(playbackStatus.durationMillis)}
            </Text>
          </View>
          <Text
            style={[styles.fileText, isMyMessage ? styles.yourFileText : {}]}
          >
            {fileName}
          </Text>
        </View>
      );
    } else {
      const fileIcon = getFileIcon(extension);
      contentElement = (
        <TouchableOpacity
          style={styles.fileContainer}
          onPress={() => Linking.openURL(fileUrl)}
        >
          <Ionicons
            name={fileIcon}
            size={24}
            color={isMyMessage ? '#fff' : '#007aff'}
          />
          <Text
            style={[styles.fileText, isMyMessage ? styles.yourFileText : {}]}
          >
            {fileName}
          </Text>
        </TouchableOpacity>
      );
    }
  } else if (item.type === 'CALL') {
    contentElement = (
      <Text
        style={[
          styles.messageText,
          isMyMessage ? styles.yourMessageText : styles.otherMessageText,
        ]}
      >
        📞 {item.content}
      </Text>
    );
  } else {
    contentElement = (
      <Text
        style={[
          styles.messageText,
          isMyMessage ? styles.yourMessageText : styles.otherMessageText,
        ]}
      >
        {item.content}
      </Text>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[
          styles.messageBubble,
          isMyMessage ? styles.yourMessage : styles.otherMessage,
        ]}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        <View style={styles.messageHeader}>
          <Image
            source={
              sender?.baseImg
                ? { uri: sender.baseImg }
                : require('../../../assets/icon.png')
            }
            style={styles.messageAvatar}
          />
          <Text style={styles.messageSenderName}>
            {sender?.name || sender?.phoneNumber || 'Unknown'}
          </Text>
        </View>
        {contentElement}
        <Text
          style={[styles.messageTime, isMyMessage ? styles.yourMessageTime : {}]}
        >
          {parseCreatedAt(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {/* Hiển thị reactions */}
        {reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {reactions.map((reaction, index) => (
              <Text key={index} style={styles.reactionEmoji}>
                {reaction.emoji} {reaction.count > 1 ? reaction.count : ''}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
      <ImageViewer
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={() => setImageViewerVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  yourMessage: {
    backgroundColor: '#007aff',
    alignSelf: 'flex-end',
  },
  otherMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  messageSenderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  yourMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  yourMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  mediaVideo: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
  },
  fileText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007aff',
    flex: 1,
    flexWrap: 'wrap',
  },
  yourFileText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  audioContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    width: 250,
  },
  audioProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
  },
  audioTime: {
    fontSize: 12,
    color: '#007aff',
    marginHorizontal: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007aff',
  },
  recalledText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
});

export default MessageItem;