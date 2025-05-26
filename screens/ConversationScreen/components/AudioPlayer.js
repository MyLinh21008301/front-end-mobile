import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from './MessageUtils';

const AudioPlayer = ({ fileUrl, fileName, isMyMessage, playbackStatus, isPlaying, onPlayAudio }) => {
  const progress = playbackStatus.durationMillis
    ? playbackStatus.positionMillis / playbackStatus.durationMillis
    : 0;

  return (
    <View style={styles.audioContainer}>
      <TouchableOpacity onPress={() => onPlayAudio(fileUrl)}>
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
};

const styles = StyleSheet.create({
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

export default AudioPlayer;
