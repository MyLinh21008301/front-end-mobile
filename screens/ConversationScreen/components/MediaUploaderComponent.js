import React, { useRef, useState } from 'react';
import { TouchableOpacity, Alert, Platform, ActionSheetIOS } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { getToken } from '../../../apis/TokenAPI';
import { sendFile } from '../../../apis/MessageAPI';

const MediaUploader = ({ conversationId, onUploadComplete, styles }) => {
  const fileInputRef = useRef(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Unified MIME type helper
  const getMimeType = (filename) => {
    if (!filename) return 'image/jpeg';
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes = {
      // Images
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      // Videos  
      mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
      // Audio
      m4a: 'audio/m4a', mp3: 'audio/mpeg', wav: 'audio/wav',
      // Documents
      pdf: 'application/pdf', doc: 'application/msword', 
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  // Unified upload function with loading state
  const uploadFile = async (fileData) => {
    if (isUploading) return;
    
    setIsUploading(true);
    try {
      const jwt = await getToken();
      await sendFile(jwt, conversationId, fileData);
      Alert.alert('Thành công', 'Tải lên file thành công!');
      onUploadComplete?.();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Lỗi', 'Không thể tải lên file. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const openCamera = () => {
    const options = Platform.OS === 'ios' 
      ? ['Hủy', 'Chụp ảnh', 'Quay video']
      : [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Chụp ảnh', onPress: () => launchCamera('photo') },
          { text: 'Quay video', onPress: () => launchCamera('video') },
        ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({
        options,
        cancelButtonIndex: 0,
        title: 'Chọn chức năng camera',
      }, (buttonIndex) => {
        if (buttonIndex === 1) launchCamera('photo');
        else if (buttonIndex === 2) launchCamera('video');
      });
    } else {
      Alert.alert('Chọn chức năng camera', 'Bạn muốn làm gì?', options);
    }
  };

  const launchCamera = async (mode) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập camera để chụp ảnh/quay video.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: mode === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop();
      
      await uploadFile({
        uri: asset.uri,
        name: filename,
        type: getMimeType(filename),
      });
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập thư viện để chọn media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const filename = asset.uri.split('/').pop();
      
      await uploadFile({
        uri: asset.uri,
        name: filename,
        type: getMimeType(filename),
      });
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập microphone để ghi âm.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      Alert.alert('Đang ghi âm', 'Nhấn lại để dừng ghi âm');
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu ghi âm');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (uri) {
        const filename = `recording_${Date.now()}.m4a`;
        await uploadFile({
          uri,
          name: filename,
          type: 'audio/m4a',
        });
      }
      setRecording(null);
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Lỗi', 'Không thể dừng ghi âm');
    }
  };

  const openFilePicker = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
      });

      if (result.assets?.[0]) {
        await uploadFile(result.assets[0]);
      }
    } catch (error) {
      console.error('File picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn file');
    }
  };

  const handleWebFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file);
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <TouchableOpacity onPress={openCamera} disabled={isUploading}>
        <Ionicons 
          name="camera" 
          size={24} 
          color={isUploading ? "#ccc" : "#007aff"} 
          style={styles.icon} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={openGallery} disabled={isUploading}>
        <Ionicons 
          name="image" 
          size={24} 
          color={isUploading ? "#ccc" : "#007aff"} 
          style={styles.icon} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={toggleRecording} disabled={isUploading}>
        <Ionicons 
          name={isRecording ? "stop-circle" : "mic"} 
          size={24} 
          color={isUploading ? "#ccc" : (isRecording ? "#ff3b30" : "#007aff")} 
          style={styles.icon} 
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={openFilePicker} disabled={isUploading}>
        <Ionicons 
          name="attach" 
          size={24} 
          color={isUploading ? "#ccc" : "#007aff"} 
          style={styles.icon} 
        />
      </TouchableOpacity>

      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
          disabled={isUploading}
        />
      )}
    </>
  );
};

export default MediaUploader;