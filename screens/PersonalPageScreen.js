// PersonalPageScreen.js
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

export default function PersonalPageScreen({ route }) {
  const { person } = route.params;

  return (
    <ScrollView style={styles.container}>
      {person.backgroundImg && (
        <Image
          source={{ uri: person.backgroundImg }}
          style={styles.backgroundImg}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: person.baseImg }}
          style={styles.avatar}
          resizeMode="cover"
        />
        
        <Text style={styles.name}>{person.name}</Text>
        <Text style={styles.phone}>{person.phoneNumber}</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.label}>Status: {person.status}</Text>
          {person.bio && <Text style={styles.label}>Bio: {person.bio}</Text>}
          {person.dateOfBirth && (
            <Text style={styles.label}>Birthday: {person.dateOfBirth}</Text>
          )}
          <Text style={styles.label}>Gender: {person.male ? 'Male' : 'Female'}</Text>
          {person.lastOnlineTime && (
            <Text style={styles.label}>Last Online: {new Date(person.lastOnlineTime).toLocaleString()}</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImg: {
    width: '100%',
    height: 200,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  phone: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  infoSection: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
    color: '#333',
  },
});