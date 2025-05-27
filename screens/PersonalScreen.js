import React, { useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUserInfo } from "../contexts/UserInfoContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { updateUserInfo } from "../apis/UserAPI";
import { changePassword } from "../apis/AuthAPI";
import * as ImagePicker from "expo-image-picker";
import BottomNavBar from "../components/BottomNavBar";

export default function PersonalScreen({ navigation }) {
  const { userInfo, setUserInfo } = useUserInfo();
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // const [passwordData, setPasswordData] = useState({
  //   currentPassword: "",
  //   newPassword: "",
  //   confirmPassword: "",
  // });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const startEditing = () => {
    setEditedInfo({
      name: userInfo.name || "",
      bio: userInfo.bio || "",
      dateOfBirth: userInfo.dateOfBirth || "",
      male:
        userInfo.male !== undefined && userInfo.male !== null
          ? userInfo.male
          : false, // Đặt mặc định là false
      status: userInfo.status || "",
      baseImg: null,
      backgroundImg: null,
      currentBaseImg: userInfo.baseImg,
      currentBackgroundImg: userInfo.backgroundImg,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedInfo({});
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setEditedInfo({ ...editedInfo, dateOfBirth: formattedDate });
    }
  };

  const pickAvatar = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";
        const imageFile = {
          uri: imageUri,
          name: filename,
          type: type,
        };
        setEditedInfo((prev) => ({
          ...prev,
          baseImg: imageFile,
          baseImgPreview: imageUri,
        }));
      }
    } catch (error) {
      console.error("Error picking avatar:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");
    }
  };

  const pickBackground = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Cần quyền truy cập",
          "Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const filename = imageUri.split("/").pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image";
        const imageFile = {
          uri: imageUri,
          name: filename,
          type: type,
        };
        setEditedInfo((prev) => ({
          ...prev,
          backgroundImg: imageFile,
          backgroundImgPreview: imageUri,
        }));
      }
    } catch (error) {
      console.error("Error picking background:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại sau.");
    }
  };

  const saveChanges = async () => {
    try {
      setLoading(true);
      if (!editedInfo.name?.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập họ và tên");
        setLoading(false);
        return;
      }

      const updateData = {
        name: editedInfo.name,
        bio: editedInfo.bio || "",
        dateOfBirth: editedInfo.dateOfBirth || "",
        male:
          editedInfo.male !== undefined && editedInfo.male !== null
            ? editedInfo.male
            : false, // Đặt giá trị mặc định là false để khớp với log
        status: editedInfo.status || "",
      };

      // Chỉ gửi baseImg nếu có ảnh mới
      if (editedInfo.baseImgPreview && editedInfo.baseImg) {
        updateData.baseImg = editedInfo.baseImg; // Thêm object ảnh mới
      }

      // Chỉ gửi backgroundImg nếu có ảnh mới
      if (editedInfo.backgroundImgPreview && editedInfo.backgroundImg) {
        updateData.backgroundImg = editedInfo.backgroundImg; // Thêm object ảnh mới
      }

      console.log("Update data to send:", updateData);

      const updatedUser = await updateUserInfo(updateData);
      setUserInfo({ ...userInfo, ...updatedUser });
      setIsEditing(false);
      setLoading(false);
      Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật");
    } catch (error) {
      console.error(
        "Error updating user info:",
        error.response?.data || error.message
      );
      setLoading(false);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại sau.");
    }
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert("Thông báo", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Thông báo", "Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(
        userInfo.phoneNumber,
        passwordData.newPassword,
        passwordData.currentPassword
      );
      setPasswordLoading(false);
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      Alert.alert("Thành công", "Đổi mật khẩu thành công");
    } catch (error) {
      setPasswordLoading(false);
      console.error("Error changing password:", error);
      Alert.alert(
        "Lỗi",
        "Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại."
      );
    }
  };

  

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("searchQueries");
      await AsyncStorage.removeItem("recentPeople");
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={styles.headerButton}>
          <Ionicons name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerTitle: "Trang cá nhân",
      headerTitleAlign: "center",
      headerStyle: {
        backgroundColor: "#fff",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: "600",
      },
    });
  }, [navigation]);

  const renderProfileInfoItem = (iconName, label, value) => {
    if (!value && value !== false) return null;
    return (
      <View style={styles.infoItem}>
        <Ionicons
          name={iconName}
          size={22}
          color="#666"
          style={styles.infoIcon}
        />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}</Text>
          <Text style={styles.infoValue}>{value}</Text>
        </View>
      </View>
    );
  };

  const renderEditableInfoItem = (
    iconName,
    label,
    key,
    placeholder,
    isDate = false,
    isGender = false
  ) => {
    return (
      <View style={styles.editableInfoItem}>
        <Ionicons
          name={iconName}
          size={22}
          color="#666"
          style={styles.infoIcon}
        />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoLabel}>{label}</Text>
          {isDate ? (
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {editedInfo.dateOfBirth
                  ? formatDate(editedInfo.dateOfBirth)
                  : "Chọn ngày sinh"}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#007bff" />
            </TouchableOpacity>
          ) : isGender ? (
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  editedInfo.male && styles.genderButtonActive,
                ]}
                onPress={() => setEditedInfo({ ...editedInfo, male: true })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    editedInfo.male && styles.genderButtonTextActive,
                  ]}
                >
                  Nam
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  !editedInfo.male && styles.genderButtonActive,
                ]}
                onPress={() => setEditedInfo({ ...editedInfo, male: false })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    !editedInfo.male && styles.genderButtonTextActive,
                  ]}
                >
                  Nữ
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={editedInfo[key]}
              onChangeText={(text) =>
                setEditedInfo({ ...editedInfo, [key]: text })
              }
              placeholder={placeholder}
              multiline={key === "bio"}
              numberOfLines={key === "bio" ? 3 : 1}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundContainer}>
          {isEditing ? (
            <TouchableOpacity
              style={styles.backgroundEditContainer}
              onPress={pickBackground}
              activeOpacity={0.8}
            >
              {editedInfo.backgroundImgPreview ? (
                <Image
                  source={{ uri: editedInfo.backgroundImgPreview }}
                  style={styles.backgroundImg}
                  resizeMode="cover"
                />
              ) : userInfo.backgroundImg ? (
                <Image
                  source={{ uri: userInfo.backgroundImg }}
                  style={styles.backgroundImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.backgroundPlaceholder} />
              )}
              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.editImageText}>Chọn ảnh bìa</Text>
              </View>
            </TouchableOpacity>
          ) : userInfo.backgroundImg ? (
            <Image
              source={{ uri: userInfo.backgroundImg }}
              style={styles.backgroundImg}
              resizeMode="cover"
              onError={(e) =>
                console.log("Background image error:", e.nativeEvent.error)
              }
            />
          ) : (
            <View style={styles.backgroundPlaceholder} />
          )}
        </View>

        <View style={styles.profileContainer}>
          {isEditing ? (
            <TouchableOpacity
              style={styles.avatarEditContainer}
              onPress={pickAvatar}
              activeOpacity={0.8}
            >
              {editedInfo.baseImgPreview ? (
                <Image
                  source={{ uri: editedInfo.baseImgPreview }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : userInfo.baseImg ? (
                <Image
                  source={{ uri: userInfo.baseImg }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
              <View style={styles.avatarEditOverlay}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : (
            <Image
              source={{ uri: userInfo.baseImg }}
              style={styles.avatar}
              resizeMode="cover"
              onError={(e) =>
                console.log("Avatar image error:", e.nativeEvent.error)
              }
            />
          )}

          <Text style={styles.name}>{userInfo.name || "Unknown"}</Text>
          <Text style={styles.phone}>{userInfo.phoneNumber || "N/A"}</Text>

          {!isEditing ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={startEditing}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.passwordButton}
                onPress={() => setShowPasswordModal(true)}
              >
                <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                <Text style={styles.passwordButtonText}>Đổi mật khẩu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.editActionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={cancelEditing}
              >
                <Text style={styles.actionButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={saveChanges}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.actionButtonText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            {isEditing ? (
              <>
                {renderEditableInfoItem(
                  "person",
                  "Họ và tên",
                  "name",
                  "Nhập họ và tên..."
                )}
                {renderEditableInfoItem(
                  "calendar",
                  "Ngày sinh",
                  "dateOfBirth",
                  "Chọn ngày sinh...",
                  true
                )}
                {renderEditableInfoItem(
                  "male-female",
                  "Giới tính",
                  "male",
                  "",
                  false,
                  true
                )}
                {renderEditableInfoItem(
                  "document-text",
                  "Bio",
                  "bio",
                  "Giới thiệu về bạn..."
                )}
                {renderEditableInfoItem(
                  "time",
                  "Trạng thái",
                  "status",
                  "Cập nhật trạng thái..."
                )}
              </>
            ) : (
              <>
                {renderProfileInfoItem("person", "Họ và tên", userInfo.name)}
                {renderProfileInfoItem(
                  "calendar",
                  "Ngày sinh",
                  formatDate(userInfo.dateOfBirth)
                )}
                {renderProfileInfoItem(
                  "male-female",
                  "Giới tính",
                  userInfo.male !== undefined
                    ? userInfo.male
                      ? "Nam"
                      : "Nữ"
                    : "N/A"
                )}
                {renderProfileInfoItem("document-text", "Bio", userInfo.bio)}
                {renderProfileInfoItem("time", "Trạng thái", userInfo.status)}
              </>
            )}
          </View>
        </View>
      </ScrollView>
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
                <TextInput
                  style={styles.modalInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, currentPassword: text })
                  }
                  secureTextEntry
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                <TextInput
                  style={styles.modalInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, newPassword: text })
                  }
                  secureTextEntry
                  placeholder="Nhập mật khẩu mới"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
                <TextInput
                  style={styles.modalInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, confirmPassword: text })
                  }
                  secureTextEntry
                  placeholder="Nhập lại mật khẩu mới"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              >
                {passwordLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmModalButtonText}>
                    Đổi mật khẩu
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
     
      {showDatePicker && (
        <DateTimePicker
          value={
            editedInfo.dateOfBirth
              ? new Date(editedInfo.dateOfBirth)
              : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}
      <BottomNavBar />
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  backgroundContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#eee",
  },
  backgroundImg: {
    width: "100%",
    height: "100%",
  },
  backgroundPlaceholder: {
    flex: 1,
    backgroundColor: "#ccc",
  },
  profileContainer: {
    alignItems: "center",
    marginTop: -50,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#ddd",
  },
  avatarPlaceholder: {
    backgroundColor: "#ddd",
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 10,
  },
  phone: {
    fontSize: 16,
    color: "#888",
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "500",
  },
  passwordButton: {
    flexDirection: "row",
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  passwordButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "500",
  },
  infoSection: {
    width: "100%",
    marginTop: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
    paddingHorizontal: 15,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 15,
  },
  editableInfoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 15,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  input: {
    fontSize: 16,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 5,
  },
  editActionButtons: {
    flexDirection: "row",
    marginTop: 10,
    width: "80%",
    justifyContent: "space-between",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 0.48,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  headerButton: {
    paddingHorizontal: 10,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 10,
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  genderContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  genderButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 10,
  },
  genderButtonActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  genderButtonText: {
    color: "#333",
  },
  genderButtonTextActive: {
    color: "#fff",
  },
  backgroundEditContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  editOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  editImageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  avatarEditContainer: {
    position: "relative",
  },
  avatarEditOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007bff",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    width: "100%",
    maxWidth: 400,
    paddingVertical: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelModalButtonText: {
    color: "#666",
    fontWeight: "500",
  },
  confirmModalButton: {
    backgroundColor: "#007bff",
  },
  confirmModalButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});
