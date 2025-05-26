import React from 'react';

// Define common file extensions for different media types
export const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
export const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'];
export const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'mpeg'];
export const documentExtensions = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'rtf',
  'csv',
];
export const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];

// Define reaction emojis
export const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '👎'];

// Function to extract file extension from a URL
export const getFileExtension = (url) => {
  if (!url) return '';
  const parts = url.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase();
};

// Function to get file name from URL
export const getFileName = (url) => {
  if (!url) return 'Unknown file';
  const parts = url.split('/');
  return parts[parts.length - 1] || 'Unknown file';
};

// Function to get file icon based on extension
export const getFileIcon = (extension) => {
  if (imageExtensions.includes(extension)) return 'image';
  if (videoExtensions.includes(extension)) return 'videocam';
  if (audioExtensions.includes(extension)) return 'musical-notes';
  if (documentExtensions.includes(extension)) {
    if (extension === 'pdf') return 'document-text';
    if (['doc', 'docx'].includes(extension)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'grid';
    if (['ppt', 'pptx'].includes(extension)) return 'easel';
    return 'document';
  }
  if (archiveExtensions.includes(extension)) return 'archive';
  return 'document-attach';
};

// Function to parse createdAt from various formats
export const parseCreatedAt = (createdAt) => {
  try {
    // Handle HH:MM format (assume today)
    if (/^\d{2}:\d{2}$/.test(createdAt)) {
      const today = new Date();
      const [hours, minutes] = createdAt.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return today;
    }
    
    // Handle ISO format with microseconds
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+/.test(createdAt)) {
      return new Date(createdAt.replace(/(\.\d{3})\d+/, '$1Z'));
    }
    
    // Handle standard ISO format
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(createdAt)) {
      return new Date(createdAt);
    }
    
    console.warn('Invalid createdAt format:', createdAt);
    return new Date();
  } catch (error) {
    console.error('Error parsing createdAt:', createdAt, error);
    return new Date();
  }
};

// Format time in mm:ss
export const formatTime = (millis) => {
  if (!millis) return '00:00';
  const seconds = Math.floor((millis / 1000) % 60);
  const minutes = Math.floor(millis / 1000 / 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Format message timestamp with Vietnamese relative dates
export const formatMessageTime = (createdAt) => {
  const messageDate = parseCreatedAt(createdAt);
  const now = new Date();
  
  // Get start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get start of message date
  const messageDateStart = new Date(messageDate);
  messageDateStart.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = today.getTime() - messageDateStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Format time in 24-hour format
  const timeStr = messageDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  if (diffDays === 0) {
    // Today - show only time
    return timeStr;
  } else if (diffDays === 1) {
    // Yesterday
    return `Hôm qua ${timeStr}`;
  } else if (diffDays === 2) {
    // Day before yesterday
    return `Hôm kia ${timeStr}`;
  } else if (diffDays <= 7) {
    // Within 7 days - show relative days
    return `${diffDays} ngày trước ${timeStr}`;
  } else {
    // More than 7 days - show full date
    const dateStr = messageDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${dateStr} ${timeStr}`;
  }
};

// Format date for message grouping (used for date separators)
export const formatDateSeparator = (createdAt) => {
  const messageDate = parseCreatedAt(createdAt);
  const now = new Date();
  
  // Get start of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get start of message date
  const messageDateStart = new Date(messageDate);
  messageDateStart.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = today.getTime() - messageDateStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Hôm nay';
  } else if (diffDays === 1) {
    return 'Hôm qua';
  } else if (diffDays === 2) {
    return 'Hôm kia';
  } else if (diffDays <= 7) {
    return `${diffDays} ngày trước`;
  } else {
    return messageDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
};

// Check if two dates are on the same day
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = typeof date1 === 'string' ? parseCreatedAt(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseCreatedAt(date2) : date2;
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Group reactions by emoji for display
export const groupReactionsByEmoji = (reactions) => {
  return reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { emoji: reaction.emoji, count: 0, users: [] };
    }
    acc[reaction.emoji].count += 1;
    acc[reaction.emoji].users.push(reaction.userName);
    return acc;
  }, {});
};

// Enrich reactions with user info
export const enrichReactions = (reactions, participantsInfo) => {
  return reactions.map(reaction => {
    const user = participantsInfo[reaction.userId] || { phoneNumber: reaction.userId };
    return {
      ...reaction,
      userName: user.name || user.phoneNumber,
      userAvatar: user.baseImg
    };
  });
};

// Parse reactions from DynamoDB format
export const parseReactions = (reactionsData) => {
  if (!reactionsData || !reactionsData.L) return [];
  
  const reactions = [];
  reactionsData.L.forEach(reactionItem => {
    if (reactionItem.M && reactionItem.M.emoji && reactionItem.M.users) {
      const emoji = reactionItem.M.emoji.S;
      const users = reactionItem.M.users.L || [];
      
      users.forEach(userItem => {
        if (userItem.S) {
          reactions.push({
            emoji: emoji,
            userId: userItem.S,
            userName: userItem.S // Will be enriched later with actual user info
          });
        }
      });
    }
  });
  
  return reactions;
};