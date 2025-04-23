import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const MainHeader = () => {
  const navigation = useNavigation();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const dropdownOptions = [
    { id: 'create_group', label: 'Create Group', action: () => navigation.navigate('CreateGroupScreen') },
    // Add more options here if needed
  ];

  const openAdditionalOptionPanel = () => {
    setIsDropdownVisible(true);
  };

  const closeDropdown = () => {
    setIsDropdownVisible(false);
  };

  const renderDropdownItem = ({ item }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        item.action();
        closeDropdown();
      }}
    >
      <Text style={styles.dropdownText}>{item.label}</Text>
    </TouchableOpacity>
  );

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

      {/* Dropdown Modal */}
      <Modal
        transparent
        visible={isDropdownVisible}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeDropdown}>
          <View style={styles.dropdownContainer}>
            <FlatList
              data={dropdownOptions}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => item.id}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60, // Adjust based on header height
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 10,
    width: 200,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
});

export default MainHeader;