import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import ContactsScreen from './screens/ContactsScreen';
import PersonalScreen from './screens/PersonalScreen';
import ProfileScreen from './screens/ProfileScreen';
import SearchScreen from './screens/SearchScreen';
import PersonalPageScreen from './screens/PersonalPageScreen';
import ConversationListScreen from './screens/ConversationListScreen/ConversationListScreen.js';
import ConversationScreen from './screens/ConversationScreen/ConversationScreen.js';
import Setting from './screens/Setting';
import FriendRequests from './screens/FriendRequest.js';
import GroupScreen from './screens/GroupScreen.js';
import GroupMembersScreen from './screens/GroupMembersScreen.js';
// import CallScreen from './screens/CallScreen';


import { getToken } from './api/TokenAPI';
import { loginWithJWT } from './api/authApi.js';
import { getUserInfo } from './api/UserAPI';
import SocketContext from './contexts/SocketContext';
import UserInfoContext from './contexts/UserInfoContext';
import useSocket from './hooks/useSocket';
import Colors from './constants/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName='ConversationsScreen'
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'ConversationsScreen') {
            iconName = 'commenting';
          } else if (route.name === 'Settings') {
            iconName = 'pencil-square';
          } else if (route.name === 'Contacts') {
            iconName = 'address-book';
          }
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: Colors.btnBackground,
          borderTopWidth: 1,
          borderTopColor: '#333',
          paddingVertical: 10,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name='ConversationsScreen' component={ConversationListScreen} />
      <Tab.Screen name='Contacts' component={ContactsScreen} />
      <Tab.Screen name='Settings' component={Setting} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState('LoginScreen');
  const [token, setToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(null); 

  // Ensure socket initialization
  const socketState = useSocket(token ? 'http://192.168.1.17:3002' : null, token);
  // const socketState = useSocket(token ? 'http://localhost:3002' : null, token);
  useEffect(() => {
    console.log('Socket State:', socketState);
  }, [socketState]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const jwt = await getToken();
        console.log('Retrieved token:', jwt);
        if (jwt) {
          const response = await loginWithJWT(jwt);
          console.log('loginWithJWT response:', response);
          if (response && response.phoneNumber) {
            const userData = await getUserInfo();
            console.log('getUserInfo response:', userData);
            if (userData) {
              setToken(jwt);
              setUserInfo(userData);
              setInitialRoute('Main');
              setIsLoggedIn(true);
            } else {
              console.warn('Failed to fetch user info');
              await AsyncStorage.removeItem('authToken');
              setToken(null);
              setUserInfo(null);
              setInitialRoute('LoginScreen');
            }
          } else {
            console.warn('JWT login failed. Response:', response);
            await AsyncStorage.removeItem('authToken');
            setToken(null);
            setUserInfo(null);
            setInitialRoute('LoginScreen');
          }
        } else {
          console.log('No token found');
          setInitialRoute('LoginScreen');
        }
      } catch (error) {
        console.error('Initialization error:', error.message);
        await AsyncStorage.removeItem('authToken');
        setToken(null);
        setUserInfo(null);
        setInitialRoute('LoginScreen');
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (token && !isLoggedIn) {
      setInitialRoute('LoginScreen');
    }
  }, [token]);

  if (!initialRoute) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <UserInfoContext.Provider
          value={{ userInfo, setUserInfo, currentConversation, setCurrentConversation }}
        >
          <SocketContext.Provider value={{ ...socketState, setToken, setIsLoggedIn }}>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={initialRoute}
              >
                <Stack.Screen name='LoginScreen' component={LoginScreen} />
                <Stack.Screen name='RegisterScreen' component={RegisterScreen} />
                <Stack.Screen name='Main' component={MainTabs} options={{ headerShown: false }} />
                <Stack.Screen name='Settings' component={Setting} />
                <Stack.Screen name='PersonalScreen' component={PersonalScreen} />
                <Stack.Screen name='ProfileScreen' component={ProfileScreen} />
                <Stack.Screen name='SearchScreen' component={SearchScreen} />
                <Stack.Screen name='PersonalPageScreen' component={PersonalPageScreen} />
                <Stack.Screen name='ConversationScreen' component={ConversationScreen} />
                <Stack.Screen name='FriendRequests' component={FriendRequests} />
                <Stack.Screen name='ConversationListScreen' component={ConversationListScreen} />
                <Stack.Screen name='GroupScreen' component={GroupScreen} />
                <Stack.Screen name='GroupMembersScreen' component={GroupMembersScreen} />
                {/* <Stack.Screen name="CallScreen" component={CallScreen} /> */}
              </Stack.Navigator>
              <StatusBar style='auto' />
            </NavigationContainer>
          </SocketContext.Provider>
        </UserInfoContext.Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}