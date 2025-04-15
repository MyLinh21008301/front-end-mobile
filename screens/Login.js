import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../constants/colors";
import axios from "axios";
import { loginUser } from "../api/authApi";

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("+84");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập số điện thoại và mật khẩu");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser(phone, password);
      const { token, phoneNumber } = data; // Giả định API trả về phoneNumber

      // Lưu token và phoneNumber vào AsyncStorage
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("phoneNumber", phoneNumber || phone); // Lưu phoneNumber từ API hoặc input

      console.log("LoginScreen - Stored Token:", token);
      console.log("LoginScreen - Stored PhoneNumber:", phoneNumber || phone);

      navigation.replace("Home");
      // navigation.replace("Test");
      
    } catch (error) {
      if (error.response) {
        Alert.alert("Đăng nhập thất bại", error.response.data.message || "Số điện thoại hoặc mật khẩu không đúng");
      } else {
        Alert.alert("Lỗi", "Có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zala</Text>

      <TextInput
        style={styles.inputPhone}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.questionText}>Bạn chưa có tài khoản Zala?</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>Đăng ký</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 40,
    color: Colors.logoPrimary,
  },
  inputPhone: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    color: Colors.inputText,
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: Colors.btnBackground,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 14,
    marginRight: 6,
  },
  registerText: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: 'bold',
  },
});