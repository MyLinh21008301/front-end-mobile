import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReactionPicker = ({
  visible,
  onSelect,
  onClose,
  isMyMessage,
  onRecall,
  onCopy,
  onDownload,
  onShare,
  onReply, // New prop for handling reply action
}) => {
  if (!visible) return null;

  // Common emojis used in chat apps
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.alignRight : styles.alignLeft,
      ]}
    >
      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={20} color="#666" />
      </TouchableOpacity>

      <View style={styles.emojiContainer}>
        {emojis.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            style={styles.emojiButton}
            onPress={() => onSelect(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionContainer}>
        {onReply && (
          <TouchableOpacity style={styles.actionButton} onPress={onReply}>
            <Ionicons name="arrow-undo-outline" size={22} color="#007aff" />
            <Text style={styles.actionText}>Phản hồi</Text>
          </TouchableOpacity>
        )}

        {onCopy && (
          <TouchableOpacity style={styles.actionButton} onPress={onCopy}>
            <Ionicons name="copy-outline" size={22} color="#007aff" />
            <Text style={styles.actionText}>Sao chép</Text>
          </TouchableOpacity>
        )}

        {onDownload && (
          <TouchableOpacity style={styles.actionButton} onPress={onDownload}>
            <Ionicons name="download-outline" size={22} color="#007aff" />
            <Text style={styles.actionText}>Download</Text>
          </TouchableOpacity>
        )}

        {onShare && (
          <TouchableOpacity style={styles.actionButton} onPress={onShare}>
            <Ionicons name="share-outline" size={22} color="#007aff" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        )}

        {isMyMessage && onRecall && (
          <TouchableOpacity style={styles.recallButton} onPress={onRecall}>
            <Ionicons name="trash-outline" size={22} color="#ff3b30" />
            <Text style={styles.recallText}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 100,
    minWidth: 250,
  },
  alignLeft: {
    left: 10,
  },
  alignRight: {
    right: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 101,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingTop: 15, // Add extra padding top to accommodate close button
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  emojiButton: {
    padding: 8,
  },
  emoji: {
    fontSize: 22,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  actionText: {
    fontSize: 12,
    marginTop: 2,
    color: '#007aff',
  },
  recallButton: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
  },
  recallText: {
    fontSize: 12,
    marginTop: 2,
    color: '#ff3b30',
  },
});

export default ReactionPicker;