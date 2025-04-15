import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';

const FRIENDS_API = {
  trySearch: `${BASE_URL}/friends/try-to-search`,
  findByPhone: `${BASE_URL}/friends/find-person-by-phone`,
  findByName: `${BASE_URL}/friends/find-people-by-name-keyword`,
};

/**
 * Saves a search query to AsyncStorage, adding it to the front and limiting to 100.
 * If the query exists, it’s moved to the front. Oldest queries are removed if limit is exceeded.
 * @param {string} query - The search query to save
 */
export const saveSearchQuery = async (query) => {
  try {
    const existingQueries = await AsyncStorage.getItem('searchQueries');
    let queries = existingQueries ? JSON.parse(existingQueries) : [];

    // Remove if already exists to avoid duplication
    queries = queries.filter(q => q !== query);

    // Add to the front 
    queries.unshift(query);

    // Limit to 100
    if (queries.length > 100) {
      queries = queries.slice(0, 100);
    }

    await AsyncStorage.setItem('searchQueries', JSON.stringify(queries));
  } catch (error) {
    console.error('Error saving search query:', error);
  }
};

/**
 * Retrieves saved search queries from AsyncStorage.
 * @returns {Promise<string[]>} - Array of saved queries
 */
export const getSavedQueries = async () => {
  try {
    const queries = await AsyncStorage.getItem('searchQueries');
    return queries ? JSON.parse(queries) : [];
  } catch (error) {
    console.error('Error getting saved queries:', error);
    return [];
  }
};

/**
 * Attempts to search friends using the provided query.
 * @param {Object} param - Object containing the query
 * @param {string} param.query - The search query
 * @returns {Promise} - Axios response
 */
export const trySearchFriends = async ({ query }) => {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const url = FRIENDS_API.trySearch;

  return axios.post(url, { query }, { headers });
};

/**
 * Searches for people by phone or name, saving the query in the process.
 * @param {string} query - The search query
 * @returns {Promise<Object>} - Search results with a data property
 */
export const findPeople = async (query) => {
    const authToken = await getToken();
    const headers = { Authorization: `Bearer ${authToken}` };
  
    try {
      await saveSearchQuery(query); 
  
      const isPhone = /^\+\d+$/.test(query.trim());
  
      if (isPhone) {
        const response = await axios.post(
          FRIENDS_API.findByPhone,
          { phone: query.trim() },
          { headers }
        );
        return { data: response.data ? [response.data] : [] };
      } else {
        const response = await axios.post(
          FRIENDS_API.findByName,
          { nameKeyword: query.trim() },
          { headers }
        );
  
        const allPeople = [
          ...(response.data.friends || []),
          ...(response.data.contacted || []),
          ...(response.data.othersWithSharedGroups?.map(e => e.user) || []),
        ];
  
        // Remove duplicates by phoneNumber
        const seen = new Set();
        const uniquePeople = allPeople.filter(p => {
          if (seen.has(p.phoneNumber)) return false;
          seen.add(p.phoneNumber);
          return true;
        });
  
        return { data: uniquePeople };
      }
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  };