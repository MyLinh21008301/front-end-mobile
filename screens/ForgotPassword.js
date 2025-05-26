import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import Colors from '../constants/colors';
import { sendOtp, forgotPassword } from '../apis/AuthAPI';

export default function ForgotPasswordScreen({ navigation }) {
  const [phone, setPhone] = useState('+84');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
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

  const handleResetPassword = async () => {
    if (!phone || !otp || !password || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(phone, password, otp);
      Alert.alert(
        'Thành công',
        'Mật khẩu đã được cập nhật thành công',
        [{ text: 'OK', onPress: () => navigation.navigate('LoginScreen') }]
      );
    } catch (error) {
      Alert.alert(
        'Lỗi',
        error.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt lại mật khẩu</Text>
      <Text style={styles.subtitle}>Nhập số điện thoại và mật khẩu mới</Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Số điện thoại"
        editable={!otpSent}
      />

      {!otpSent ? (
        <TouchableOpacity
          style={[styles.sendOtpButton, loading && { opacity: 0.6 }]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendOtpText}>Gửi OTP</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Mã OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu mới"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Xác nhận mật khẩu mới"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={[styles.resetButton, loading && { opacity: 0.6 }]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetText}>Đặt lại mật khẩu</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Quay lại đăng nhập</Text>
      </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.logoPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
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
  sendOtpButton: {
    backgroundColor: Colors.btnBackground,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  sendOtpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: Colors.btnBackground,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  resetText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
  },
  backText: {
    color: Colors.logoPrimary,
    fontSize: 16,
  },
});