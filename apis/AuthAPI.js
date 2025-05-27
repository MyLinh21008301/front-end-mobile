import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from './BaseURL';

const AUTH_API = {
  register: `${BASE_URL}/auth/register`,
  login: `${BASE_URL}/auth/login`,
  loginWithJWT: `${BASE_URL}/auth/login-with-jwt`,
  forgotPassword: `${BASE_URL}/auth/forgot-password`,
  changePassword: `${BASE_URL}/auth/change-password`,
  sendOtp: `${BASE_URL}/auth/send-otp`,
  verifyOtp: `${BASE_URL}/auth/verify-otp`,
};

// Token management functions
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token || token === '') {
      return null;
    }
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const setToken = async (token) => {
  try {
    if (token && token !== '') {
      await AsyncStorage.setItem('authToken', token);
    } else {
      await AsyncStorage.setItem('authToken', '');
    }
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.setItem('authToken', '');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

// Create authenticated axios instance
const createAuthAxios = async () => {
  const token = await getToken();
  return axios.create({
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

// Send OTP
export const sendOtp = async (phone) => {
  try {
    const response = await axios.post(AUTH_API.sendOtp, { phone }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error.response?.data || error.message);
    throw error;
  }
};

// Verify OTP
export const verifyOtp = async (phone, otp) => {
  try {
    const response = await axios.post(AUTH_API.verifyOtp, { phone, otp }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying OTP:', error.response?.data || error.message);
    throw error;
  }
};

export const registerUser = async (userData, phone, otp) => {
  try {
    // Verify OTP before proceeding with registration
    const otpResponse = await verifyOtp(phone, otp);
    if (!otpResponse.success) {
      throw new Error(otpResponse.message || 'OTP verification failed');
    }

    const response = await axios.post(AUTH_API.register, userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error during registration:', error.response?.data || error.message);
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
    console.error('Error logging in:', error.response?.data || error.message);
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
    console.error('Error logging in with JWT:', error.response?.data || error.message);
    throw error;
  }
};

export const forgotPassword = async (phone, password, otp) => {
  try {
    // Verify OTP before resetting password
    const otpResponse = await verifyOtp(phone, otp);
    if (!otpResponse.success) {
      throw new Error(otpResponse.message || 'OTP verification failed');
    }

    const response = await axios.post(AUTH_API.forgotPassword, {
      phone,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error.response?.data || error.message);
    throw error;
  }
};

export const changePassword = async (phone, newPassword) => {
  try {
    const authAxios = await createAuthAxios();
    const response = await authAxios.post(AUTH_API.changePassword, {
      phone,
      password: newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};
