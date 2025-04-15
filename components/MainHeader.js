import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MainHeader = () => {
  const navigation = useNavigation();

  const openAdditionalOptionPanel = () => {
    // You can replace this with your own logic (e.g. show modal)
    console.log('Additional Option Panel Opened');
  };

  return (
    <View style={styles.container}>
      {/* Left: Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Center: Search Bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('SearchScreen')}
      >
        <Ionicons name="search" size={24} color="gray" style={{ marginRight: 6 }} />
        <TextInput
          editable={false}
          placeholder="Search..."
          placeholderTextColor="gray"
          style={{ color: 'gray', flex: 1 }}
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
    backgroundColor: '#fff', 
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
});
