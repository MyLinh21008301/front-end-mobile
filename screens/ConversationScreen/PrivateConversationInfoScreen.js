import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserInfo } from '../../contexts/UserInfoContext';

const PrivateConversationInfo = ({ route, navigation }) => {
  const { conversation } = route.params;
  const { userInfo } = useUserInfo();

  console.log('PrivateConversationInfo', conversation);

  const otherParticipant = conversation.participants.find(
    participant => participant.phoneNumber !== userInfo.phoneNumber
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversation Info</Text>
      </View>
      <View style={styles.content}>
        <Image
          source={
            otherParticipant?.baseImg
              ? { uri: otherParticipant.baseImg }
              : require('../../assets/icon.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>{otherParticipant?.name || otherParticipant?.phoneNumber}</Text>
        <Text style={styles.status}>{otherParticipant?.status || 'Offline'}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{otherParticipant?.phoneNumber}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.infoLabel}>Bio:</Text>
          <Text style={styles.infoValue}>{otherParticipant?.bio || 'No bio available'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    width: '100%',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    flex: 1,
  },
});

export default PrivateConversationInfo;