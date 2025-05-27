import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Clipboard, ToastAndroid, Platform, Share, Text } from 'react-native';
import { Audio } from 'expo-av';
import { getToken } from '../../../apis/TokenAPI';
import { recallMessage, addReaction, removeReaction } from '../../../apis/MessageAPI';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { enrichReactions } from './MessageUtils';
import MessageContent from './MessageContent';
import MessageHeader from './MessageHeader';
import { RecalledMessage, MessageTimestamp } from './MessageElements';
import MessageReactionsComponent from './MessageReactionsComponent';
import ImageViewer from './ImageViewer';
import ReactionPicker from './ReactionPicker';
import ReactionDetailsModal from './ReactionDetailsModal';
import { useReactionPicker } from '../../../contexts/ReactionPickerContext';

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';

  let messageDate;
  try {
    // Handle ISO format with nanoseconds (e.g., "2025-04-21T15:39:36.994258700Z")
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/.test(timestamp)) {
      messageDate = new Date(timestamp.replace(/(\.\d{3})\d+(Z)?/, '$1Z'));
    } else if (/^\d{2}:\d{2}$/.test(timestamp)) {
      // Handle HH:mm format (e.g., "16:43")
      const today = new Date();
      const [hours, minutes] = timestamp.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      messageDate = today;
    } else {
      // Handle standard ISO format or other valid date strings
      messageDate = new Date(timestamp);
    }

    // Check if the date is valid
    if (isNaN(messageDate.getTime())) {
      console.warn('Invalid timestamp:', timestamp);
      return '';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const diffTime = today.getTime() - msgDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const timeString = messageDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (diffDays === 0) return timeString;
    else if (diffDays === 1) return `Hôm qua ${timeString}`;
    else if (diffDays === 2) return `Hôm kia ${timeString}`;
    else if (diffDays >= 3 && diffDays <= 7) return `${diffDays} ngày trước ${timeString}`;
    else {
      const dateString = messageDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return `${dateString} ${timeString}`;
    }
  } catch (error) {
    console.error('Error parsing timestamp:', timestamp, error);
    return '';
  }
};

const MessageItem = ({ item, myInfo, participantsInfo, messageMap, onReplyPressed }) => {
  const isMyMessage = item.senderId === myInfo?.phoneNumber;
  const sender = isMyMessage ? myInfo : participantsInfo[item.senderId] || { phoneNumber: item.senderId };
  const { activePickerMessageId, showReactionPicker, hideAllReactionPickers } = useReactionPicker();

  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({ positionMillis: 0, durationMillis: 0 });
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState('');
  const [reactionDetailsVisible, setReactionDetailsVisible] = useState(false);
  const [reactions, setReactions] = useState(item.reactions || []);
  const [isRecalled, setIsRecalled] = useState(item.isRecalled || false);

  const isReactionPickerVisible = activePickerMessageId === item.id;

  useEffect(() => {
    setReactions(item.reactions || []);
    setIsRecalled(item.isRecalled || false);
  }, [item.reactions, item.isRecalled]);

  const enrichedReactions = enrichReactions(reactions, participantsInfo);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

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

  const copyTextToClipboard = () => {
    if (item.content && typeof item.content === 'string') {
      Clipboard.setString(item.content);
      if (Platform.OS === 'android') ToastAndroid.show('Copied to clipboard', ToastAndroid.SHORT);
      else Alert.alert('Copied', 'Text copied to clipboard');
      hideAllReactionPickers();
    }
  };

  const downloadMedia = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Storage permission is needed to download media');
        return;
      }
      let mediaUri, filename;
      if (item.fileUrl) {
        mediaUri = item.fileUrl;
        const parts = mediaUri.split('/');
        filename = parts[parts.length - 1];
      } else {
        Alert.alert('Error', 'No downloadable content found');
        return;
      }
      if (Platform.OS === 'android') ToastAndroid.show('Download started...', ToastAndroid.SHORT);
      else Alert.alert('Downloading', 'Download has started');
      const fileUri = FileSystem.documentDirectory + filename;
      const downloadResumable = FileSystem.createDownloadResumable(mediaUri, fileUri, {});
      const { uri } = await downloadResumable.downloadAsync();
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('ChatApp', asset, false);
      if (Platform.OS === 'android') ToastAndroid.show('Download complete', ToastAndroid.LONG);
      else Alert.alert('Success', 'Media saved to your gallery');
      hideAllReactionPickers();
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download media');
    }
  };

  const shareMedia = async () => {
    try {
      let shareOptions = {};
      if (item.fileUrl) {
        shareOptions = { url: item.fileUrl, message: 'Check out this media from my chat' };
      } else if (item.content && typeof item.content === 'string') {
        shareOptions = { message: item.content };
      } else {
        Alert.alert('Error', 'No content to share');
        return;
      }
      await Share.share(shareOptions);
      hideAllReactionPickers();
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share content');
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackStatus({ positionMillis: status.positionMillis, durationMillis: status.durationMillis });
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setSound(null);
        setPlaybackStatus({ positionMillis: 0, durationMillis: status.durationMillis });
      }
    } else if (status.error) {
      console.error('Playback error:', status.error);
      Alert.alert('Error', 'Failed to play audio');
      setIsPlaying(false);
      setSound(null);
    }
  };

  const handleSeek = async (value) => {
    if (sound && playbackStatus.durationMillis) {
      const position = value * playbackStatus.durationMillis;
      await sound.setPositionAsync(position);
      setPlaybackStatus((prev) => ({ ...prev, positionMillis: position }));
    }
  };

  const openImageViewer = (uri) => {
    setSelectedImageUri(uri);
    setImageViewerVisible(true);
  };

  const handleLongPress = () => {
    if (isRecalled) return;
    showReactionPicker(item.id);
  };

  const handleRecallMessage = async () => {
    try {
      const jwt = await getToken();
      await recallMessage(jwt, item.id);
      setIsRecalled(true);
      hideAllReactionPickers();
    } catch (error) {
      console.error('Failed to recall message:', error);
      Alert.alert('Error', 'Failed to recall message');
    }
  };

  const handleReactionSelect = async (emoji) => {
    try {
      const jwt = await getToken();
      const result = await addReaction(jwt, item.id, emoji);
      hideAllReactionPickers();
      if (result && result.reactions) setReactions(result.reactions);
      else {
        const newReaction = {
          id: Date.now().toString(),
          messageId: item.id,
          userId: myInfo.phoneNumber,
          emoji: emoji,
          createdAt: new Date().toISOString(),
        };
        setReactions((prev) => [...prev, newReaction]);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const handleRemoveReaction = async (reactionId) => {
    try {
      const jwt = await getToken();
      await removeReaction(jwt, reactionId);
      setReactions((prev) => prev.filter((reaction) => reaction.id !== reactionId));
      const updatedReactions = reactions.filter((reaction) => reaction.id !== reactionId);
      if (updatedReactions.length === 0) setReactionDetailsVisible(false);
      Alert.alert('Success', 'Reaction removed successfully');
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      Alert.alert('Error', 'Failed to remove reaction');
    }
  };

  const handleReply = () => {
    onReplyPressed(item); // Pass the entire message object
    hideAllReactionPickers();
  };

  if (isRecalled) return <RecalledMessage isMyMessage={isMyMessage} />;

  const hasMedia =
    item.fileType === 'image' || item.fileType === 'audio' || item.fileType === 'video' || (item.fileUrl && item.fileUrl.length > 0);

  // Determine the reply content based on whether it's media or text
const getReplyContent = () => {
  if (!item.replyTo || !messageMap[item.replyTo]) return null;
  const repliedMessage = messageMap[item.replyTo];
  const repliedSender = participantsInfo[repliedMessage.senderId]?.name || 'Unknown';
  console.log('Replied message:', repliedMessage.type);
  if (repliedMessage.type === 'MEDIA') {
    return `${repliedSender} đã gửi một tệp`;
  } else if (repliedMessage.type === 'CALL') {
    return `${repliedSender}: đã gọi điện`;
  } else {
    return `${repliedSender}: ${repliedMessage.content || 'Unknown'}`;
  }
};

  return (
    <>
      <View style={styles.messageWrapper}>
        <ReactionPicker
          visible={isReactionPickerVisible}
          onSelect={handleReactionSelect}
          onClose={hideAllReactionPickers}
          isMyMessage={isMyMessage}
          onRecall={handleRecallMessage}
          onCopy={copyTextToClipboard}
          onDownload={hasMedia ? downloadMedia : null}
          onShare={shareMedia}
          onReply={handleReply} // Pass the reply handler
        />
        <TouchableOpacity onLongPress={handleLongPress} delayLongPress={500} activeOpacity={0.8}>
          <View style={[styles.messageBubble, isMyMessage ? styles.yourMessage : styles.otherMessage]}>
            <MessageHeader sender={sender} isMyMessage={isMyMessage} />
            {item.replyTo && messageMap[item.replyTo] && (
              <TouchableOpacity onPress={() => onReplyPressed(messageMap[item.replyTo])}>
                <Text style={[styles.replyText, { color: isMyMessage ? '#fff' : '#666' }]}>
                  Phản hồi {getReplyContent()}
                </Text>
              </TouchableOpacity>
            )}
            <MessageContent
              item={item}
              isMyMessage={isMyMessage}
              onImagePress={openImageViewer}
              playbackStatus={playbackStatus}
              isPlaying={isPlaying}
              onPlayAudio={playAudio}
            />
            <MessageTimestamp timestamp={formatMessageTime(item.createdAt)} isMyMessage={isMyMessage} />
            <MessageReactionsComponent
              reactions={enrichedReactions}
              isMyMessage={isMyMessage}
              onPress={() => setReactionDetailsVisible(true)}
              onRecall={handleRecallMessage}
            />
          </View>
        </TouchableOpacity>
      </View>
      <ImageViewer
        visible={imageViewerVisible}
        imageUri={selectedImageUri}
        onClose={() => setImageViewerVisible(false)}
        onDownload={downloadMedia}
      />
      <ReactionDetailsModal
        visible={reactionDetailsVisible}
        reactions={enrichedReactions}
        onClose={() => setReactionDetailsVisible(false)}
        onRemoveReaction={handleRemoveReaction}
        myInfo={myInfo}
      />
    </>
  );
};

const styles = StyleSheet.create({
  messageWrapper: {
    position: 'relative',
    paddingTop: 15,
  },
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
  replyText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

export default MessageItem;