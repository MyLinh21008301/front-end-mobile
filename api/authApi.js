import axios from 'axios';

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
