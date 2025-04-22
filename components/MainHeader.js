import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Colors from '../constants/colors';

const MainHeader = () => {
  const navigation = useNavigation();

  const openAdditionalOptionPanel = () => {
    // You can replace this with your own logic (e.g. show modal)
    console.log('Additional Option Panel Opened');
  };

  return (
    <View style={styles.container}>
      {/* Center: Search Bar */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => navigation.navigate('SearchScreen')}
      >
          <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          editable={false}
          placeholder="Search..."
          placeholderTextColor="gray"
          style={styles.searchInput}
          pointerEvents="none"
        />
      </TouchableOpacity>

      {/* Right: Add Button */}
      <TouchableOpacity onPress={openAdditionalOptionPanel} style={styles.iconButton}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
};

export default MainHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#eee',
    borderBottomColor: '#eee',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  iconButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
});
