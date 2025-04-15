import axios from 'axios';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';


const MESSAGE_API = {
  text: `${BASE_URL}/messages/text`,
};


export const text = async (jwt, conversationId, content) => {
  try {
    const response = await axios.post(MESSAGE_API.text, {
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
    console.error('Error when sending text message with JWT:', error.response?.data || error.message);
    throw error;
  }
};