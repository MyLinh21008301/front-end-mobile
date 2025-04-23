import axios from 'axios';
import BASE_URL from './BaseURL';
import { getToken } from './TokenAPI';
import { Platform } from 'react-native';

const CONVERSATION_API = {
  base: `${BASE_URL}/conversations`,
  initConversation: `${BASE_URL}/conversations/initialize`,
  markAsRead: `${BASE_URL}/conversations/mark-as-read`,
  createGroup: `${BASE_URL}/conversations/create-group`,
  createGroupWithImg: `${BASE_URL}/conversations/group`,
  addMembers: `${BASE_URL}/conversations`,
  removeMember: `${BASE_URL}/conversations`,
  leaveGroup: `${BASE_URL}/conversations`,
  deleteGroup: `${BASE_URL}/conversations`,
  joinGroup: `${BASE_URL}/conversations`,
  members: `${BASE_URL}/conversations`,
  searchMembers: `${BASE_URL}/conversations`,
  updateAdmin: `${BASE_URL}/conversations`,
  updateGroupInfo: `${BASE_URL}/conversations`,
};

const getAuthHeaders = (jwt) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${jwt}`,
});

const getMultipartHeaders = (jwt) => ({
  'Content-Type': 'multipart/form-data',
  'Authorization': `Bearer ${jwt}`,
});

// Get all conversations
export const getConversations = async (jwt) => {
  try {
    const response = await axios.get(CONVERSATION_API.base, {
      headers: getAuthHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error.response?.data || error.message);
    throw error;
  }
};

// Get conversation details
export const getConversationDetail = async (jwt, conversationId) => {
  try {
    const response = await axios.get(`${CONVERSATION_API.base}/${conversationId}`, {
      headers: getAuthHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching conversation details:', error.response?.data || error.message);
    throw error;
  }
};

// Initialize conversation and mark notifications as read
export const initConversation = async (jwt, conversationId) => {
  try {
    const response = await axios.get(`${CONVERSATION_API.initConversation}/${conversationId}`, {
      headers: getAuthHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error('Error initializing conversation:', error.response?.data || error.message);
    throw error;
  }
};

// Mark all messages as read
export const markAllMessagesAsRead = async (jwt, conversationId) => {
  try {
    await axios.post(`${CONVERSATION_API.markAsRead}/${conversationId}`, null, {
      headers: getAuthHeaders(jwt),
    });
  } catch (error) {
    console.error('Error marking messages as read:', error.response?.data || error.message);
    throw error;
  }
};

// Delete conversation (private or group)
export const deleteConversation = async (jwt, conversationId) => {
  try {
    await axios.delete(`${CONVERSATION_API.base}/${conversationId}`, {
      headers: getAuthHeaders(jwt),
    });
  } catch (error) {
    console.error('Error deleting conversation:', error.response?.data || error.message);
    throw error;
  }
};

// Create group chat (JSON request)
export const createGroupChat = async (jwt, request) => {
  try {
    const response = await axios.post(CONVERSATION_API.createGroup, request, {
      headers: getAuthHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating group chat:', error.response?.data || error.message);
    throw error;
  }
};

// Create group chat with image (multipart form data)
export const createGroupWithImage = async (jwt, name, baseImg, memberIds) => {
  try {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('memberIds', JSON.stringify(memberIds));

    console.log(baseImg, 'baseImg');

    if (baseImg) {
      if (Platform.OS === 'web' && baseImg.file) {
        // Web: Use raw File object
        formData.append('baseImg', baseImg.file, baseImg.name || `group_image_${Date.now()}${getExtensionFromMimeType(baseImg.type)}`);
      } else if (baseImg.uri) {
        // Mobile: Handle iOS/Android URIs
        formData.append('baseImg', {
          uri: Platform.OS === 'ios' ? baseImg.uri.replace('file://', '') : baseImg.uri,
          type: baseImg.mimeType || baseImg.type || 'image/jpeg',
          name: baseImg.name || `group_image_${Date.now()}${getExtensionFromMimeType(baseImg.mimeType || baseImg.type)}`,
        });
      } else {
        throw new Error('Invalid image object: neither uri nor file provided');
      }
    }

    console.log('FormData baseImg:', formData.get('baseImg'));
    const response = await axios.post(
      CONVERSATION_API.createGroupWithImg,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Create group error:', error.response?.data || error.message);
    throw error;
  }
};

// Add members to group
export const addMembers = async (jwt, conversationId, newMembersPhone) => {
  try {
    await axios.post(`${CONVERSATION_API.addMembers}/${conversationId}/add-members`, { newMembersPhone }, {
      headers: getAuthHeaders(jwt),
    });
  } catch (error) {
    console.error('Error adding members:', error.response?.data || error.message);
    throw error;
  }
};

// Remove member from group
export const removeMember = async (jwt, conversationId, memberPhone) => {
  try {
    await axios.delete(`${CONVERSATION_API.removeMember}/${conversationId}/delete-member`, {
      headers: getAuthHeaders(jwt),
      params: { memberPhone },
    });
  } catch (error) {
    console.error('Error removing member:', error.response?.data || error.message);
    throw error;
  }
};

// Leave group
export const leaveGroup = async (jwt, conversationId, newLeaderPhone) => {
  try {
    await axios.post(`${CONVERSATION_API.leaveGroup}/${conversationId}/leave`, { newLeaderPhone }, {
      headers: getAuthHeaders(jwt),
    });
  } catch (error) {
    console.error('Error leaving group:', error.response?.data || error.message);
    throw error;
  }
};

// Delete group
export const deleteGroup = async (jwt, conversationId) => {
  try {
    await axios.delete(`${CONVERSATION_API.deleteGroup}/${conversationId}/delete-group`, {
      headers: getAuthHeaders(jwt),
    });
  } catch (error) {
    console.error('Error deleting group:', error.response?.data || error.message);
    throw error;
  }
};

// Join group
export const joinGroup = async (jwt, conversationId) => {
  try {
    await axios.post(`${CONVERSATION_API.joinGroup}/${conversationId}/join`, null, {
      headers: getAuthHeaders(jwt),
    });
  } catch (error) {
    console.error('Error joining group:', error.response?.data || error.message);
    throw error;
  }
};

// Get group members
export const getGroupMembers = async (jwt, conversationId) => {
  try {
    const response = await axios.get(`${CONVERSATION_API.members}/${conversationId}/members`, {
      headers: getAuthHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching group members:', error.response?.data || error.message);
    throw error;
  }
};

// Search group members
export const searchMembers = async (jwt, conversationId, keyword) => {
  try {
    const response = await axios.get(`${CONVERSATION_API.searchMembers}/${conversationId}/members/search`, {
      headers: getAuthHeaders(jwt),
      params: { keyword },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching members:', error.response?.data || error.message);
    throw error;
  }
};

// Update admin status
export const updateAdmin = async (jwt, conversationId, targetUserId, isAdmin) => {
  try {
    await axios.put(`${CONVERSATION_API.updateAdmin}/${conversationId}/admin`, { targetUserId, isAdmin }, {
      headers: getAuthHeaders(jwt),
    });
  } catch (error) {
    console.error('Error updating admin:', error.response?.data || error.message);
    throw error;
  }
};

// Update group info (multipart form data)
export const updateGroupInfo = async (jwt, conversationId, conversationName, baseImg) => {
  try {
    const formData = new FormData();
    if (conversationName) formData.append('conversationName', conversationName);
    if (baseImg) formData.append('baseImg', baseImg);

    const response = await axios.put(`${CONVERSATION_API.updateGroupInfo}/${conversationId}/info`, formData, {
      headers: getMultipartHeaders(jwt),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating group info:', error.response?.data || error.message);
    throw error;
  }
};

const getExtensionFromMimeType = (mimeType) => {
  if (!mimeType) return '';

  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/csv': '.csv',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
  };

  return mimeToExt[mimeType] || '';
};