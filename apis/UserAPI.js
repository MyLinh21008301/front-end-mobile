// import axios from 'axios';
// import BASE_URL from './BaseURL';
// import { getToken } from './TokenAPI';

// const USER_API = {
//   whoAmI: `${BASE_URL}/users/whoami`,
//   updateUser: `${BASE_URL}/users/`,
// };

// // Fetch current user information
// export const getUserInfo = async () => {
//   try {
//     const jwt = await getToken();
//     if (!jwt) {
//       throw new Error('No JWT found');
//     }

//     const response = await axios.post(
//       USER_API.whoAmI,
//       {},
//       {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${jwt}`,
//         },
//       }
//     );
//     // Validate essential user fields
//     const userData = response.data;
//     if (!userData || !userData.phoneNumber) {
//       console.error('Invalid user data received:', userData);
//       return null;
//     }

//     // Provide default values for missing but essential fields
//     if (!userData.baseImg) {
//       userData.baseImg = 'https://via.placeholder.com/150';
//     }
    
//     if (!userData.name) {
//       userData.name = userData.phoneNumber;
//     }

//     return userData;
//   } catch (error) {
//     console.error('Error fetching user info:', error.response?.data || error.message);
//     throw error;
//   }
// };
// // Update user information
// export const updateUserInfo = async (userInfo) => {
//   try {
//     const jwt = await getToken();
//     if (!jwt) {
//       throw new Error('No JWT found');
//     }

//     // Check if there are file uploads - use FormData for multipart/form-data
//     if (userInfo.baseImg?.uri || userInfo.backgroundImg?.uri) {
//       // Create FormData for sending multipart/form-data
//       const formData = new FormData();
      
//       // Add all text fields to the form data
//       if (userInfo.name !== undefined) formData.append('name', userInfo.name);
//       if (userInfo.bio !== undefined) formData.append('bio', userInfo.bio);
//       if (userInfo.dateOfBirth !== undefined) formData.append('dateOfBirth', userInfo.dateOfBirth);
//       if (userInfo.isMale !== undefined) formData.append('isMale', userInfo.isMale.toString());
//       else if (userInfo.male !== undefined) formData.append('isMale', userInfo.male.toString());
//       if (userInfo.status !== undefined) formData.append('status', userInfo.status);
      
//       // Add image files if present
//       if (userInfo.baseImg?.uri) {
//         formData.append('baseImg', userInfo.baseImg);
//       }
      
//       if (userInfo.backgroundImg?.uri) {
//         formData.append('backgroundImg', userInfo.backgroundImg);
//       }

//       // Send multipart request to the endpoint that accepts form data
//       const response = await axios.put(
//         USER_API.updateUser,
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//             'Authorization': `Bearer ${jwt}`,
//           },
//         }
//       );
      
//       return response.data;
//     } else {
//       // No images to upload, use JSON format for just text data
//       // Create JSON object from user info
//       const jsonData = {
//         name: userInfo.name,
//         bio: userInfo.bio,
//         dateOfBirth: userInfo.dateOfBirth,
//         isMale: userInfo.male, // Use male from editedInfo
//         phoneNumber: userInfo.phoneNumber,
//         baseImg: userInfo.baseImg, // Keep any existing URLs as strings
//         backgroundImg: userInfo.backgroundImg, // Keep any existing URLs as strings
//       };

//       // Use the endpoint for JSON data
//       const response = await axios.put(
//         `${USER_API.updateUser}${jwt}`,
//         jsonData,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//         }
//       );
      
//       return response.data;
//     }
//   } catch (error) {
//     console.error('Error updating user info:', error.response?.data || error.message);
//     throw error;
//   }
// };
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
    const userData = response.data;
    if (!userData || !userData.phoneNumber) {
      console.error('Invalid user data received:', userData);
      return null;
    }

    if (!userData.baseImg) {
      userData.baseImg = 'https://via.placeholder.com/150';
    }
    
    if (!userData.name) {
      userData.name = userData.phoneNumber;
    }

    // Đảm bảo male luôn là boolean
    if (userData.male === undefined || userData.male === null) {
      userData.male = true; // Giá trị mặc định
    }

    return userData;
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
      throw new Error('JWT not found');
    }

    const formData = new FormData();

    // Add text fields
    formData.append('name', userInfo.name || '');
    formData.append('bio', userInfo.bio || '');
    formData.append('dateOfBirth', userInfo.dateOfBirth || '');
    formData.append('isMale', userInfo.male !== undefined && userInfo.male !== null ? userInfo.male.toString() : 'true');
    formData.append('status', userInfo.status || '');

    // Add image files only if they are new (have uri)
    if (userInfo.baseImg?.uri) {
      formData.append('baseImg', {
        uri: userInfo.baseImg.uri,
        name: userInfo.baseImg.name || 'baseImg.jpg',
        type: userInfo.baseImg.type || 'image/jpeg',
      });
    }

    if (userInfo.backgroundImg?.uri) {
      formData.append('backgroundImg', {
        uri: userInfo.backgroundImg.uri,
        name: userInfo.backgroundImg.name || 'backgroundImg.jpg',
        type: userInfo.backgroundImg.type || 'image/jpeg',
      });
    }

    // Log FormData entries for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`FormData entry: ${key} = ${value}`);
    }

    console.log('Sending FormData:', formData);

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
  } catch (error) {
    console.error('Error updating user info:', error.response?.data || error.message);
    throw error;
  }
};