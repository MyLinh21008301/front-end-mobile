// import React, { useState, useEffect, useRef } from 'react';
// import { TouchableOpacity, Alert, Platform, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import * as DocumentPicker from 'expo-document-picker';
// import { getToken } from '../../../api/TokenAPI';
// import { sendFile } from '../../../api/MessageAPI';

// const MediaUploader = ({ conversationId, onUploadComplete, styles }) => {
//   const [documentPickerAvailable, setDocumentPickerAvailable] = useState(false);
//   const fileInputRef = useRef(null);

//   // Kiểm tra tính khả dụng của DocumentPicker
//   useEffect(() => {
//     if (Platform.OS !== 'web') {
//       try {
//         setDocumentPickerAvailable(!!DocumentPicker);
//       } catch (error) {
//         console.warn('DocumentPicker not available:', error);
//         setDocumentPickerAvailable(false);
//       }
//     } else {
//       setDocumentPickerAvailable(true); // Web hỗ trợ input file
//     }
//   }, []);

//   // Mở camera để chụp ảnh
//   const openCamera = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
//       if (!permissionResult.granted) {
//         Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera. Vui lòng cấp quyền trong cài đặt.');
//         return;
//       }

//       const result = await ImagePicker.launchCameraAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       if (!result.canceled && result.assets && result.assets[0]) {
//         await uploadMedia(result.assets[0]);
//       } else {
//         console.log('User cancelled camera');
//       }
//     } catch (error) {
//       console.error('Camera error:', error);
//       Alert.alert('Lỗi', 'Không thể mở camera: ' + error.message);
//     }
//   };

//   // Mở thư viện ảnh để chọn ảnh
//   const openGallery = async () => {
//     try {
//       const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
//       if (!permissionResult.granted) {
//         Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh. Vui lòng cấp quyền trong cài đặt.');
//         return;
//       }

//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ImagePicker.MediaTypeOptions.All, // Hỗ trợ cả ảnh và video
//         allowsEditing: true,
//         aspect: [4, 3],
//         quality: 1,
//       });

//       if (!result.canceled && result.assets && result.assets[0]) {
//         await uploadMedia(result.assets[0]);
//       } else {
//         console.log('User cancelled gallery');
//       }
//     } catch (error) {
//       console.error('Gallery error:', error);
//       Alert.alert('Lỗi', 'Không thể mở thư viện ảnh: ' + error.message);
//     }
//   };

//   // Mở trình chọn file
//   const openFilePicker = async () => {
//     if (Platform.OS === 'web') {
//       // Web: Kích hoạt input file ẩn
//       if (fileInputRef.current) {
//         fileInputRef.current.click();
//       }
//     } else {
//       // Mobile: Sử dụng expo-document-picker
//       if (!documentPickerAvailable) {
//         Alert.alert('Lỗi', 'Trình chọn file không khả dụng trên thiết bị này.');
//         return;
//       }

//       try {
//         const result = await DocumentPicker.getDocumentAsync({
//           type: '*/*', // Cho phép mọi loại file
//           copyToCacheDirectory: true,
//         });

//         if (result.type === 'success') {
//           await uploadMedia(result);
//         } else {
//           console.log('User cancelled file picker');
//         }
//       } catch (error) {
//         console.error('File picker error:', error);
//         Alert.alert('Lỗi', 'Không thể chọn file: ' + error.message);
//       }
//     }
//   };

//   // Xử lý chọn file trên web
//   const handleWebFileChange = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     const fileAsset = {
//       uri: URL.createObjectURL(file), // Tạo URL tạm thời
//       type: file.type,
//       name: file.name,
//       file: file, // Đối tượng File cho web
//     };

//     uploadMedia(fileAsset);

//     // Reset input để có thể chọn lại file
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   // Hàm upload file/ảnh lên server
//   const uploadMedia = async (asset) => {
//     try {
//       const jwt = await getToken();
//       if (!jwt) {
//         Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
//         return;
//       }

//       let fileUri = asset.uri;
//       let fileType = asset.type || 'application/octet-stream';
//       let fileName = asset.name || `media_${Date.now()}`;
//       let fileObject = asset.file; // Đối tượng File cho web

//       // Xác định mô tả nội dung dựa trên MIME type
//       let contentDescription;
//       if (fileType.startsWith('image/')) {
//         contentDescription = 'Image';
//       } else if (fileType.startsWith('video/')) {
//         contentDescription = 'Video';
//       } else if (fileType.startsWith('audio/')) {
//         contentDescription = 'Audio';
//       } else {
//         contentDescription = 'File';
//       }

//       // Xử lý file trên mobile (từ expo-image-picker hoặc expo-document-picker)
//       let blob;
//       if (Platform.OS !== 'web') {
//         // Lấy dữ liệu file từ URI
//         const response = await fetch(fileUri);
//         blob = await response.blob();

//         // Cập nhật fileName nếu chưa có phần mở rộng
//         const extension = fileType.split('/')[1] || 'file';
//         if (!fileName.includes('.')) {
//           fileName = `${fileName}.${extension}`;
//         }
//       } else {
//         // Web: Sử dụng fileObject trực tiếp
//         blob = fileObject;
//       }

//       // Tạo FormData để gửi
//       const formData = new FormData();

//       // Thêm phần request (JSON)
//       const requestBlob = new Blob(
//         [
//           JSON.stringify({
//             conversationId: conversationId,
//             type: 'MEDIA',
//             content: contentDescription,
//           }),
//         ],
//         { type: 'application/json' }
//       );
//       formData.append('request', requestBlob);

//       // Thêm file
//       formData.append('file', blob, fileName);

//       console.log('Uploading file:', {
//         conversationId,
//         fileName,
//         fileType,
//         contentDescription,
//       });

//       // Gửi file qua API
//       await sendFile(jwt, conversationId, {
//         uri: fileUri,
//         type: fileType,
//         name: fileName,
//         file: blob,
//       });

//       // Gọi callback khi upload thành công
//       if (onUploadComplete) {
//         onUploadComplete();
//       }

//       Alert.alert('Thành công', 'File đã được gửi thành công!');
//     } catch (error) {
//       console.error('Upload error:', error.message, error.stack);
//       Alert.alert('Lỗi', 'Không thể gửi file: ' + error.message);
//     }
//   };

//   return (
//     <View style={styles.iconContainer}>
//       <TouchableOpacity onPress={openCamera}>
//         <Ionicons name="camera" size={24} color="#007aff" style={styles.icon} />
//       </TouchableOpacity>
//       <TouchableOpacity onPress={openGallery}>
//         <Ionicons name="image" size={24} color="#007aff" style={styles.icon} />
//       </TouchableOpacity>
//       <TouchableOpacity onPress={openFilePicker} disabled={!documentPickerAvailable}>
//         <Ionicons
//           name="attach"
//           size={24} color={documentPickerAvailable ? '#007aff' : '#ccc'}
//           style={styles.icon}
//         />
//       </TouchableOpacity>
//       {Platform.OS === 'web' && (
//         <input
//           type="file"
//           ref={fileInputRef}
//           style={{ display: 'none' }}
//           onChange={handleWebFileChange}
//           accept="*/*"
//         />
//       )}
//     </View>
//   );
// };

// export default MediaUploader;

import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Alert, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getToken } from '../../../api/TokenAPI';
import { sendFile } from '../../../api/MessageAPI';

const MediaUploader = ({ conversationId, onUploadComplete, styles }) => {
  const [documentPickerAvailable, setDocumentPickerAvailable] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        setDocumentPickerAvailable(!!DocumentPicker);
      } catch (error) {
        console.warn('DocumentPicker not available:', error);
        setDocumentPickerAvailable(false);
      }
    } else {
      setDocumentPickerAvailable(true);
    }
  }, []);

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadMedia(result.assets[0]);
      } else {
        console.log('User cancelled camera');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Lỗi', 'Không thể mở camera: ' + error.message);
    }
  };

  const openGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadMedia(result.assets[0]);
      } else {
        console.log('User cancelled gallery');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Lỗi', 'Không thể mở thư viện: ' + error.message);
    }
  };

  const openFilePicker = async () => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      if (!documentPickerAvailable) {
        Alert.alert('Lỗi', 'Trình chọn file không khả dụng.');
        return;
      }

      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: '*/*',
          copyToCacheDirectory: true,
        });

        if (result.type === 'success') {
          await uploadMedia(result);
        } else {
          console.log('User cancelled file picker');
        }
      } catch (error) {
        console.error('File picker error:', error);
        Alert.alert('Lỗi', 'Không thể chọn file: ' + error.message);
      }
    }
  };

  const handleWebFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileAsset = {
      uri: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
      file: file,
    };

    uploadMedia(fileAsset);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadMedia = async (asset) => {
    try {
      if (!conversationId) {
        throw new Error('Không tìm thấy hội thoại. Vui lòng chọn một hội thoại.');
      }

      const jwt = await getToken();
      if (!jwt) {
        throw new Error('Vui lòng đăng nhập lại.');
      }

      let fileUri = asset.uri;
      let fileType = asset.type || 'application/octet-stream';
      let fileName = asset.name || `media_${Date.now()}`;
      let fileObject = asset.file;

      if (fileType === 'image') {
        fileType = 'image/jpeg';
      } else if (fileType === 'video') {
        fileType = 'video/mp4';
      }

      let contentDescription;
      if (fileType.startsWith('image/')) {
        contentDescription = 'Image';
      } else if (fileType.startsWith('video/')) {
        contentDescription = 'Video';
      } else if (fileType.startsWith('audio/')) {
        contentDescription = 'Audio';
      } else {
        contentDescription = 'File';
      }

      let blob;
      if (Platform.OS !== 'web') {
        const response = await fetch(fileUri);
        blob = await response.blob();

        const extension = fileType.split('/')[1] || 'file';
        if (!fileName.includes('.')) {
          fileName = `${fileName}.${extension}`;
        }
      } else {
        if (!fileObject) {
          throw new Error('Không tìm thấy file trên web.');
        }
        blob = fileObject;
      }

      console.log('Uploading file:', {
        conversationId,
        fileName,
        fileType,
        contentDescription,
      });

      await sendFile(jwt, conversationId, {
        type: fileType,
        name: fileName,
        file: blob,
        contentDescription,
      });

      if (onUploadComplete) {
        onUploadComplete();
      }

      Alert.alert('Thành công', 'File đã được gửi thành công!');
    } catch (error) {
      console.error('Upload error:', error.message, error.stack);
      Alert.alert('Lỗi', error.message || 'Không thể gửi file.');
    }
  };

  return (
    <View style={styles.iconContainer}>
      <TouchableOpacity onPress={openCamera}>
        <Ionicons name="camera" size={24} color="#007aff" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={openGallery}>
        <Ionicons name="image" size={24} color="#007aff" style={styles.icon} />
      </TouchableOpacity>
      <TouchableOpacity onPress={openFilePicker} disabled={!documentPickerAvailable}>
        <Ionicons
          name="attach"
          size={24} color={documentPickerAvailable ? '#007aff' : '#ccc'}
          style={styles.icon}
        />
      </TouchableOpacity>
      {Platform.OS === 'web' && (
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleWebFileChange}
          accept="*/*"
        />
      )}
    </View>
  );
};

export default MediaUploader;