import { Platform } from 'react-native';

import BASE_URL from './BaseURL';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

export const MESSAGE_API = {
  text: `${BASE_URL}/messages/text`,
  file: `${BASE_URL}/messages/file`,
  callEvent: `${BASE_URL}/messages/call-event`,
  recallMessage: `${BASE_URL}/messages`,
  addReaction: `${BASE_URL}/messages`,
};

// Send text message with reply support
export const text = async (jwt, conversationId, content, replyTo = null) => {
  try {
    const response = await axios.post(MESSAGE_API.text, {
      conversationId: conversationId,
      senderId: '',
      content: content,
      type: 'TEXT',
      replyTo: replyTo,
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

// Send file with reply support
export const sendFile = async (jwt, conversationId, file, replyTo = null) => {
  try {
    const formData = new FormData();

    // Determine MIME type and fileType
    let mimeType = file.type || getMimeTypeFromFileName(file.name || file.fileName) || 'image/jpeg';
    let fileType = 'FILE';
    if (mimeType && ['image/', 'video/', 'audio/'].some((type) => mimeType.startsWith(type))) {
      fileType = 'MEDIA';
    }

    // Create request object
    const requestObject = {
      conversationId: conversationId,
      type: fileType,
      replyTo: replyTo,
    };

    formData.append("conversationId", conversationId || "");
    formData.append("type", fileType);
    
    // Add replyTo if provided
    if (replyTo) {
      formData.append("replyTo", replyTo);
    }

    // Handle file object and append to FormData
    if (file.uri) {
      // Mobile case (React Native)
      const fileUri = Platform.OS === 'android' && !file.uri.startsWith('file://')
        ? `file://${file.uri}`
        : file.uri;
      const fileName = file.name || file.fileName || `file_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
      const fileInfo = {
        uri: fileUri,
        type: mimeType,
        name: fileName,
      };
      formData.append('file', fileInfo);
    } else if (file instanceof Blob) {
      // Web case (File object, which is a Blob subclass)
      const fileName = file.name || `file_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
      formData.append('file', file, fileName);
    } else {
      throw new Error('Invalid file object: must have uri (mobile) or be a Blob (web)');
    }

    // Send the request with axios
    const response = await axios.post(MESSAGE_API.file, formData, {
      headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${jwt}`,
          },
    });

    console.log('File upload successful:', response.data);
    return response.data;
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