import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import React, { useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/colors';
import { loginUser } from '../apis/AuthAPI';
import { getUserInfo } from '../apis/UserAPI';
import UserInfoContext from '../contexts/UserInfoContext';
import SocketContext from '../contexts/SocketContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('+84');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [loginUserData, setLoginUserData] = useState(null);
  
  // Use the context directly
  const { setUserInfo } = useContext(UserInfoContext);
  const { setToken, setIsLoggedIn } = useContext(SocketContext);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại và mật khẩu');
      return;
    }

    setLoading(true);

    try {
      await AsyncStorage.setItem('authToken', '');
      
      const data = await loginUser(phone, password);
      
      if (!data || !data.token) {
        throw new Error('Không nhận được token từ server');
      }
      
      const { token } = data;
      await AsyncStorage.setItem('authToken', token);
      
      const userData = await getUserInfo();
      
      if (!userData || !userData.phoneNumber) {
        throw new Error('Không thể lấy thông tin người dùng hoặc dữ liệu không hợp lệ');
      }
      
      console.log('Login successful, user data:', userData);
      
      // Update context values
      setUserInfo(userData);
      setToken(token);
      setIsLoggedIn(true);
      
      // Store complete user data, not just phone number
      await AsyncStorage.setItem('phoneNumber', userData.phoneNumber);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      // Show user info panel before navigation
      setLoginUserData(userData);
      setShowUserPanel(true);
      
    } catch (error) {
      console.log('Login error:', error?.message || error);
      
      await AsyncStorage.setItem('authToken', '');
      
      setToken('');
      setIsLoggedIn(false);
      
      if (error.response) {
        Alert.alert('Đăng nhập thất bại', error.response.data.message || 'Số điện thoại hoặc mật khẩu không đúng');
      } else {
        Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại sau.' + (error.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setShowUserPanel(false);
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ConversationListScreen' }],
      });
    }, 100);
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
        style={styles.forgotPasswordBtn}
        onPress={() => navigation.navigate('ForgotPasswordScreen')}
      >
        <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.loginButton, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginText}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </Text>
      </TouchableOpacity>

      <View style={styles.registerContainer}>
        <Text style={styles.questionText}>Bạn chưa có tài khoản Zala?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={styles.registerText}>Đăng ký</Text>
        </TouchableOpacity>
      </View>

      {/* User Info Panel Modal */}
      <Modal
        visible={showUserPanel}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.userInfoPanel}>
            <Text style={styles.panelTitle}>Đăng nhập thành công!</Text>
            
            <View style={styles.userInfoContainer}>
              <Text style={styles.infoLabel}>Thông tin người dùng:</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Số điện thoại:</Text>
                <Text style={styles.infoValue}>{loginUserData?.phoneNumber}</Text>
              </View>
              
              {loginUserData?.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Tên:</Text>
                  <Text style={styles.infoValue}>{loginUserData.name}</Text>
                </View>
              )}
              
              {loginUserData?.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>Email:</Text>
                  <Text style={styles.infoValue}>{loginUserData.email}</Text>
                </View>
              )}
              
              {loginUserData?.id && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>ID:</Text>
                  <Text style={styles.infoValue}>{loginUserData.id}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Status:</Text>
                <Text style={[styles.infoValue, styles.successText]}>✓ Đã lưu thành công</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    marginBottom: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.logoPrimary,
    fontSize: 14,
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
  // Modal and User Info Panel Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userInfoPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.logoPrimary || '#007AFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  userInfoContainer: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoKey: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  successText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: Colors.btnBackground || '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});