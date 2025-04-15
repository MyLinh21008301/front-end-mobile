import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { findPeople, getSavedQueries } from '../api/FriendAPI';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedQueries, setSavedQueries] = useState([]);
  const [recentPeople, setRecentPeople] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadSavedData();
  }, []);

  
  //Loads saved queries and recent people from AsyncStorage.  
  const loadSavedData = async () => {
    try {
      const queries = await getSavedQueries();
      const people = await AsyncStorage.getItem('recentPeople');
      setSavedQueries(queries);
      setRecentPeople(people ? JSON.parse(people) : []);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  /**
   * Saves a person to the recent people list, limiting to 100.
   * @param {Object} person - The person object to save
   */
  const saveRecentPerson = async (person) => {
    try {
      const existingPeople = await AsyncStorage.getItem('recentPeople');
      let people = existingPeople ? JSON.parse(existingPeople) : [];

      // Remove if already exists
      people = people.filter(p => p.phoneNumber !== person.phoneNumber);

      // Add to front
      people.unshift(person);

      // Limit to 100
      if (people.length > 100) {
        people = people.slice(0, 100);
      }

      await AsyncStorage.setItem('recentPeople', JSON.stringify(people));
      setRecentPeople(people);
    } catch (error) {
      console.error('Error saving recent person:', error);
    }
  };

  const handleSearch = async () => {
    //Skip empty queries
    if (!query || query.trim() === '') return; 

    setLoading(true);
    setResults([]);

    try {
      const trimmedQuery = query.trim();
      const res = await findPeople(trimmedQuery);
      setResults(res.data || []);

      // Update savedQueries state to match AsyncStorage logic
      setSavedQueries(prevQueries => {
        // Remove if already exists
        const filteredQueries = prevQueries.filter(q => q !== trimmedQuery);
        // Add to front and limit to 100
        const updatedQueries = [trimmedQuery, ...filteredQueries].slice(0, 100);
        return updatedQueries;
      });
    } catch (error) {
      console.error('Search error:', error);
    }

    setLoading(false);
  };

  /**
   * Navigates to a person's page and saves them to recent people.
   * @param {Object} person - The selected person
   */
  const handlePersonSelect = (person) => {
    saveRecentPerson(person);
    navigation.navigate('PersonalPageScreen', { person });
  };

  /**
   * Renders a person item for search results.
   * @param {Object} param - Item data
   * @param {Object} param.item - Person object
   */
  const renderPersonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handlePersonSelect(item)}
    >
      <Image
        source={{ uri: item.baseImg }}
        style={styles.avatar}
        resizeMode="cover"
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.phoneNumber}</Text>
        <Text>Status: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Renders a recent person item with hold-to-delete functionality.
   * @param {Object} param - Item data
   * @param {Object} param.item - Person object
   */
  const renderRecentPersonItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handlePersonSelect(item)}
      onLongPress={() => {
        Alert.alert(
          'Delete Recent Person',
          `Do you want to delete "${item.name}" from recently viewed people?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              onPress: async () => {
                try {
                  const existingPeople = await AsyncStorage.getItem('recentPeople');
                  let people = existingPeople ? JSON.parse(existingPeople) : [];
                  people = people.filter(p => p.phoneNumber !== item.phoneNumber);
                  await AsyncStorage.setItem('recentPeople', JSON.stringify(people));
                  setRecentPeople(people);
                } catch (error) {
                  console.error('Error deleting recent person:', error);
                }
              },
            },
          ]
        );
      }}
    >
      <Image
        source={{ uri: item.baseImg }}
        style={styles.avatar}
        resizeMode="cover"
      />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.phoneNumber}</Text>
        <Text>Status: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Renders a saved query item with hold-to-delete functionality.
   * @param {Object} param - Item data
   * @param {string} param.item - Query string
   */
  const renderQueryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.queryItem}
      onPress={() => {
        setQuery(item);
        handleSearch();
      }}
      onLongPress={() => {
        Alert.alert(
          'Delete Recent Search',
          `Do you want to delete "${item}" from recent searches?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              onPress: async () => {
                try {
                  const existingQueries = await AsyncStorage.getItem('searchQueries');
                  let queries = existingQueries ? JSON.parse(existingQueries) : [];
                  queries = queries.filter(q => q !== item);
                  await AsyncStorage.setItem('searchQueries', JSON.stringify(queries));
                  setSavedQueries(queries);
                } catch (error) {
                  console.error('Error deleting search query:', error);
                }
              },
            },
          ]
        );
      }}
    >
      <Text>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
        <TextInput
          placeholder="Enter phone or name..."
          value={query}
          onChangeText={setQuery}
          style={styles.headerInput}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} disabled={loading} style={styles.iconButton}>
          <Ionicons name="search" size={24} color={loading ? '#ccc' : '#000'} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.phoneNumber}
        renderItem={renderPersonItem}
        ListEmptyComponent={
          !loading && results.length === 0 && (
            <Text style={styles.emptyText}>No results found.</Text>
          )
        }
        ListHeaderComponent={loading && <Text>Searching...</Text>}
        style={styles.resultsList}
      />

      {recentPeople.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Viewed People</Text>
          <FlatList
            data={recentPeople}
            keyExtractor={item => item.phoneNumber}
            renderItem={renderRecentPersonItem}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {savedQueries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <FlatList
            data={savedQueries}
            keyExtractor={item => item}
            renderItem={renderQueryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  iconButton: {
    padding: 4,
  },
  headerInput: {
    flex: 1,
    marginHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCCCCC',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: '#f2f2f2',
    padding: 10,
    borderRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ddd',
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  queryItem: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginRight: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
});