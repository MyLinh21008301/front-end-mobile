import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { 
  getFileExtension, 
  getFileName, 
  getFileIcon, 
  imageExtensions, 
  videoExtensions, 
  audioExtensions 
} from './MessageUtils';
import AudioPlayer from './AudioPlayer';

const MessageContent = ({ 
  item, 
  isMyMessage, 
  onImagePress, 
  playbackStatus, 
  isPlaying, 
  onPlayAudio, 
}) => {
  if (item.type === 'TEXT') {
    return (
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
      return (
        <TouchableOpacity onPress={() => onImagePress(fileUrl)}>
          <Image
            source={{ uri: fileUrl }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    } else if (videoExtensions.includes(extension) || item.content === 'Video') {
      return (
        <Video
          source={{ uri: fileUrl }}
          style={styles.mediaVideo}
          useNativeControls
          resizeMode="contain"
        />
      );
    } else if (audioExtensions.includes(extension) || item.content === 'Audio') {
      return (
        <AudioPlayer
          fileUrl={fileUrl}
          fileName={fileName}
          isMyMessage={isMyMessage}
          playbackStatus={playbackStatus}
          isPlaying={isPlaying}
          onPlayAudio={onPlayAudio}
        />
      );
    } else {
      const fileIcon = getFileIcon(extension);
      return (
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
    return (
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
    return (
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
};

const styles = StyleSheet.create({
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
});

export default MessageContent;
