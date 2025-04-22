import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Colors from "../constants/colors";
import { useUserInfo } from '../contexts/UserInfoContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { logoutUser } from "../api/authApi";

// Ảnh mặc định
const DEFAULT_AVATAR = "https://via.placeholder.com/70";

export default function Setting() {
  const navigation = useNavigation();
  const userInfo = useUserInfo().userInfo;
  const settings = [
    {
      icon: "settings",
      title: "Thông tin",
      description: "Chỉnh sửa thông tin cá nhân",
      navigateTo: "ProfileScreen",
    },
    {
      icon: "log-out",
      title: "Đăng xuất",
      description: "Đăng xuất tài khoản",
      action: "logout",
    },
  ];

  const handleLogout = async (navigation) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn đăng xuất không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đăng xuất",
          style: "destructive",
          onPress: async () => {
            try {
              // Xóa token và lịch sử tìm kiếm
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('searchQueries');
              await AsyncStorage.removeItem('recentPeople');
  
              console.log("Đăng xuất thành công");
  
              // Reset navigation về Login
              navigation.reset({
                index: 0,
                routes: [{ name: 'LoginScreen' }],
              });
            } catch (error) {
              console.error('Lỗi khi đăng xuất:', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate("PersonalScreen")}
        // onPress={() => navigation.navigate("PersonalPage")}
      >
        <Image
          source={{
            uri: userInfo?.baseImg || DEFAULT_AVATAR, 
          }}
          style={styles.avatar}
        />
        <View style={styles.userText}>
          <Text style={styles.userName}>{userInfo?.name || "Đang tải..."}</Text>
          <Text style={styles.userNickname}>Xem trang cá nhân</Text>
        </View>
      </TouchableOpacity>

      {settings.map((item, index) => (
        <TouchableOpacity
        key={index}
        style={styles.settingItem}
        onPress={() => {
          if (item.action === "logout") {
            handleLogout(navigation);
          } else if (item.navigateTo) {
            navigation.navigate(item.navigateTo);
          }
        }}
      >
          <Feather
            name={item.icon}
            size={24}
            color="#000"
            style={styles.settingIcon}
          />
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.settingDescription}>{item.description}</Text>
            ) : null}
          </View>
          <Feather name="chevron-right" size={24} color="#ccc" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingBottom: 60,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    marginTop: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 50,
    marginRight: 15,
    marginLeft: 20,
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  userNickname: {
    fontSize: 14,
    color: Colors.btnBackground,
    marginTop: 5,
    paddingLeft: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: Colors.btnBackground,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: "#fff",
  },
  settingDescription: {
    fontSize: 12,
    color: "#000",
    marginTop: 5,
  },
});