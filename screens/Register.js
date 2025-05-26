import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import { FontAwesome } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import Colors from "../constants/colors";
import { registerUser, sendOtp, verifyOtp } from "../apis/AuthAPI";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+84");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, "0");
      const day = selectedDate.getDate().toString().padStart(2, "0");
      setDateOfBirth(`${year}-${month}-${day}`);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSendOtp = async () => {
    if (!name || !dateOfBirth || !phone || !password) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone);
      setOtpSent(true);
      Alert.alert('Thành công', 'Mã OTP đã được gửi đến số điện thoại của bạn');
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!otp) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('dateOfBirth', dateOfBirth);
      formData.append('phone', phone);
      formData.append('password', password);
      formData.append('gender', gender.toString());

      if (avatar) {
        formData.append('avatar', {
          uri: avatar,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        });
      }

      const data = await registerUser(formData, phone, otp);

      if (data.success) {
        Alert.alert(data.message || 'Đăng ký thành công!', [
          { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
        ]);
      } else {
        Alert.alert('Lỗi', data.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (error) {
      Alert.alert('Lỗi', error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đăng ký</Text>
        <Text style={styles.appName}>Zala</Text>
      </View>

      {!otpSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.inputWithDate}>
            <TextInput
              style={styles.inputDate}
              placeholder="Ngày sinh (YYYY-MM-DD)"
              value={dateOfBirth}
              editable={false}
            />
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={styles.calendarIcon}
            >
              <FontAwesome name="calendar" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={dateOfBirth ? new Date(dateOfBirth) : new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}

          <TextInput
            style={styles.inputPhone}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.genderContainer}>
            <Text style={styles.genderLabel}>Giới tính:</Text>
            <Text style={styles.genderText}>{gender ? "Nam" : "Nữ"}</Text>
            <Switch
              value={gender}
              onValueChange={setGender}
              thumbColor={gender ? Colors.primary : "#888"}
              style={styles.switch}
            />
          </View>

          <View style={styles.avatarRow}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.placeholder}>
                <FontAwesome name="image" size={50} color="#ccc" />
              </View>
            )}
            <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
              <FontAwesome name="image" size={20} color="#007BFF" />
              <Text style={styles.uploadButtonText}>
                {avatar ? "Chọn lại ảnh đại diện" : "Chọn ảnh đại diện"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.6 }]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerText}>Gửi OTP</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Mã OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.registerButton, loading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.registerText}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={styles.loginContainer}>
        <Text style={styles.loginLink}>Đã có tài khoản Zala?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
          <Text style={styles.loginText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    color: "#000",
  },
  appName: {
    fontSize: 50,
    color: Colors.logoPrimary,
    fontWeight: "bold",
    marginLeft: 15,
  },
  inputPhone: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    color: '#000',
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  genderContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  genderLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  genderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  switch: {
    marginLeft: 30,
  },
  inputWithDate: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 15,
    paddingRight: 10,
  },
  inputDate: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  calendarIcon: {
    padding: 8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ddd",
    marginRight: 15,
  },
  placeholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  uploadButtonText: {
    fontSize: 16,
    color: "#007BFF",
    marginLeft: 10,
  },
  registerButton: {
    backgroundColor: Colors.btnBackground,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  registerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: "bold",
  },
  loginText: {
    fontSize: 14,
    color: "#0A84FF",
    fontWeight: "bold",
  },
  loginContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
  loginLink: {
    fontSize: 14,
    marginRight: 6,
  },
});