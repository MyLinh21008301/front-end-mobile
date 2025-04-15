import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Colors from "../constants/colors";
import { fetchUserData, updateUserData } from "../api/authApi";

// Ảnh mặc định
const DEFAULT_AVATAR = "https://via.placeholder.com/100";

const ProfileScreen = () => {
  const navigation = useNavigation();

  const [user, setUser] = useState({
    phoneNumber: "",
    name: "",
    dateOfBirth: "",
    bio: "",
    baseImg: DEFAULT_AVATAR,
    isMale: true,
  });

  // State để quản lý chế độ chỉnh sửa
  const [editMode, setEditMode] = useState({
    name: false,
    phoneNumber: false,
    bio: false,
    dateOfBirth: false,
    isMale: false,
  });

  // State tạm thời để lưu giá trị chỉnh sửa
  const [tempData, setTempData] = useState({
    phoneNumber: "",
    name: "",
    dateOfBirth: "",
    bio: "",
    baseImg: DEFAULT_AVATAR,
    isMale: true,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await fetchUserData();
        const fixedData = {
          ...data,
          baseImg: data.baseImg || DEFAULT_AVATAR,
          isMale: data.isMale !== undefined ? data.isMale : true,
        };
        setUser(fixedData);
        setTempData(fixedData);
      } catch (error) {
        console.error("Lỗi khi load user:", error);
      }
    };

    loadUserData();
  }, []);
  // Hàm chọn ảnh đại diện
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setTempData({ ...tempData, baseImg: result.assets[0].uri });
    }
  };

  // Hàm xử lý khi chọn ngày sinh
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      setTempData({ ...tempData, dateOfBirth: `${year}-${month}-${day}` });
    }
  };

  // Hàm bật/tắt chế độ chỉnh sửa
  const toggleEditMode = (field) => {
    setEditMode({ ...editMode, [field]: !editMode[field] });
  };
  //Lưu chỉnh sửa
const saveAllChanges = async () => {
    const hasChanges = tempData.name !== user.name ||
                       tempData.phoneNumber !== user.phoneNumber ||
                       tempData.bio !== user.bio ||
                       tempData.dateOfBirth !== user.dateOfBirth ||
                       tempData.isMale !== user.isMale ||
                       tempData.baseImg !== user.baseImg;
  
    if (!hasChanges) {
      Alert.alert("Thông báo", "Không có thay đổi để lưu.");
      return;
    }
  
    try {
      const updated = await updateUserData(tempData, user, DEFAULT_AVATAR);
      const finalData = {
        ...updated,
        baseImg: updated.baseImg || DEFAULT_AVATAR,
        isMale: updated.isMale !== undefined ? updated.isMale : true,
      };
  
      setUser(finalData);
      setTempData(finalData);
      setEditMode({
        name: false,
        phoneNumber: false,
        bio: false,
        dateOfBirth: false,
        isMale: false,
      });
  
      Alert.alert("Thành công", "Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật thông tin:", error);
      Alert.alert("Lỗi", "Không thể cập nhật. Kiểm tra lại kết nối hoặc dữ liệu!");
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              source={{ uri: tempData.baseImg || DEFAULT_AVATAR }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
            <FontAwesome name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoContainer}>
          {editMode.name ? (
            <TextInput
              style={styles.input}
              value={tempData.name}
              onChangeText={(text) => setTempData({ ...tempData, name: text })}
            />
          ) : (
            <Text style={styles.textName}>{user.name || "Chưa đặt tên"}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => toggleEditMode("name")}
        >
          <FontAwesome
            name="edit"
            size={20}
            color={editMode.name ? "#FF4444" : "#007BFF"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Số điện thoại:</Text>
        {editMode.phoneNumber ? (
          <TextInput
            style={styles.input}
            value={tempData.phoneNumber}
            onChangeText={(text) =>
              setTempData({ ...tempData, phoneNumber: text })
            }
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.text}>
            {user.phoneNumber || "Chưa có số điện thoại"}
          </Text>
        )}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => toggleEditMode("phoneNumber")}
        >
          <FontAwesome
            name="edit"
            size={20}
            color={editMode.phoneNumber ? "#FF4444" : "#007BFF"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tiểu sử:</Text>
        {editMode.bio ? (
          <TextInput
            style={styles.input}
            value={tempData.bio}
            onChangeText={(text) => setTempData({ ...tempData, bio: text })}
          />
        ) : (
          <Text style={styles.text}>{user.bio || "Chưa có tiểu sử"}</Text>
        )}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => toggleEditMode("bio")}
        >
          <FontAwesome
            name="edit"
            size={20}
            color={editMode.bio ? "#FF4444" : "#007BFF"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Ngày sinh:</Text>
        {editMode.dateOfBirth ? (
          <>
            <TextInput
              style={styles.input}
              value={tempData.dateOfBirth}
              editable={false}
            />
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <FontAwesome name="calendar" size={20} color="#888" />
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.text}>
            {user.dateOfBirth || "Chưa có ngày sinh"}
          </Text>
        )}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => toggleEditMode("dateOfBirth")}
        >
          <FontAwesome
            name="edit"
            size={20}
            color={editMode.dateOfBirth ? "#FF4444" : "#007BFF"}
          />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={
            tempData.dateOfBirth ? new Date(tempData.dateOfBirth) : new Date()
          }
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
      <View style={styles.row}>
        <Text style={styles.label}>Giới tính:</Text>
        {editMode.isMale ? (
          <Switch
            value={tempData.isMale}
            onValueChange={(value) =>
              setTempData({ ...tempData, isMale: value })
            }
          />
        ) : (
          <Text style={styles.text}>{user.isMale ? "Nam" : "Nữ"}</Text>
        )}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => toggleEditMode("isMale")}
        >
          <FontAwesome
            name="edit"
            size={20}
            color={editMode.isMale ? "#FF4444" : "#007BFF"}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveAllButton} onPress={saveAllChanges}>
        <Text style={styles.saveAllButtonText}>Lưu tất cả thay đổi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007BFF",
    borderRadius: 15,
    padding: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  infoContainer: {
    flex: 1,
    marginTop: 25,
  },
  label: {
    width: 100,
    fontSize: 16,
    fontWeight: "bold",
  },
  text: {
    fontSize: 16,
    flex: 1,
  },
  textName: {
    fontSize: 20,
    flex: 1,
    fontWeight: "bold",
    textAlign: "center", // căn giữa chữ mỗi dòng
    flexWrap: "wrap",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 5,
    flex: 1,
  },
  iconButton: {
    marginLeft: 10,
    padding: 8,
  },
  saveAllButton: {
    backgroundColor: "#28A745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  saveAllButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
