import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReactionDetailsModal = ({ visible, reactions, onClose, onRemoveReaction, myInfo }) => {
  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    const { emoji, userId } = reaction;
    if (!acc[emoji]) {
      acc[emoji] = [];
    }
    acc[emoji].push(reaction);
    return acc;
  }, {});

  // Convert to array for FlatList
  const reactionData = Object.keys(groupedReactions).map(emoji => ({
    emoji,
    users: groupedReactions[emoji],
    key: emoji
  }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
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
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <View style={styles.reactionGroup}>
                <Text style={styles.reactionGroupEmoji}>{item.emoji}</Text>
                {item.users.map((reaction, index) => {
                  const isMyReaction = reaction.userId === myInfo?.phoneNumber;
                  return (
                    <View key={index} style={styles.reactionUser}>
                      <Image
                        source={
                          reaction.userAvatar
                            ? { uri: reaction.userAvatar }
                            : require('../../../assets/icon.png')
                        }
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

const styles = StyleSheet.create({
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

export default ReactionDetailsModal;
