import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_BASE_URL = 'http://localhost:3001/api'; 

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gửi request đăng ký:', error.response?.data || error.message);
    throw error;
  }
};

export const loginUser = async (phone, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      phone,
      password,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.response?.data || error.message);
    throw error;
  }
};

// Lấy user info
export const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
  
      if (!token || !phoneNumber) throw new Error("Missing token or phone number");
  
      const response = await axios.get(`${API_BASE_URL}/users/${phoneNumber}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông tin người dùng:', error.response?.data || error.message);
      throw error;
    }
  };
  
  // update userInfo
  export const updateUserData = async (tempData, user, DEFAULT_AVATAR) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const phoneNumber = await AsyncStorage.getItem("phoneNumber");
      if (!token || !phoneNumber) throw new Error("Missing token or phone number");
  
      const formData = new FormData();
      formData.append("name", tempData.name || "");
      formData.append("phoneNumber", tempData.phoneNumber || phoneNumber);
      formData.append("bio", tempData.bio || "");
      formData.append("dateOfBirth", tempData.dateOfBirth || "");
      formData.append("isMale", tempData.isMale !== undefined ? tempData.isMale.toString() : "true");
  
      if (tempData.baseImg && tempData.baseImg !== user.baseImg && tempData.baseImg !== DEFAULT_AVATAR) {
        const extension = tempData.baseImg.split('.').pop().toLowerCase();
        let type = 'image/jpeg';
        let fileName = 'avatar.jpg';
        if (extension === 'png') { type = 'image/png'; fileName = 'avatar.png'; }
        if (extension === 'jpg' || extension === 'jpeg') { type = 'image/jpeg'; fileName = 'avatar.jpg'; }
  
        formData.append("baseImg", {
          uri: tempData.baseImg,
          type: type,
          name: fileName,
        });
      }
  
      const response = await axios.put(`${API_BASE_URL}/users/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
  
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật người dùng:', error.response?.data || error.message);
      throw error;
    }
  };
  export const fetchFriendsList = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Không tìm thấy thông tin đăng nhập.');
      }
  
      const response = await axios.get(`${API_BASE_URL}/friends/get-friends-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      console.log('Fetch friends response:', response.data); // Debug log
      return response.data.map((friend) => friend.phoneNumber);
    } catch (error) {
      console.error('Error fetching friends list:', error.response?.data || error.message);
      throw error;
    }
  };
  
  export const searchUserByPhone = async (phone) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Không tìm thấy thông tin đăng nhập.');
      }
  
      const response = await axios.post(
        `${API_BASE_URL}/friends/find-person-by-phone`,
        { phone: phone.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      console.log('Search user response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Error searching user:', error.response?.data || error.message);
      throw error;
    }
  };
  
  export const sendFriendRequest = async (receiverPhoneNumber) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        throw new Error('Không tìm thấy thông tin đăng nhập.');
      }
  
      const response = await axios.post(
        `${API_BASE_URL}/friends/send-request`,
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
  
      console.log('Send friend request response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error.response?.data || error.message);
      throw error;
    }
  };