import axios from 'axios';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';

const USER_API = {
  whoAmI: `${BASE_URL}/users/whoami`,
  updateUser: `${BASE_URL}/users/`,
};

// Fetch current user information
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

// Update user information
export const updateUserInfo = async (userInfo) => {
  try {
    const jwt = await getToken();
    if (!jwt) {
      throw new Error('No JWT found');
    }

    // Check if there are file uploads - use FormData for multipart/form-data
    if (userInfo.baseImg?.uri || userInfo.backgroundImg?.uri) {
      // Create FormData for sending multipart/form-data
      const formData = new FormData();
      
      // Add all text fields to the form data
      if (userInfo.name !== undefined) formData.append('name', userInfo.name);
      if (userInfo.bio !== undefined) formData.append('bio', userInfo.bio);
      if (userInfo.dateOfBirth !== undefined) formData.append('dateOfBirth', userInfo.dateOfBirth);
      if (userInfo.isMale !== undefined) formData.append('isMale', userInfo.isMale.toString());
      else if (userInfo.male !== undefined) formData.append('isMale', userInfo.male.toString());
      if (userInfo.status !== undefined) formData.append('status', userInfo.status);
      
      // Add image files if present
      if (userInfo.baseImg?.uri) {
        formData.append('baseImg', userInfo.baseImg);
      }
      
      if (userInfo.backgroundImg?.uri) {
        formData.append('backgroundImg', userInfo.backgroundImg);
      }

      // Send multipart request to the endpoint that accepts form data
      const response = await axios.put(
        USER_API.updateUser,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${jwt}`,
          },
        }
      );
      
      return response.data;
    } else {
      // No images to upload, use JSON format for just text data
      // Create JSON object from user info
      const jsonData = {
        name: userInfo.name,
        bio: userInfo.bio,
        dateOfBirth: userInfo.dateOfBirth,
        isMale: userInfo.male, // Use male from editedInfo
        phoneNumber: userInfo.phoneNumber,
        baseImg: userInfo.baseImg, // Keep any existing URLs as strings
        backgroundImg: userInfo.backgroundImg, // Keep any existing URLs as strings
      };

      // Use the endpoint for JSON data
      const response = await axios.put(
        `${USER_API.updateUser}${jwt}`,
        jsonData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data;
    }
  } catch (error) {
    console.error('Error updating user info:', error.response?.data || error.message);
    throw error;
  }
};