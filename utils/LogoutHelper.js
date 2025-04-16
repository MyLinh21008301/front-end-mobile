// utils/logoutHelper.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const logoutUser = async (resetNavigation, disconnectSocket, clearUserInfo, clearToken) => {
  try {
    await AsyncStorage.multiRemove(['authToken', 'searchQueries', 'recentPeople']);

    if (disconnectSocket) disconnectSocket();
    if (clearUserInfo) clearUserInfo(null);
    if (clearToken) clearToken(null); // Reset token in App.js → triggers useSocket cleanup

    resetNavigation();
  } catch (error) {
    console.error('Error during logout:', error);
  }
};
