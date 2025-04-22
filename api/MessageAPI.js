
import axios from 'axios';
import { Platform } from 'react-native';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';

const MESSAGE_API = {
  text: `${BASE_URL}/messages/text`,
  file: `${BASE_URL}/messages/file`,
  callEvent: `${BASE_URL}/messages/call-event`,
  recallMessage: `${BASE_URL}/messages`,
  addReaction: `${BASE_URL}/messages`,
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
        Authorization: `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error when sending text message with JWT:', error.response?.data || error.message);
    throw error;
  }
};

// Send file message
export const sendFile = async (jwt, conversationId, file) => {
  try {
    let blob;
    let filename = file.name;
    let mimeType = file.type || 'application/octet-stream';

    // Check if a raw File object is provided (web platform)
    if (file.file && Platform.OS === 'web') {
      blob = file.file;
      filename = file.name || `media_${Date.now()}`;
    }
    // Check if the file.uri is a data URL
    else if (file.uri && file.uri.startsWith('data:')) {
      const dataurl = file.uri;
      const arr = dataurl.split(',');
      mimeType = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      blob = new Blob([u8arr], { type: mimeType });

      const extension = mimeType.split('/')[1] || 'file';
      filename = file.name ? `${file.name}.${extension}` : `media_${Date.now()}.${extension}`;
    } else {
      throw new Error('File URI not supported on web');
    }

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
    formData.append('file', blob, filename);

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
      content: callStatus,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
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
// import axios from 'axios';
// import { Platform } from 'react-native';
// import BASE_URL from './BaseURL';
// import { getToken } from './TokenAPI';

// const MESSAGE_API = {
//   text: `${BASE_URL}/messages/text`,
//   file: `${BASE_URL}/messages/file`,
//   callEvent: `${BASE_URL}/messages/call-event`,
// };

// export const text = async (jwt, conversationId, content) => {
//   try {
//     const response = await axios.post(MESSAGE_API.text, {
//       conversationId: conversationId,
//       senderId: '',
//       content: content,
//       type: 'TEXT',
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${jwt}`,
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error when sending text message with JWT:', error.response?.data || error.message);
//     throw error;
//   }
// };

// export const sendFile = async (jwt, conversationId, file) => {
//   try {
//     if (!conversationId) {
//       throw new Error('Không tìm thấy hội thoại.');
//     }

//     let blob = file.file;
//     let filename = file.name;
//     let mimeType = file.type || 'application/octet-stream';
//     let contentDescription = file.contentDescription || 'File';

//     if (Platform.OS !== 'web' && file.uri) {
//       const response = await fetch(file.uri);
//       blob = await response.blob();
//     }

//     if (!blob) {
//       throw new Error('Không tìm thấy file để gửi.');
//     }

//     if (mimeType === 'image') {
//       mimeType = 'image/jpeg';
//     } else if (mimeType === 'video') {
//       mimeType = 'video/mp4';
//     }

//     const extension = mimeType.split('/')[1] || 'file';
//     if (!filename.includes('.')) {
//       filename = `${filename}.${extension}`;
//     }

//     const formData = new FormData();
//     const requestJson = JSON.stringify({
//       conversationId: conversationId,
//       type: 'MEDIA',
//       content: contentDescription,
//     });
//     formData.append('request', requestJson, {
//       filename: 'request.json',
//       contentType: 'application/json',
//     });
//     formData.append('file', blob, filename);

//     console.log('Sending FormData:', {
//       conversationId,
//       filename,
//       mimeType,
//       contentDescription,
//     });

//     const response = await axios.post(MESSAGE_API.file, formData, {
//       headers: {
//         Authorization: `Bearer ${jwt}`,
//         'Content-Type': 'multipart/form-data',
//       },
//     });

//     return response.data;
//   } catch (error) {
//     console.error('Error when sending file message with JWT:', error.response?.data || error.message);
//     throw error;
//   }
// };

// export const sendCallEvent = async (jwt, conversationId, callStatus) => {
//   try {
//     const response = await axios.post(MESSAGE_API.callEvent, {
//       conversationId: conversationId,
//       type: 'CALL',
//       content: callStatus,
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${jwt}`,
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error when sending call event with JWT:', error.response?.data || error.message);
//     throw error;
//   }
// };