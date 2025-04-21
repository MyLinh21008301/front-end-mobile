import axios from 'axios';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';

const USER_API = {
  whoAmI: `${BASE_URL}/users/whoami`,
};

export const getUserInfo = async () => {
  try {
    const jwt = await getToken();
    if (!jwt) {
      throw new Error('No JWT found');
    }

    const response = await axios.post(
      USER_API.whoAmI,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user info:', error.response?.data || error.message);
    throw error;
  }
};