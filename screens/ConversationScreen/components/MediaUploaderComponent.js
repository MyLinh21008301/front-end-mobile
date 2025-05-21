import React, { useRef } from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getToken } from '../../../apis/TokenAPI';
import { sendFile } from '../../../apis/MessageAPI';

const MediaUploader = ({ conversationId, onUploadComplete, styles }) => {
  const fileInputRef = useRef(null);

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) {
      console.log('User cancelled camera');
    } else if (result.assets && result.assets[0]) {
      uploadMedia(result.assets[0]); // Pass asset directly
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Gallery permission is required to select media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
    });

    console.log('Result upload file:', result);

    if (result.canceled) {
      console.log('User cancelled gallery');
    } else if (result.assets && result.assets[0]) {
      console.log('Selected file:', result.assets[0]);
      uploadMedia(result.assets[0]); // Pass asset directly
    }
  };

  const openFilePicker = async () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          multiple: false,
        });

        if (result.type === 'cancel') {
          console.log('User cancelled file picker');
        } else if (result.assets && result.assets[0]) {
          console.log('Selected file:', result.assets[0]);
          uploadMedia(result.assets[0]); // Pass asset directly
        }
      } catch (err) {
        console.error('File Picker Error:', err);
        Alert.alert('Error', 'Failed to pick file');
      }
    }
  };

  const handleWebFileChange = (event) => {
    const newFile = event.target.files[0];
    if (!newFile) return;

    uploadMedia(newFile); // Pass file directly

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (asset) => {
    try {
      const jwt = await getToken();
      await sendFile(jwt, conversationId, asset);
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    }
  };

  // Helper function to get MIME type
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

  return (
    <>
      <TouchableOpacity onPress={openCamera}>
        <Ionicons name="camera" size={24} color="#007aff" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={openGallery}>
        <Ionicons name="image" size={24} color="#007aff" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={openFilePicker}>
        <Ionicons name="attach" size={24} color="#007aff" style={styles.icon} />
      </TouchableOpacity>

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