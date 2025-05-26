import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, FlatList, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define reaction emojis
const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎'];

// Reaction Picker Component
const ReactionPicker = ({ visible, onSelect, onClose }) => (
  <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.reactionModalOverlay} onPress={onClose}>
      <View style={styles.reactionPicker}>
        {REACTION_EMOJIS.map((emoji, index) => (
          <TouchableOpacity key={index} style={styles.reactionButton} onPress={() => onSelect(emoji)}>
            <Text style={styles.reactionEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Pressable>
  </Modal>
);

// Reaction Details Modal Component
const ReactionDetailsModal = ({ visible, reactions, onClose, onRemoveReaction, myInfo }) => {
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const { emoji } = reaction;
    if (!acc[emoji]) acc[emoji] = [];
    acc[emoji].push(reaction);
    return acc;
  }, {});

  const reactionData = Object.keys(groupedReactions).map(emoji => ({
    emoji,
    users: groupedReactions[emoji],
    key: emoji,
  }));

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.reactionDetailsContainer}>
        <View style={styles.reactionDetailsContent}>
          <View style={styles.reactionDetailsHeader}>
            <Text style={styles.reactionDetailsTitle}>Reactions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={reactionData}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <View style={styles.reactionGroup}>
                <Text style={styles.reactionGroupEmoji}>{item.emoji}</Text>
                {item.users.map((reaction, index) => {
                  const isMyReaction = reaction.userId === myInfo?.phoneNumber;
                  return (
                    <View key={index} style={styles.reactionUser}>
                      <Image
                        source={reaction.userAvatar ? { uri: reaction.userAvatar } : require('../../../assets/icon.png')}
                        style={styles.reactionUserAvatar}
                      />
                      <Text style={styles.reactionUserName}>
                        {reaction.userName || reaction.userId}
                        {isMyReaction ? ' (You)' : ''}
                      </Text>
                      {isMyReaction && (
                        <TouchableOpacity
                          style={styles.removeReactionButton}
                          onPress={() => onRemoveReaction(reaction.id)}
                        >
                          <Text style={styles.removeReactionText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
            style={styles.reactionDetailsList}
          />
        </View>
      </View>
    </Modal>
  );
};

// MessageReactions Component
const MessageReactions = forwardRef(({ reactions, myInfo, participantsInfo, onAddReaction, onRemoveReaction }, ref) => {
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [reactionDetailsVisible, setReactionDetailsVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    openReactionPicker: () => setReactionPickerVisible(true),
  }));

  const enrichedReactions = reactions.map(reaction => {
    const user = participantsInfo[reaction.userId] || { phoneNumber: reaction.userId };
    return {
      ...reaction,
      userName: user.name || user.phoneNumber,
      userAvatar: user.baseImg,
    };
  });

  const groupedReactions = enrichedReactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [] };
    }
    acc[reaction.emoji].count += 1;
    acc[reaction.emoji].users.push(reaction.userName);
    return acc;
  }, {});

  const handleReactionSelect = (emoji) => {
    onAddReaction(emoji);
    setReactionPickerVisible(false);
  };

  return (
    <>
      {reactions.length > 0 && (
        <TouchableOpacity style={styles.reactionContainer} onPress={() => setReactionDetailsVisible(true)}>
          {Object.values(groupedReactions).map((group, index) => (
            <View key={index} style={styles.reactionBadge}>
              <Text style={styles.reactionEmoji}>{group.emoji}</Text>
              {group.count > 1 && <Text style={styles.reactionCount}>{group.count}</Text>}
            </View>
          ))}
        </TouchableOpacity>
      )}
      <ReactionPicker
        visible={reactionPickerVisible}
        onSelect={handleReactionSelect}
        onClose={() => setReactionPickerVisible(false)}
      />
      <ReactionDetailsModal
        visible={reactionDetailsVisible}
        reactions={enrichedReactions}
        onClose={() => setReactionDetailsVisible(false)}
        onRemoveReaction={onRemoveReaction}
        myInfo={myInfo}
      />
    </>
  );
});

const styles = StyleSheet.create({
  reactionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
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
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 2,
    color: '#333',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reactionButton: {
    padding: 10,
  },
  reactionDetailsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  reactionDetailsContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  reactionDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reactionDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  reactionDetailsList: {
    maxHeight: 300,
  },
  reactionGroup: {
    marginVertical: 10,
  },
  reactionGroupEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  reactionUser: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reactionUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  reactionUserName: {
    fontSize: 16,
    flex: 1,
  },
  removeReactionButton: {
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  removeReactionText: {
    color: '#ff3b30',
    fontSize: 14,
  },
});

export default MessageReactions;