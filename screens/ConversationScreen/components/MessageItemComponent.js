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
  Pressable,
} from 'react-native';
import { Video, Audio } from 'expo-av';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { getToken } from '../../../apis/TokenAPI'; // Assuming TokenAPI is in the same directory
import { recallMessage, addReaction } from '../../../apis/MessageAPI'; // Assuming these are exported from the provided API code

// Define common file extensions for different media types
const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'];
const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mpeg'];
const documentExtensions = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'rtf',
  'csv',
];
const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

// Define reaction emojis
const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎'];

// Function to extract file extension from a URL
const getFileExtension = (url) => {
  if (!url) return '';
  const parts = url.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase();
};

// Function to get file name from URL
const getFileName = (url) => {
  if (!url) return 'Unknown file';
  const parts = url.split('/');
  return parts[parts.length - 1] || 'Unknown file';
};

// Function to get file icon based on extension
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

// Function to parse createdAt
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

// Image Viewer Component
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

// Reaction Picker Component
const ReactionPicker = ({ visible, onSelect, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.reactionModalOverlay} onPress={onClose}>
        <View style={styles.reactionPicker}>
          {REACTION_EMOJIS.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reactionButton}
              onPress={() => onSelect(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

// Format time in mm:ss
const formatTime = (millis) => {
  if (!millis) return '00:00';
  const seconds = Math.floor((millis / 1000) % 60);
  const minutes = Math.floor(millis / 1000 / 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
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
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);

  console.log('Raw createdAt:', item.createdAt, typeof item.createdAt);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Function to play audio
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

  // Monitor playback status
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

  // Handle progress bar seek
  const handleSeek = async (value) => {
    if (sound && playbackStatus.durationMillis) {
      const position = value * playbackStatus.durationMillis;
      await sound.setPositionAsync(position);
      setPlaybackStatus((prev) => ({ ...prev, positionMillis: position }));
    }
  };

  // Open image viewer
  const openImageViewer = (uri) => {
    setSelectedImageUri(uri);
    setImageViewerVisible(true);
  };

  // Handle long press to show options
  const handleLongPress = () => {
    if (isMyMessage) {
      // Show recall and reaction options for own messages
      Alert.alert(
        'Message Options',
        'Choose an action',
        [
          {
            text: 'Recall Message',
            onPress: handleRecallMessage,
            style: 'destructive',
          },
          {
            text: 'Add Reaction',
            onPress: () => setReactionPickerVisible(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    } else {
      // Show only reaction option for others' messages
      setReactionPickerVisible(true);
    }
  };

  // Handle recall message
  const handleRecallMessage = async () => {
    try {
      const jwt = await getToken();
      await recallMessage(jwt, item.id);
      Alert.alert('Success', 'Message recalled successfully');
    } catch (error) {
      console.error('Failed to recall message:', error);
      Alert.alert('Error', 'Failed to recall message');
    }
  };

  // Handle reaction selection
  const handleReactionSelect = async (emoji) => {
    try {
      const jwt = await getToken();
      await addReaction(jwt, item.id, emoji);
      setReactionPickerVisible(false);
      Alert.alert('Success', 'Reaction added successfully');
    } catch (error) {
      console.error('Failed to add reaction:', error);
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  let contentElement;

  // Handle message types
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

  // Display reactions if any
  const reactionElement = item.reactions?.length > 0 && (
    <View style={styles.reactionContainer}>
      {item.reactions.map((reaction, index) => (
        <Text key={index} style={styles.reactionText}>
          {reaction.emoji}
        </Text>
      ))}
    </View>
  );

  return (
    <>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.yourMessage : styles.otherMessage,
          ]}
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
          {reactionElement}
        </View>
      </TouchableOpacity>
      <ImageViewer
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={() => setImageViewerVisible(false)}
      />
      <ReactionPicker
        visible={reactionPickerVisible}
        onSelect={handleReactionSelect}
        onClose={() => setReactionPickerVisible(false)}
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
  // Image Viewer Styles
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
  // Audio Player Styles
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
  // Reaction Picker Styles
  reactionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionPicker: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    elevation: 5,
  },
  reactionButton: {
    padding: 10,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  // Reaction Display Styles
  reactionContainer: {
    flexDirection: 'row',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  reactionText: {
    fontSize: 16,
    marginRight: 4,
  },
});

export default MessageItem;