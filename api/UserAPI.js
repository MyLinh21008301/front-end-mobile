import axios from "axios";
import BASE_URL from "./BaseURL";
import { getToken } from "./TokenAPI";
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_API = {
  whoAmI: `${BASE_URL}/users/whoami`,
};

export const getUserInfo = async () => {
  try {
    const jwt = await getToken();
    if (!jwt) {
      console.warn("Không có JWT, bỏ qua getUserInfo");
      return null;
    }

    const response = await axios.post(
      USER_API.whoAmI,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user info:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// update userInfo
export const updateUserData = async (tempData, user, DEFAULT_AVATAR) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    const phoneNumber = await AsyncStorage.getItem("phoneNumber");
    if (!token || !phoneNumber)
      throw new Error("Missing token or phone number");

    const formData = new FormData();
    formData.append("name", tempData.name || "");
    formData.append("phoneNumber", tempData.phoneNumber || phoneNumber);
    formData.append("bio", tempData.bio || "");
    formData.append("dateOfBirth", tempData.dateOfBirth || "");
    formData.append(
      "isMale",
      tempData.isMale !== undefined ? tempData.isMale.toString() : "true"
    );

    if (
      tempData.baseImg &&
      tempData.baseImg !== user.baseImg &&
      tempData.baseImg !== DEFAULT_AVATAR
    ) {
      const extension = tempData.baseImg.split(".").pop().toLowerCase();
      let type = "image/jpeg";
      let fileName = "avatar.jpg";
      if (extension === "png") {
        type = "image/png";
        fileName = "avatar.png";
      }
      if (extension === "jpg" || extension === "jpeg") {
        type = "image/jpeg";
        fileName = "avatar.jpg";
      }

      formData.append("baseImg", {
        uri: tempData.baseImg,
        type: type,
        name: fileName,
      });
    }

    const response = await axios.put(`${BASE_URL}/users/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Lỗi cập nhật người dùng:",
      error.response?.data || error.message
    );
    throw error;
  }
};
