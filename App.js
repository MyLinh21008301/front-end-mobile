import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import ConversationsScreen from './screens/ConversationsScreen';
import ContactsScreen from './screens/ContactsScreen';
import PersonalScreen from './screens/PersonalScreen';
import SearchScreen from './screens/SearchScreen';
import PersonalPageScreen from './screens/PersonalPageScreen';
import ConversationScreen from './screens/ConversationScreen';

import { getToken } from './api/TokenAPI';
import { loginWithJWT } from './api/AuthAPI';
import SocketContext from './SocketContext'; // Import the context
import useSocket from './hooks/useSocket'; // Import the useSocket hook

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  // Initialize socket with URL and token
  const [token, setToken] = useState(null);
  const socketState = useSocket('http://54.169.214.143:3002', token); // Replace with your socket URL

  useEffect(() => {
    const checkJWT = async () => {
      try {
        const jwt = await getToken();
        setToken(jwt); // Set token for socket
        if (jwt) {
          const response = await loginWithJWT(jwt);
          if (response && response.user) {
            setInitialRoute('ConversationsScreen');
          } else {
            setInitialRoute('LoginScreen');
          }
        } else {
          setInitialRoute('LoginScreen');
        }
      } catch (error) {
        console.log('JWT login failed:', error);
        setInitialRoute('LoginScreen');
      }
    };

    checkJWT();
  }, []);

  if (initialRoute === null) return null; // or a splash/loading screen

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <SocketContext.Provider value={socketState}>
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}