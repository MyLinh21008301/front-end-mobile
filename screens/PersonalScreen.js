// PersonalScreen.js

import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserInfo } from '../contexts/UserInfoContext'; // Adjust path if needed
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PersonalScreen({ navigation }) {
  const userInfo = useUserInfo().userInfo;
  console.log('User Info:', userInfo); // Debugging line to check userInfo

  // Define the logout function
  const handleLogout = async () => {
    try {
      // Remove JWT token and searched history from AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('searchQueries');
      await AsyncStorage.removeItem('recentPeople');
      // Reset navigation stack to navigate to Login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Configure the navigation header with back and logout buttons
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <Ionicons name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerTitle: 'My Profile',
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundContainer}>
          {userInfo.backgroundImg ? (
            <Image
              source={{ uri: userInfo.backgroundImg }}
              style={styles.backgroundImg}
              resizeMode="cover"
              onError={(e) => console.log('Background image error:', e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.backgroundPlaceholder} />
          )}
        </View>

        <View style={styles.profileContainer}>
          <Image
            source={{ uri: userInfo.baseImg }}
            style={styles.avatar}
            resizeMode="cover"
            onError={(e) => console.log('Avatar image error:', e.nativeEvent.error)}
          />

          <Text style={styles.name}>{userInfo.name || 'Unknown'}</Text>
          <Text style={styles.phone}>{userInfo.phoneNumber || 'N/A'}</Text>

          <View style={styles.infoSection}>
            <Text style={styles.label}>Status: {userInfo.status || 'N/A'}</Text>
            {userInfo.bio && <Text style={styles.label}>Bio: {userInfo.bio}</Text>}
            {userInfo.dateOfBirth && (
              <Text style={styles.label}>Birthday: {userInfo.dateOfBirth}</Text>
            )}
            <Text style={styles.label}>
              Gender:{' '}
              {userInfo.male !== undefined ? (userInfo.male ? 'Male' : 'Female') : 'N/A'}
            </Text>
            {userInfo.lastOnlineTime && (
              <Text style={styles.label}>
                Last Online: {new Date(userInfo.lastOnlineTime).toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  backgroundContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
  },
  backgroundImg: {
    width: '100%',
    height: '100%',
  },
  backgroundPlaceholder: {
    flex: 1,
    backgroundColor: '#ccc',
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#ddd',
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 10,
  },
  phone: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  infoSection: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
    marginVertical: 5,
  },
  headerButton: {
    paddingHorizontal: 15,
  },
});