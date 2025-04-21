import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';

const FRIENDS_API = {
  trySearch: `${BASE_URL}/friends/try-to-search`,
  findByPhone: `${BASE_URL}/friends/find-person-by-phone`,
  findByName: `${BASE_URL}/friends/find-people-by-name-keyword`,
  getFriendsList: `${BASE_URL}/friends/get-friends-list`,
  sendRequest: `${BASE_URL}/friends/send-request`,
  acceptRequest: `${BASE_URL}/friends/accept-request`,
  checkStatus: `${BASE_URL}/friends/check-friend-status`,
  cancelRequest: `${BASE_URL}/friends/cancel-request`,
  rejectRequest: `${BASE_URL}/friends/reject-request`,
  removeFriend: `${BASE_URL}/friends/remove-friend`,
  getFriendRequests: `${BASE_URL}/friends/get-friend-requests`,
  checkRequestStatus: `${BASE_URL}/friends/check-request-status`,
  generateToken: `${BASE_URL}/friends/generate-token`,
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
      return { data: response.data ? response.data : [] };
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

/**
 * Finds a person by phone number and returns the first result.
 * @param {string} phone - The phone number to search
 * @returns {Promise<Object|null>} - The first matching person or null
 */
export const findFirstPersonByPhone = async (phone) => {
  const authToken = await getToken();
  const headers = { Authorization: `Bearer ${authToken}` };

  try {
    const response = await axios.post(
      FRIENDS_API.findByPhone,
      { phone: phone.trim() },
      { headers }
    );

    const data = response.data;

    // If the response is an object representing a person, return it
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data;
    }

    // If it's an array, return the first person (fallback, just in case)
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error('Error finding person by phone:', error);
    throw error;
  }
};

/**
 * Fetches the user's friends list from the server.
 * @returns {Promise<Object[]>} - List of friend objects
 */
export const getFriendsList = async () => {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const response = await axios.get(FRIENDS_API.getFriendsList, { headers });
    
    // Filter out nulls (based on your data sample)
    return response.data.filter(friend => friend !== null);
  } catch (error) {
    console.error('Error fetching friends list:', error);
    throw error;
  }
};

/**
 * Sends a friend request to the specified phone number.
 * @param {string} receiverPhoneNumber - The phone number of the request receiver
 * @returns {Promise<Object>} - Response data
 */
export const sendFriendRequest = async (receiverPhoneNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.post(
      FRIENDS_API.sendRequest,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          receiverPhoneNumber,
        },
      }
    );

    console.log('Send friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending friend request:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Accepts a friend request from the specified phone number.
 * @param {string} senderPhoneNumber - The phone number of the request sender
 * @returns {Promise<Object>} - Response data
 */
export const acceptFriendRequest = async (senderPhoneNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.post(
      FRIENDS_API.acceptRequest,
      null,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          senderPhoneNumber,
        },
      }
    );

    console.log('Accept friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error accepting friend request:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Cancels a sent friend request to the specified phone number.
 * @param {string} receiverPhoneNumber - The phone number of the request receiver
 * @returns {Promise<string>} - Success message
 */
export const cancelFriendRequest = async (receiverPhoneNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.delete(FRIENDS_API.cancelRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        receiverPhoneNumber,
      },
    });

    console.log('Cancel friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error canceling friend request:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Rejects a received friend request from the specified phone number.
 * @param {string} senderPhoneNumber - The phone number of the request sender
 * @returns {Promise<string>} - Success message
 */
export const rejectFriendRequest = async (senderPhoneNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.delete(FRIENDS_API.rejectRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        senderPhoneNumber,
      },
    });

    console.log('Reject friend request response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error rejecting friend request:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Removes a friend with the specified phone number.
 * @param {string} friendPhoneNumber - The phone number of the friend to remove
 * @returns {Promise<string>} - Success message
 */
export const removeFriend = async (friendPhoneNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.delete(FRIENDS_API.removeFriend, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        friendPhoneNumber,
      },
    });

    console.log('Remove friend response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error removing friend:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetches the list of pending friend requests.
 * @returns {Promise<Object[]>} - List of user objects representing friend requests
 */
export const getFriendRequests = async () => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.get(FRIENDS_API.getFriendRequests, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Get friend requests response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching friend requests:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Checks the status of a friend request with the specified phone number.
 * @param {string} senderPhoneNumber - The phone number of the request sender
 * @returns {Promise<boolean>} - Whether the request is pending
 */
export const checkRequestStatus = async (senderPhoneNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.get(`${FRIENDS_API.checkRequestStatus}/${senderPhoneNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Check request status response:', response.data);
    return response.data.isPending;
  } catch (error) {
    console.error('Error checking request status:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Checks the friend status with the specified phone number.
 * @param {string} friendPhoneNumber - The phone number to check
 * @returns {Promise<boolean>} - Whether the user is a friend
 */
export const checkFriendStatus = async (friendPhoneNumber) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('Không tìm thấy thông tin đăng nhập.');
    }

    const response = await axios.get(`${FRIENDS_API.checkStatus}/${friendPhoneNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Check friend status response:', response.data);
    return response.data.isFriend;
  } catch (error) {
    console.error('Error checking friend status:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Generates a JWT token for the specified phone number (temporary endpoint).
 * @param {string} phoneNumber - The phone number to generate token for
 * @returns {Promise<string>} - Generated JWT token
 */
export const generateToken = async (phoneNumber) => {
  try {
    const response = await axios.get(FRIENDS_API.generateToken, {
      params: {
        phoneNumber,
      },
    });

    console.log('Generate token response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating token:', error.response?.data || error.message);
    throw error;
  }
};