// TrangCaNhan.js

import React, { useLayoutEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserInfo } from '../contexts/UserInfoContext'; // Điều chỉnh đường dẫn nếu cần
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateUserInfo } from '../apis/UserAPI'; // Import hàm API
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker

export default function TrangCaNhan({ navigation }) {
  const { userInfo, setUserInfo } = useUserInfo();
  const [dangChinhSua, setDangChinhSua] = useState(false);
  const [thongTinChinhSua, setThongTinChinhSua] = useState({});
  const [hienThiDatePicker, setHienThiDatePicker] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  
  // Khởi tạo thông tin chỉnh sửa khi vào chế độ chỉnh sửa
  const batDauChinhSua = () => {
    setThongTinChinhSua({
      name: userInfo.name || '',
      bio: userInfo.bio || '',
      dateOfBirth: userInfo.dateOfBirth || '',
      male: userInfo.male !== undefined ? userInfo.male : true,
      status: userInfo.status || '',
      baseImg: userInfo.baseImg || null,
      backgroundImg: userInfo.backgroundImg || null,
    });
    setDangChinhSua(true);
  };

  // Hủy chỉnh sửa và đặt lại dữ liệu ban đầu
  const huyChinhSua = () => {
    setDangChinhSua(false);
    setThongTinChinhSua({});
  };

  // Xử lý thay đổi ngày từ bộ chọn ngày
  const thayDoiNgay = (event, ngayDaChon) => {
    setHienThiDatePicker(Platform.OS === 'ios');
    if (ngayDaChon) {
      const ngayDinhDang = ngayDaChon.toISOString().split('T')[0]; // Định dạng như YYYY-MM-DD
      setThongTinChinhSua({ ...thongTinChinhSua, dateOfBirth: ngayDinhDang });
    }
  };

  // Chọn ảnh đại diện
  const chonAnhDaiDien = async () => {
    try {
      // Yêu cầu quyền truy cập
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục.');
        return;
      }
      
      // Mở bộ chọn ảnh
      const ketQua = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!ketQua.canceled && ketQua.assets && ketQua.assets.length > 0) {
        // Xử lý ảnh (tạo đối tượng file cho API tải lên)
        const duongDanAnh = ketQua.assets[0].uri;
        const tenFile = duongDanAnh.split('/').pop();
        const match = /\.(\w+)$/.exec(tenFile);
        const loaiFile = match ? `image/${match[1]}` : 'image';
        
        const fileAnh = {
          uri: duongDanAnh,
          name: tenFile,
          type: loaiFile
        };
        
        setThongTinChinhSua(prev => ({ ...prev, baseImg: fileAnh, baseImgPreview: duongDanAnh }));
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh đại diện:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    }
  };
  
  // Chọn ảnh nền
  const chonAnhNen = async () => {
    try {
      // Yêu cầu quyền truy cập
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục.');
        return;
      }
      
      // Mở bộ chọn ảnh
      const ketQua = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Tốt hơn cho ảnh nền
        quality: 0.8,
      });
      
      if (!ketQua.canceled && ketQua.assets && ketQua.assets.length > 0) {
        // Xử lý ảnh (tạo đối tượng file cho API tải lên)
        const duongDanAnh = ketQua.assets[0].uri;
        const tenFile = duongDanAnh.split('/').pop();
        const match = /\.(\w+)$/.exec(tenFile);
        const loaiFile = match ? `image/${match[1]}` : 'image';
        
        const fileAnh = {
          uri: duongDanAnh,
          name: tenFile,
          type: loaiFile
        };
        
        setThongTinChinhSua(prev => ({ ...prev, backgroundImg: fileAnh, backgroundImgPreview: duongDanAnh }));
      }
    } catch (error) {
      console.error('Lỗi khi chọn ảnh nền:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    }
  };

  // Lưu thông tin đã cập nhật
  const luuThayDoi = async () => {
    try {
      setDangTai(true);

      // Xác thực trường nhập liệu
      if (!thongTinChinhSua.name?.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập họ và tên');
        setDangTai(false);
        return;
      }

      // Gọi API để cập nhật thông tin người dùng
      const nguoiDungDaCapNhat = await updateUserInfo(thongTinChinhSua);
      
      // Cập nhật context với thông tin người dùng mới
      setUserInfo({ ...userInfo, ...nguoiDungDaCapNhat });
      
      setDangChinhSua(false);
      setDangTai(false);
      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật');
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin người dùng:', error);
      setDangTai(false);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
    }
  };

  // Định nghĩa hàm đăng xuất
  const xuLyDangXuat = async () => {
    try {
      // Xóa JWT token và lịch sử tìm kiếm khỏi AsyncStorage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('searchQueries');
      await AsyncStorage.removeItem('recentPeople');
      // Đặt lại ngăn xếp điều hướng để chuyển đến màn hình Đăng nhập
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (error) {
      console.error('Lỗi trong quá trình đăng xuất:', error);
    }
  };

  // Định dạng ngày để hiển thị tốt hơn
  const dinhDangNgay = (chuoiNgay) => {
    if (!chuoiNgay) return '';
    try {
      const ngay = new Date(chuoiNgay);
      return ngay.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return chuoiNgay;
    }
  };

  // Cấu hình tiêu đề điều hướng với nút quay lại và đăng xuất
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.nutTieuDe}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={xuLyDangXuat} style={styles.nutTieuDe}>
          <Ionicons name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
      ),
      headerTitle: 'Trang cá nhân',
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTitleStyle: {
        fontSize: 20,
        fontWeight: '600',
      },
    });
  }, [navigation]);

  // Hiển thị mục thông tin hồ sơ cho chế độ xem
  const hienThiMucThongTinHoSo = (tenBieuTuong, nhanMuc, giaTri) => {
    if (!giaTri && giaTri !== false) return null;
    
    return (
      <View style={styles.mucThongTin}>
        <Ionicons name={tenBieuTuong} size={22} color="#666" style={styles.bieuTuongThongTin} />
        <View style={styles.khungChuaVanBanThongTin}>
          <Text style={styles.nhanThongTin}>{nhanMuc}</Text>
          <Text style={styles.giaTriThongTin}>{giaTri}</Text>
        </View>
      </View>
    );
  };

  // Hiển thị mục thông tin hồ sơ cho chế độ chỉnh sửa
  const hienThiMucThongTinChinhSua = (tenBieuTuong, nhanMuc, khoa, chuThich, laNgay = false, laGioiTinh = false) => {
    return (
      <View style={styles.mucThongTinChinhSua}>
        <Ionicons name={tenBieuTuong} size={22} color="#666" style={styles.bieuTuongThongTin} />
        <View style={styles.khungChuaVanBanThongTin}>
          <Text style={styles.nhanThongTin}>{nhanMuc}</Text>
          
          {laNgay ? (
            <TouchableOpacity 
              style={styles.nutChonNgay}
              onPress={() => setHienThiDatePicker(true)}
            >
              <Text style={styles.chuNgay}>
                {thongTinChinhSua.dateOfBirth ? dinhDangNgay(thongTinChinhSua.dateOfBirth) : 'Chọn ngày sinh'}
              </Text>
              <Ionicons name="calendar-outline" size={18} color="#007bff" />
            </TouchableOpacity>
          ) : laGioiTinh ? (
            <View style={styles.khungGioiTinh}>
              <TouchableOpacity
                style={[
                  styles.nutGioiTinh,
                  thongTinChinhSua.male && styles.nutGioiTinhKichHoat
                ]}
                onPress={() => setThongTinChinhSua({ ...thongTinChinhSua, male: true })}
              >
                <Text style={[
                  styles.chuNutGioiTinh,
                  thongTinChinhSua.male && styles.chuNutGioiTinhKichHoat
                ]}>Nam</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nutGioiTinh,
                  !thongTinChinhSua.male && styles.nutGioiTinhKichHoat
                ]}
                onPress={() => setThongTinChinhSua({ ...thongTinChinhSua, male: false })}
              >
                <Text style={[
                  styles.chuNutGioiTinh,
                  !thongTinChinhSua.male && styles.chuNutGioiTinhKichHoat
                ]}>Nữ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.nhapLieu}
              value={thongTinChinhSua[khoa]}
              onChangeText={(text) => setThongTinChinhSua({ ...thongTinChinhSua, [khoa]: text })}
              placeholder={chuThich}
              multiline={khoa === 'bio'}
              numberOfLines={khoa === 'bio' ? 3 : 1}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.khungAnToan}>
      <ScrollView
        style={styles.khungChua}
        contentContainerStyle={styles.khungNoiDung}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.khungChuaAnhNen}>
          {dangChinhSua ? (
            <TouchableOpacity 
              style={styles.khungChinhSuaAnhNen} 
              onPress={chonAnhNen}
              activeOpacity={0.8}
            >
              {thongTinChinhSua.backgroundImgPreview ? (
                <Image
                  source={{ uri: thongTinChinhSua.backgroundImgPreview }}
                  style={styles.anhNen}
                  resizeMode="cover"
                />
              ) : userInfo.backgroundImg ? (
                <Image
                  source={{ uri: userInfo.backgroundImg }}
                  style={styles.anhNen}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.giuChoAnhNen} />
              )}
              <View style={styles.loptrenChinhSua}>
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.chuChinhSuaAnh}>Chọn ảnh bìa</Text>
              </View>
            </TouchableOpacity>
          ) : (
            userInfo.backgroundImg ? (
              <Image
                source={{ uri: userInfo.backgroundImg }}
                style={styles.anhNen}
                resizeMode="cover"
                onError={(e) => console.log('Lỗi ảnh nền:', e.nativeEvent.error)}
              />
            ) : (
              <View style={styles.giuChoAnhNen} />
            )
          )}
        </View>

        <View style={styles.khungHoSo}>
          {dangChinhSua ? (
            <TouchableOpacity 
              style={styles.khungChinhSuaAnhDaiDien} 
              onPress={chonAnhDaiDien}
              activeOpacity={0.8}
            >
              {thongTinChinhSua.baseImgPreview ? (
                <Image
                  source={{ uri: thongTinChinhSua.baseImgPreview }}
                  style={styles.anhDaiDien}
                  resizeMode="cover"
                />
              ) : userInfo.baseImg ? (
                <Image
                  source={{ uri: userInfo.baseImg }}
                  style={styles.anhDaiDien}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.anhDaiDien, styles.giuChoAnhDaiDien]} />
              )}
              <View style={styles.lopTrenChinhSuaAnhDaiDien}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
          ) : (
            <Image
              source={{ uri: userInfo.baseImg }}
              style={styles.anhDaiDien}
              resizeMode="cover"
              onError={(e) => console.log('Lỗi ảnh đại diện:', e.nativeEvent.error)}
            />
          )}

          <Text style={styles.ten}>{userInfo.name || 'Không xác định'}</Text>
          <Text style={styles.soDienThoai}>{userInfo.phoneNumber || 'N/A'}</Text>

          {/* Nút Chỉnh sửa Hồ sơ */}
          {!dangChinhSua ? (
            <TouchableOpacity 
              style={styles.nutChinhSua} 
              onPress={batDauChinhSua}
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.chuNutChinhSua}>Chỉnh sửa thông tin</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.nutHanhDongChinhSua}>
              <TouchableOpacity 
                style={[styles.nutHanhDong, styles.nutHuy]} 
                onPress={huyChinhSua}
              >
                <Text style={styles.chuNutHanhDong}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.nutHanhDong, styles.nutLuu]} 
                onPress={luuThayDoi}
                disabled={dangTai}
              >
                {dangTai ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.chuNutHanhDong}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.phanThongTin}>
            <Text style={styles.tieuDePhan}>Thông tin cá nhân</Text>
            
            {dangChinhSua ? (
              // Chế độ chỉnh sửa
              <>
                {hienThiMucThongTinChinhSua('person', 'Họ và tên', 'name', 'Nhập họ và tên...')}
                {hienThiMucThongTinChinhSua('calendar', 'Ngày sinh', 'dateOfBirth', 'Chọn ngày sinh...', true)}
                {hienThiMucThongTinChinhSua('male-female', 'Giới tính', 'male', '', false, true)}
                {hienThiMucThongTinChinhSua('document-text', 'Bio', 'bio', 'Giới thiệu về bạn...')}
                {hienThiMucThongTinChinhSua('time', 'Trạng thái', 'status', 'Cập nhật trạng thái...')}
              </>
            ) : (
              // Chế độ xem
              <>
                {hienThiMucThongTinHoSo('person', 'Họ và tên', userInfo.name)}
                {hienThiMucThongTinHoSo('calendar', 'Ngày sinh', dinhDangNgay(userInfo.dateOfBirth))}
                {hienThiMucThongTinHoSo('male-female', 'Giới tính', 
                  userInfo.male !== undefined ? (userInfo.male ? 'Nam' : 'Nữ') : 'N/A'
                )}
                {hienThiMucThongTinHoSo('document-text', 'Bio', userInfo.bio)}
                {hienThiMucThongTinHoSo('time', 'Trạng thái', userInfo.status)}
                {hienThiMucThongTinHoSo('time-outline', 'Hoạt động gần đây', 
                  userInfo.lastOnlineTime ? new Date(userInfo.lastOnlineTime).toLocaleString('vi-VN') : 'N/A'
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Hộp chọn ngày tháng cho Android */}
      {hienThiDatePicker && (
        <DateTimePicker
          value={thongTinChinhSua.dateOfBirth ? new Date(thongTinChinhSua.dateOfBirth) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={thayDoiNgay}
          maximumDate={new Date()} // Ngăn chặn ngày tương lai
        />
      )}
    </SafeAreaView>
  );
}

// Kiểu dáng
const styles = StyleSheet.create({
  khungAnToan: {
    flex: 1,
    backgroundColor: '#fff',
  },
  khungChua: {
    flex: 1,
  },
  khungNoiDung: {
    paddingBottom: 30,
  },
  khungChuaAnhNen: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
  },
  anhNen: {
    width: '100%',
    height: '100%',
  },
  giuChoAnhNen: {
    flex: 1,
    backgroundColor: '#ccc',
  },
  khungHoSo: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 20,
  },
  anhDaiDien: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#ddd',
  },
  giuChoAnhDaiDien: {
    backgroundColor: '#ddd',
  },
  ten: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 10,
  },
  soDienThoai: {
    fontSize: 16,
    color: '#888',
    marginBottom: 10,
  },
  phanThongTin: {
    width: '100%',
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tieuDePhan: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    paddingHorizontal: 15,
  },
  mucThongTin: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 15,
  },
  mucThongTinChinhSua: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 15,
  },
  bieuTuongThongTin: {
    marginRight: 12,
    marginTop: 2,
  },
  khungChuaVanBanThongTin: {
    flex: 1,
  },
  nhanThongTin: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  giaTriThongTin: {
    fontSize: 16,
    color: '#333',
  },
  nhapLieu: {
    fontSize: 16,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
  },
  nutChinhSua: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  chuNutChinhSua: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  nutHanhDongChinhSua: {
    flexDirection: 'row',
    marginTop: 10,
    width: '80%',
    justifyContent: 'space-between',
  },
  nutHanhDong: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    flex: 0.48,
    alignItems: 'center',
  },
  nutLuu: {
    backgroundColor: '#28a745',
  },
  nutHuy: {
    backgroundColor: '#6c757d',
  },
  chuNutHanhDong: {
    color: '#fff',
    fontWeight: '500',
  },
  nutTieuDe: {
    paddingHorizontal: 15,
  },
  nutChonNgay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  chuNgay: {
    fontSize: 16,
    color: '#333',
  },
  khungGioiTinh: {
    flexDirection: 'row',
    marginTop: 5,
  },
  nutGioiTinh: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  nutGioiTinhKichHoat: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  chuNutGioiTinh: {
    color: '#333',
  },
  chuNutGioiTinhKichHoat: {
    color: '#fff',
  },
  // Kiểu dáng mới cho chỉnh sửa ảnh
  khungChinhSuaAnhNen: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  loptrenChinhSua: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chuChinhSuaAnh: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  khungChinhSuaAnhDaiDien: {
    position: 'relative',
  },
  lopTrenChinhSuaAnhDaiDien: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007bff',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});