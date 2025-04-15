import axios from 'axios';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';


const AUTH_API = {
  register: `${BASE_URL}/auth/register`,
  login: `${BASE_URL}/auth/login`,
  loginWithJWT: `${BASE_URL}/auth/login-with-jwt`,
  initConversation: `${BASE_URL}/conversations/initialize/`,
  text: `${BASE_URL}/messages/text`,
};

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(AUTH_API.register, userData, {
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
    const response = await axios.post(AUTH_API.login, {
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

export const loginWithJWT = async (jwt) => {
  try {
    const response = await axios.post(AUTH_API.loginWithJWT, { jwt }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng nhập với JWT:', error.response?.data || error.message);
    throw error;
  }
};

export const initConversation = async (jwt, conversationId) => {
  try {
    const response = await axios.get(AUTH_API.initConversation + conversationId, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng nhập với JWT:', error.response?.data || error.message);
    throw error;
  }
};

export const text = async (jwt, conversationId, content) => {
  try {
    const response = await axios.post(AUTH_API.text, {
      conversationId: conversationId,
      senderId: '',
      content: content,
      type: 'TEXT',
      
    },{
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi đăng nhập với JWT:', error.response?.data || error.message);
    throw error;
  }
};