import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BottomNavBar() {
  const navigation = useNavigation();
  const route = useRoute();

  const navItems = [
    { name: 'ConversationsScreen', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
    { name: 'Settings', icon: 'person-outline', activeIcon: 'people' },
    { name: 'PersonalScreen', icon: 'person-outline', activeIcon: 'person' },
  ];

  return (
    <View style={styles.navContainer}>
      {navItems.map((item) => {
        const isActive = route.name === item.name;
        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => navigation.navigate(item.name)}
            style={styles.navItem}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.icon}
              size={26}
              color={isActive ? '#3b82f6' : '#999'} // blue if active
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff', 
    paddingVertical: 10,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#eee',
    borderBottomColor: '#eee',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
  },
});
