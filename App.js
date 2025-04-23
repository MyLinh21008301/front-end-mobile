import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import LoginScreen from './screens/Login';
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

import { getToken } from './apis/TokenAPI.js';
import { loginWithJWT } from './apis/AuthAPI.js';
import { getUserInfo } from './apis/UserAPI.js';
import SocketContext from './contexts/SocketContext';
import UserInfoContext from './contexts/UserInfoContext';
import useSocket from './hooks/useSocket';
import BASE_URL from './apis/BaseURL.js';

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Initialize socket only if token exists
  //const socketState = useSocket(token ?  `${BASE_URL}:3002` : null, token);
  const socketState = useSocket(token ?  `http://54.169.214.143:3002` : null, token);

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
            setInitialRoute('ConversationListScreen');
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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <UserInfoContext.Provider value={{ userInfo, setUserInfo }}>
          <SocketContext.Provider value={{ ...socketState, setToken, setIsLoggedIn }}>
            <NavigationContainer>
              <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
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
          </SocketContext.Provider>
        </UserInfoContext.Provider>
      </SafeAreaView>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}