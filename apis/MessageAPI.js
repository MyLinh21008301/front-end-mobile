import axios from 'axios';
import {Platform } from 'react-native';

import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';

const MESSAGE_API = {
  text: `${BASE_URL}/messages/text`,
  file: `${BASE_URL}/messages/file`,
  callEvent: `${BASE_URL}/messages/call-event`,
};

// Send text message
export const text = async (jwt, conversationId, content) => {
  try {
    const response = await axios.post(MESSAGE_API.text, {
      conversationId: conversationId,
      senderId: '',
      content: content,
      type: 'TEXT',
    }, {
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

export const sendFile = async (jwt, conversationId, file) => {
  try {
    let blob;
    let filename = file.name;
    let mimeType = file.type || 'application/octet-stream';

    // Check if a raw File object is provided (web platform)
    if (file.file && Platform.OS === 'web') {
      blob = file.file; // Use the File object directly
      filename = file.name || `media_${Date.now()}`;
    }
    // Check if the file.uri is a data URL
    else if (file.uri && file.uri.startsWith('data:')) {
      // Extract MIME type and base64 data from the data URL
      const dataurl = file.uri;
      const arr = dataurl.split(',');
      mimeType = arr[0].match(/:(.*?);/)[1]; // e.g., "image/png"
      const bstr = atob(arr[1]); // Decode base64 to binary string
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mimeType });

      // Determine file extension from MIME type
      const extension = mimeType.split('/')[1] || 'file';
      filename = file.name ? `${file.name}.${extension}` : `media_${Date.now()}.${extension}`;
    } else {
      // Handle mobile file URI if needed (not applicable for web in this case)
      throw new Error('File URI not supported on web');
    }

    // Create content description based on MIME type (for display purposes)
    let contentDescription;
    if (mimeType.startsWith('image/')) {
      contentDescription = 'Image';
    } else if (mimeType.startsWith('video/')) {
      contentDescription = 'Video';
    } else if (mimeType.startsWith('audio/')) {
      contentDescription = 'Audio';
    } else {
      contentDescription = 'File';
    }

    const formData = new FormData();

    // Append the request part as a JSON Blob
    const requestBlob = new Blob(
      [
        JSON.stringify({
          conversationId: conversationId,
          type: 'MEDIA',
          content: contentDescription,
        }),
      ],
      { type: 'application/json' }
    );
    formData.append('request', requestBlob);

    // Append the file Blob with the correct filename
    formData.append('file', blob, filename);

    // Send the request
    const response = await axios.post(MESSAGE_API.file, formData, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error when sending file message with JWT:', error.response?.data || error.message);
    throw error;
  }
};


// Send call event
export const sendCallEvent = async (jwt, conversationId, callStatus) => {
  try {
    const response = await axios.post(MESSAGE_API.callEvent, {
      conversationId: conversationId,
      type: 'CALL',
      content: callStatus, // e.g., "Call started", "Call ended", "Missed call"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error when sending call event with JWT:', error.response?.data || error.message);
    throw error;
  }
};