import axios from 'axios';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';


const CONVERSATION_API = {
  initConversation: `${BASE_URL}/conversations/initialize/`,
};

export const initConversation = async (jwt, conversationId) => {
  try {
    const response = await axios.get(CONVERSATION_API.initConversation + conversationId, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error when load conversation with JWT:', error.response?.data || error.message);
    throw error;
  }
};
