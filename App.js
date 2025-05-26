import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReactionPickerProvider } from './contexts/ReactionPickerContext';

import LoginScreen from './screens/Login';
import ForgotPasswordScreen from './screens/ForgotPassword';
import RegisterScreen from './screens/Register';
import ConversationListScreen from './screens/ConversationListScreen/ConversationListScreen.js';
import ContactsScreen from './screens/ContactsScreen';
import PersonalScreen from './screens/PersonalScreen';
import SearchScreen from './screens/SearchScreen';
import PersonalPageScreen from './screens/PersonalPageScreen';
import ConversationScreen from './screens/ConversationScreen/ConversationScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';
import GroupManagementScreen from './screens/ConversationScreen/GroupManagementScreen';
import PrivateConversationInfo from './screens/ConversationScreen/PrivateConversationInfoScreen';

import { getToken, loginWithJWT } from './apis/AuthAPI.js';
import { getUserInfo } from './apis/UserAPI.js';
import SocketContext from './contexts/SocketContext';
import UserInfoContext from './contexts/UserInfoContext';
import useSocket from './hooks/useSocket';
import BASE_URL from './apis/BaseURL.js';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [token, setToken] = useState(''); // Initialize with empty string
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize socket only if we have a valid token (not empty string)
  const socketState = useSocket(token && token !== '' ? `http://54.169.214.143:3002` : null, token);

  // Initialize default token in AsyncStorage if it doesn't exist
  const initializeDefaultToken = async () => {
    try {
      const existingToken = await AsyncStorage.getItem('authToken');
      if (existingToken === null) {
        // Set empty string as default token
        await AsyncStorage.setItem('authToken', '');
        console.log('Default empty token set in AsyncStorage');
      }
    } catch (error) {
      console.error('Error initializing default token:', error);
    }
  };

  // ...existing code...
useEffect(() => {
  const initializeApp = async () => {
    try {
      await initializeDefaultToken();
      const jwt = await getToken();
      
      if (jwt && jwt !== '' && !isLoggedIn) {
        try {
          const response = await loginWithJWT(jwt);
          if (response?.user) {
            const userData = await getUserInfo();
            
            if (userData) {
              console.log('User data loaded successfully:', userData);
              setToken(jwt);
              setUserInfo(userData);
              setInitialRoute('ConversationListScreen');
              setIsLoggedIn(true);
            } else {
              console.warn('User data is null or invalid. Redirecting to login.');
              await AsyncStorage.setItem('authToken', '');
              setToken('');
              setInitialRoute('LoginScreen');
            }
          } else {
            console.warn('JWT login failed. Clearing storage.');
            await AsyncStorage.setItem('authToken', '');
            setToken('');
            setUserInfo(null);
            setInitialRoute('LoginScreen');
          }
        } catch (error) {
          console.error('Error during JWT login:', error);
          await AsyncStorage.setItem('authToken', '');
          setToken('');
          setUserInfo(null);
          setInitialRoute('LoginScreen');
        }
      } else {
        setToken('');
        setInitialRoute('LoginScreen');
      }
    } catch (error) {
      console.error('Initialization error:', error);
      await AsyncStorage.setItem('authToken', '');
      setToken('');
      setUserInfo(null);
      setInitialRoute('LoginScreen');
    } finally {
      setIsInitialized(true);
    }
  };

  if (!isInitialized) {
    initializeApp();
  }
}, [isLoggedIn, isInitialized]);


  // Handle token changes after login
  useEffect(() => {
    const handleLoginSuccess = async () => {
      if (token && token !== '' && !isLoggedIn) {
        try {
          const response = await loginWithJWT(token);
          if (response?.user) {
            const userData = await getUserInfo();
            setUserInfo(userData);
            setIsLoggedIn(true);
          } else {
            console.warn('JWT login failed after token update.');
            await AsyncStorage.setItem('authToken', ''); // Reset to empty string
            setToken('');
            setUserInfo(null);
            setInitialRoute('LoginScreen');
          }
        } catch (error) {
          console.error('Error verifying token after login:', error);
          await AsyncStorage.setItem('authToken', ''); // Reset to empty string
          setToken('');
          setUserInfo(null);
          setInitialRoute('LoginScreen');
        }
      }
    };

    if (isInitialized) {
      handleLoginSuccess();
    }
  }, [token, isInitialized]);

  // Show loading screen until initial route is determined
  if (!initialRoute) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <UserInfoContext.Provider value={{ userInfo, setUserInfo }}>
            <SocketContext.Provider value={{ ...socketState, setToken, setIsLoggedIn }}>
              <ReactionPickerProvider>
                <NavigationContainer>
                  <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
                    <Stack.Screen name="LoginScreen" component={LoginScreen} />
                    <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
                    <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
                    <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
                    <Stack.Screen name="ContactsScreen" component={ContactsScreen} />
                    <Stack.Screen name="PersonalScreen" component={PersonalScreen} />
                    <Stack.Screen name="SearchScreen" component={SearchScreen} />
                    <Stack.Screen name="PersonalPageScreen" component={PersonalPageScreen} />
                    <Stack.Screen name="ConversationListScreen" component={ConversationListScreen} />
                    <Stack.Screen name="CreateGroupScreen" component={CreateGroupScreen} />
                    <Stack.Screen name="GroupManagementScreen" component={GroupManagementScreen} />
                    <Stack.Screen name="PrivateConversationInfoScreen" component={PrivateConversationInfo} />
                  </Stack.Navigator>
                  <StatusBar style="auto" />
                </NavigationContainer>
              </ReactionPickerProvider>
            </SocketContext.Provider>
          </UserInfoContext.Provider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}