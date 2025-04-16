import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import ConversationsScreen from './screens/ConversationsScreen';
import ContactsScreen from './screens/ContactsScreen';
import PersonalScreen from './screens/PersonalScreen';
import SearchScreen from './screens/SearchScreen';
import PersonalPageScreen from './screens/PersonalPageScreen';
import ConversationScreen from './screens/ConversationScreen';

import { getToken } from './api/TokenAPI';
import { loginWithJWT } from './api/AuthAPI.js';
import { getUserInfo } from './api/UserAPI';
import SocketContext from './contexts/SocketContext';
import UserInfoContext from './contexts/UserInfoContext';
import useSocket from './hooks/useSocket';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Initialize socket only if token exists
  const socketState = useSocket(token ? 'http://54.169.214.143:3002' : null, token);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const jwt = await getToken();
        if (jwt && !isLoggedIn) {
          const response = await loginWithJWT(jwt);
          if (response?.user) {
            const userData = await getUserInfo();
            setToken(jwt);
            setUserInfo(userData);
            setInitialRoute('ConversationsScreen');
            setIsLoggedIn(true);
          } else {
            console.warn('JWT login failed. Clearing storage.');
            await AsyncStorage.removeItem('authToken');
            setToken(null);
            setUserInfo(null);
            setInitialRoute('LoginScreen');
          }
        } else {
          setInitialRoute('LoginScreen');
        }
      } catch (error) {
        console.error('Initialization error:', error);
        await AsyncStorage.removeItem('authToken');
        setToken(null);
        setUserInfo(null);
        setInitialRoute('LoginScreen');
      }
    };

    initializeApp();
  }, [isLoggedIn]);

  // Handle token changes after login
  useEffect(() => {
    const handleLoginSuccess = async () => {
      if (token && !isLoggedIn) {
        try {
          const response = await loginWithJWT(token);
          if (response?.user) {
            const userData = await getUserInfo();
            setUserInfo(userData);
            setIsLoggedIn(true);
          } else {
            console.warn('JWT login failed after token update.');
            await AsyncStorage.removeItem('authToken');
            setToken(null);
            setUserInfo(null);
            setInitialRoute('LoginScreen');
          }
        } catch (error) {
          console.error('Error verifying token after login:', error);
          await AsyncStorage.removeItem('authToken');
          setToken(null);
          setUserInfo(null);
          setInitialRoute('LoginScreen');
        }
      }
    };

    handleLoginSuccess();
  }, [token]);

  // Show loading screen until initial route is determined
  if (!initialRoute) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <UserInfoContext.Provider value={{ userInfo, setUserInfo }}>
          <SocketContext.Provider value={{ ...socketState, setToken, setIsLoggedIn }}>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
                <Stack.Screen name="ConversationsScreen" component={ConversationsScreen} />
                <Stack.Screen name="ContactsScreen" component={ContactsScreen} />
                <Stack.Screen name="PersonalScreen" component={PersonalScreen} />
                <Stack.Screen name="SearchScreen" component={SearchScreen} />
                <Stack.Screen name="PersonalPageScreen" component={PersonalPageScreen} />
                <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
              </Stack.Navigator>
              <StatusBar style="auto" />
            </NavigationContainer>
          </SocketContext.Provider>
        </UserInfoContext.Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}