// MediaUploader.js
import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Alert, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { getToken } from '../../../api/TokenAPI';
import { sendFile } from '../../../api/MessageAPI';

const MediaUploader = ({ conversationId, onUploadComplete, styles }) => {
  const [documentPickerAvailable, setDocumentPickerAvailable] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    // Check if DocumentPicker is available for native platforms
    // For web, we'll use an alternative approach
    if (Platform.OS !== 'web') {
      try {
        const DocumentPicker = require('expo-document-picker').default;
        setDocumentPickerAvailable(true);
      } catch (error) {
        console.warn('DocumentPicker not available for native:', error);
        setDocumentPickerAvailable(false);
      }
    } else {
      // On web, we always have file picking capabilities
      setDocumentPickerAvailable(true);
    }
  }, []);

  const openCamera = () => {
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to open camera');
      } else if (response.assets && response.assets[0]) {
        uploadMedia(response.assets[0]);
      }
    });
  };

  const openGallery = () => {
    const options = {
      mediaType: Platform.OS === 'web' ? 'photo' : 'mixed',
      selectionLimit: 1
    };
  
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled gallery');
      } else if (response.errorCode) {
        console.log('Gallery Error: ', response.errorMessage);
        Alert.alert('Error', 'Failed to open gallery');
      } else if (response.assets && response.assets[0]) {
        uploadMedia(response.assets[0]);
      }
    });
  };

  const openFilePicker = async () => {
    if (Platform.OS === 'web') {
      // On web, trigger the hidden file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      // Native platforms
      if (!documentPickerAvailable) {
        Alert.alert('Error', 'File picker is not available on this device');
        return;
      }

      try {
        const DocumentPicker = require('expo-document-picker').default;
        
        const res = await DocumentPicker.pick({
          type: [DocumentPicker.types.allFiles],
          allowMultiSelection: false,
        });
        
        const file = Array.isArray(res) ? res[0] : res;
        uploadMedia(file);
      } catch (err) {
        const DocumentPicker = require('expo-document-picker').default;
        
        if (DocumentPicker.isCancel(err)) {
          console.log('User cancelled file picker');
        } else {
          console.error('File Picker Error: ', err);
          Alert.alert('Error', 'Failed to pick file');
        }
      }
    }
  };

  const handleWebFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    // Create a structure similar to what react-native-image-picker returns
    const fileAsset = {
      file, // Pass the raw File object for web
      type: file.type,
      name: file.name,
      size: file.size,
    };
  
    uploadMedia(fileAsset);
  
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (asset) => {
    try {
      const jwt = await getToken();
  
      // Extract information from the asset
      let fileUri = asset.uri;
      let fileType = asset.type;
      let fileName = asset.fileName || asset.name || `file_${Date.now()}`;
      let fileObject = asset.file; // For web, this is the File object
  
      // Handle base64 data URIs
      if (fileUri && fileUri.startsWith('data:')) {
        // Extract MIME type from data URI
        const mimeMatch = fileUri.match(/^data:([^;]+);/);
        if (mimeMatch && mimeMatch[1]) {
          fileType = mimeMatch[1];
        }
  
        // Ensure we have a proper extension for the file
        const fileExtension = getExtensionFromMimeType(fileType);
        if (fileExtension && !fileName.endsWith(fileExtension)) {
          fileName = `${fileName}${fileExtension}`;
        }
      }
  
      // Create file object with proper structure for upload
      const file = {
        uri: fileUri, // May be undefined for web
        type: fileType || 'application/octet-stream',
        name: fileName,
        file: fileObject, // Include the File object for web
      };
  
      console.log('Uploading file:', file);
      await sendFile(jwt, conversationId, file);
  
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  // Helper function to get appropriate extension from MIME type
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
      'audio/mp3': '.mp3',
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

  return (
    <>
      <TouchableOpacity onPress={openCamera}>
        <Ionicons name="camera" size={24} color="#007aff" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={openGallery}>
        <Ionicons name="image" size={24} color="#007aff" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={openFilePicker} disabled={!documentPickerAvailable}>
        <Ionicons
          name="attach"
          size={24}
          color={documentPickerAvailable ? '#007aff' : '#ccc'}
          style={styles.icon}
        />
      </TouchableOpacity>
      
      {/* Hidden file input for web */}
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
        />
      )}
    </>
  );
};

export default MediaUploader;