
import axios from 'axios';
import BASE_URL from './BaseURL';

const CONVERSATION_API = {
  fetchConversations: `${BASE_URL}/conversations/`,
  initConversation: `${BASE_URL}/conversations/initialize/`,
  markAsRead: `${BASE_URL}/conversations/mark-as-read/`,
  createGroup: `${BASE_URL}/conversations/create-group`,
  createGroupWithImage: `${BASE_URL}/conversations/group`,
  addMembers: `${BASE_URL}/conversations/`,
  removeMember: `${BASE_URL}/conversations/`,
  leaveGroup: `${BASE_URL}/conversations/`,
  deleteGroup: `${BASE_URL}/conversations/`,
  getMembers: `${BASE_URL}/conversations/`,
  updateAdmin: `${BASE_URL}/conversations/`,
  updateGroupInfo: `${BASE_URL}/conversations/`,  
  createCall: `${BASE_URL}/api/call`,
  getCall: `${BASE_URL}/api/call`,
};

export const createCall = async (jwt, callId, initiatorPhone, conversationId, callType) => {
  try {
    const payload = {
      callId,
      initiatorPhone,
      conversationId,
      callType: callType || 'VOICE',
    };
    const response = await axios.post(CONVERSATION_API.createCall, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating call:', error.response?.data || error.message);
    throw error;
  }
};

export const getCallDetail = async (jwt, callId) => {
  try {
    const response = await axios.get(`${CONVERSATION_API.getCall}/${callId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching call detail:', error.response?.data || error.message);
    throw error;
  }
};

export const endCall = async (jwt, callId) => {
  try {
    const response = await axios.post(
      `${CONVERSATION_API.getCall}/${callId}/end`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error ending call:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchGroups = async (jwt) => {
  console.log('fetchGroups called with token:', jwt.substring(0, 20) + '...');
  try {
    const response = await axios.get(CONVERSATION_API.fetchConversations, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });
    console.log('fetchGroups response:', response.data);
    return response.data.filter((conv) => conv.type === 'GROUP');
  } catch (error) {
    console.error('Error fetching groups:', error.response?.data || error.message);
    throw error;
  }
};

export const initConversation = async (jwt, conversationId) => {
  console.log('initConversation called with:', { jwt: jwt.substring(0, 20) + '...', conversationId });
  try {
    const response = await axios.get(`${CONVERSATION_API.initConversation}${conversationId}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
    });
    console.log('initConversation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error initializing conversation:', error.response?.data || error.message);
    throw error;
  }
};

export const createGroup = async (jwt, groupName, participants) => {
  console.log('createGroup called with:', { groupName, participants });
  try {
    const response = await axios.post(
      CONVERSATION_API.createGroup,
      {
        conversationName: groupName,
        conversationImgUrl: null,
        participants,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('createGroup response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating group:', error.response?.data || error.message);
    throw error;
  }
};

export const createGroupWithImage = async (jwt, groupName, baseImg, memberIds) => {
  console.log('createGroupWithImage called with:', { groupName, hasImage: !!baseImg, memberIds });
  try {
    const formData = new FormData();
    formData.append('name', groupName);
    if (baseImg) {
      formData.append('baseImg', {
        uri: baseImg.uri,
        type: baseImg.type || 'image/jpeg',
        name: baseImg.fileName || 'group_image.jpg',
      });
    }
    formData.append('memberIds', JSON.stringify(memberIds));

    const response = await axios.post(CONVERSATION_API.createGroupWithImage, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${jwt}`,
      },
    });
    console.log('createGroupWithImage response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating group with image:', error.response?.data || error.message);
    throw error;
  }
};

export const addMembers = async (jwt, conversationId, newMembersPhone) => {
  console.log('addMembers called with:', { conversationId, newMembersPhone });
  try {
    const response = await axios.post(
      `${CONVERSATION_API.addMembers}${conversationId}/add-members`,
      { newMembersPhone },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('addMembers response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding members:', error.response?.data || error.message);
    throw error;
  }
};

export const removeMember = async (jwt, conversationId, memberPhone) => {
  console.log('removeMember called with:', { conversationId, memberPhone });
  try {
    const response = await axios.delete(
      `${CONVERSATION_API.removeMember}${conversationId}/delete-member`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        params: { memberPhone },
      }
    );
    console.log('removeMember response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error removing member:', error.response?.data || error.message);
    throw error;
  }
};

export const leaveGroup = async (jwt, conversationId, newLeaderPhone = null) => {
  console.log('leaveGroup called with:', { conversationId, newLeaderPhone });
  try {
    const response = await axios.post(
      `${CONVERSATION_API.leaveGroup}${conversationId}/leave`,
      { newLeaderPhone },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('leaveGroup response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error leaving group:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteGroup = async (jwt, conversationId) => {
  console.log('deleteGroup called with:', { conversationId });
  try {
    const response = await axios.delete(
      `${CONVERSATION_API.deleteGroup}${conversationId}/delete-group`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('deleteGroup response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting group:', error.response?.data || error.message);
    throw error;
  }
};

export const getGroupMembers = async (jwt, conversationId) => {
  console.log('getGroupMembers called with:', { conversationId });
  try {
    const response = await axios.get(
      `${CONVERSATION_API.getMembers}${conversationId}/members`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('getGroupMembers response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching group members:', error.response?.data || error.message);
    throw error;
  }
};

export const updateAdmin = async (jwt, conversationId, targetUserId, isAdmin) => {
  console.log('updateAdmin called with:', { conversationId, targetUserId, isAdmin });
  try {
    const response = await axios.put(
      `${CONVERSATION_API.updateAdmin}${conversationId}/admin`,
      { targetUserId, isAdmin },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('updateAdmin response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating admin:', error.response?.data || error.message);
    throw error;
  }
};

export const updateGroupInfo = async (jwt, conversationId, conversationName, baseImg = null) => {
  console.log('updateGroupInfo called with:', { conversationId, conversationName, hasImage: !!baseImg });
  try {
    const formData = new FormData();
    if (conversationName) {
      formData.append('conversationName', conversationName);
    }
    if (baseImg) {
      formData.append('baseImg', {
        uri: baseImg.uri,
        type: baseImg.type || 'image/jpeg',
        name: baseImg.fileName || 'group_image.jpg',
      });
    }

    const response = await axios.put(
      `${CONVERSATION_API.updateGroupInfo}${conversationId}/info`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    console.log('updateGroupInfo response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating group info:', error.response?.data || error.message);
    throw error;
  }
};