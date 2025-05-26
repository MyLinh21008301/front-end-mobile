import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context with default values
const UserInfoContext = createContext(null);

// Provider component that wraps your app and makes user info available to any child component
export const UserInfoProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data from AsyncStorage on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user data from storage
        const storedUserData = await AsyncStorage.getItem('userData');
        
        if (storedUserData) {
          // Parse and set the user data if it exists
          setUserInfo(JSON.parse(storedUserData));
          console.log('User data loaded from storage:', JSON.parse(storedUserData));
        }
      } catch (error) {
        console.error('Error loading user data from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Function to update user info and persist to storage
  const updateUserInfo = async (newUserInfo) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(newUserInfo));
      // Update state
      setUserInfo(newUserInfo);
      console.log('User info updated:', newUserInfo);
    } catch (error) {
      console.error('Error saving user info:', error);
    }
  };

  // Value to be provided to consuming components
  const value = {
    userInfo,
    setUserInfo: updateUserInfo,
    loading
  };

  return (
    <UserInfoContext.Provider value={value}>
      {children}
    </UserInfoContext.Provider>
  );
};

// Custom hook for using the user info context
export const useUserInfo = () => {
  const context = useContext(UserInfoContext);
  if (!context) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
};

export default UserInfoContext;