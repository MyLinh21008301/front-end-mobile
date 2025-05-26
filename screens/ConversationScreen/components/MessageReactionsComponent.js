import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { groupReactionsByEmoji } from './MessageUtils';

const MessageReactions = ({ reactions, isMyMessage, onPress, onRecall }) => {
  // If there are no reactions and it's not the user's message, don't render anything
  if ((!reactions || reactions.length === 0) && !isMyMessage) {
    return null;
  }
  
  // Group reactions by emoji for display
  const groupedReactions = groupReactionsByEmoji(reactions || []);
  
  return (
    <View style={styles.reactionContainer}>
      {/* Show existing reactions */}
      {reactions && reactions.length > 0 && (
        <TouchableOpacity 
          style={styles.reactionsWrapper}
          onPress={onPress}
        >
          {Object.values(groupedReactions).map((group, index) => (
            <View key={index} style={styles.reactionBadge}>
              <Text style={styles.reactionEmoji}>{group.emoji}</Text>
              {group.count > 1 && (
                <Text style={styles.reactionCount}>{group.count}</Text>
              )}
            </View>
          ))}
        </TouchableOpacity>
      )}
      
      {/* Show delete icon if it's the user's message */}
      {/* {isMyMessage && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={onRecall}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
        </TouchableOpacity>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  reactionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  reactionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    color: '#333',
  },
});

export default MessageReactions;
