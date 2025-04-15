import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native'; 
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Import các màn hình
import LoginScreen from './screens/Login';
import RegisterScreen from './screens/Register';
import Home from './screens/Home';
// import AddFriend from './screens/AddFriend';
// import FriendRequestScreen from './screens/FriendRequest';
// import NotificationScreen from './screens/NotificationScreen';
import ProfileScreen from './screens/ProfileScreen';
import TestScreen from './screens/Text';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={Home} />
        {/* <Stack.Screen name="Chat" component={AddFriend} /> */}
        {/* <Stack.Screen name="FriendRequest" component={FriendRequestScreen} /> */}
        {/* <Stack.Screen name="Notifications" component={NotificationScreen} /> */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Test" component={TestScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}