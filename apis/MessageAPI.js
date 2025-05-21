import { Platform } from 'react-native';

import BASE_URL from './BaseURL';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

const MESSAGE_API = {
  text: `${BASE_URL}/messages/text`,
  file: `${BASE_URL}/messages/file`,
  callEvent: `${BASE_URL}/messages/call-event`,
  recallMessage: `${BASE_URL}/messages`,
  addReaction: `${BASE_URL}/messages`,
};

// Send text message (unchanged)
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
// Helper function to determine MIME type from file extension
const getMimeTypeFromFileName = (fileName) => {
  if (!fileName) return 'image/jpeg';
  const extension = fileName.split('.').pop().toLowerCase();
  const mimeTypes = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  };
  return mimeTypes[extension] || 'image/jpeg';
};

export const sendFile = async (jwt, conversationId, file) => {
  console.log('Sending file with JWT:', file);
  try {
    console.log('Uploading file with MIME type:', file.mimeType || file.type);
    console.log('Uploading file:', file);

    const formData = new FormData();

    // Determine file type (MEDIA or FILE)
    let fileType = 'FILE';
    const mimeType = file.mimeType || file.type || getMimeTypeFromFileName(file.fileName);
    if (mimeType && ['image/', 'video/', 'audio/'].some(type => mimeType.startsWith(type))) {
      fileType = 'MEDIA';
    }

    // Create request object matching MessageRequestDTO
    const requestObject = {
      conversationId: conversationId,
      content: file.uri || `media_${Date.now()}`,
      type: fileType,
      replyTo: null,
    };

    // Append request as a JSON string
    formData.append('request', JSON.stringify(requestObject));

    if (file.uri) {
      // Prepare file info
      const fileExtension = mimeType.split('/')[1] || 'jpg';
      const fileName = file.fileName || `file_${Date.now()}.${fileExtension}`;

      // Ensure correct URI for platform
      const fileUri = Platform.OS === 'android' && !file.uri.startsWith('file://')
        ? `file://${file.uri}`
        : file.uri;

      // Verify file accessibility
      const fileStat = await FileSystem.getInfoAsync(fileUri);
      if (!fileStat.exists) {
        throw new Error(`File does not exist at URI: ${fileUri}`);
      }

      // Create file info for FormData
      const fileInfo = {
        uri: fileUri,
        type: mimeType == 'application/octet-stream' ? mimeType : 'image/jpeg',
        name: fileName,
      };

      console.log('File info:', fileInfo);
      

      // Append file to FormData with the key 'file'
      formData.append('file', fileInfo);

      console.log('FormData request object:', requestObject);
      console.log('FormData file info:', fileInfo);

      // Perform axios request
      const response = await axios.post(MESSAGE_API.file, formData, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Content-Type': 'multipart/form-data',
          
        },
      });

      console.log('File upload successful:', response.data);
      return response.data;
    } else {
      throw new Error('File URI is missing.');
    }
  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    throw error;
  }
};

// Send call event (unchanged)
export const sendCallEvent = async (jwt, conversationId, callStatus) => {
  try {
    const response = await axios.post(MESSAGE_API.callEvent, {
      conversationId: conversationId,
      type: 'CALL',
      content: callStatus,
    }, {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
        
        
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error when sending call event with JWT:', error.response?.data || error.message);
    throw error;
  }
};

// Recall message
export const recallMessage = async (jwt, messageId) => {
  try {
    const url = `${MESSAGE_API.recallMessage}/${messageId}`;
    console.log('Sending recall request to:', url);
    await axios.delete(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error recalling message:', error.response?.data || error.message);
    throw error;
  }
};

// Add reaction
export const addReaction = async (jwt, messageId, emoji) => {
  try {
    const payload = { emoji };
    const url = `${MESSAGE_API.addReaction}/${messageId}/reactions`;
    console.log('Sending reaction request to:', url, 'Payload:', payload);
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error adding reaction:', error.response?.data || error.message);
    throw error;
  }
};