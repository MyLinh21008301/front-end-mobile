// TokenAPI.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token !== null) {
      return token;
    } else {
      console.error('No token found');
      return null;  // Token not found
    }
  } catch (error) {
    console.error('Error getting token:', error);
    return null;  // Error while fetching token
  }
};
