import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Entypo } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import ErrorModal from "../Components/ErrorModal";
import axios from "axios";
const SettingScreen = () => {
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isNameModalVisible, setNameModalVisible] = useState(false);
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        try {
          const storedToken = await AsyncStorage.getItem("token");
          const storedFirstName = await AsyncStorage.getItem("firstName");
          const storedLastName = await AsyncStorage.getItem("lastName");
          const storedEmail = await AsyncStorage.getItem("email");

          if (storedToken) setToken(storedToken);
          if (storedFirstName) setFirstName(storedFirstName);
          if (storedLastName) setLastName(storedLastName);
          if (storedEmail) setEmail(storedEmail);
        } catch (error) {
          console.error("❌ Error loading user info from storage:", error);
        }
      };
      fetchUserData();
    }, [])
  );


  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("firstName");
      await AsyncStorage.removeItem("lastName");
      await AsyncStorage.removeItem("email");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

 
  const showModal = (message) => {
    setModalMessage(message);
    setModalVisible(true);
  };


  const handleChangePassword = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const userData = {
        oldPassword,
        newPassword,
        confirmPassword,
      };

      const response = await axios.put(
        "http://10.0.2.2:3000/api/auth/change-password",
        userData, 
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      showModal(data.message || "Đổi mật khẩu thành công.");
      setPasswordModalVisible(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error.response && error.response.data) {
        const errData = error.response.data;
        if (errData.details && errData.details.length > 0) {
          showModal(errData.details[0]);
        } else {
          showModal(errData.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
      } else {
        showModal("Không thể kết nối đến server. Vui lòng kiểm tra mạng.");
      }
    }
  };

  const handleCancelPasswordChange = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordModalVisible(false);
  };

  const togglePasswordVisibility = () => {
    setShowOldPassword(!showOldPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleRename = async () => {
    try {
      const userName = {
        firstName,
        lastName,
      };

      const response = await axios.put(
        "http://10.0.2.2:3000/api/auth/change-userName",
        userName,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      await AsyncStorage.setItem("firstName", firstName);
      await AsyncStorage.setItem("lastName", lastName);
      showModal(data.message || "Đổi tên thành công.");
      setNameModalVisible(false);
    } catch (error) {
      console.error("Error renaming user: ", error);

      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.details && data.details.length > 0) {
          showModal(data.details[0]);
        } else {
          showModal(data.message || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
      } else {
        showModal("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    }
  };

  const renderNameModal = useMemo(
    () => (
      <Modal
        visible={isNameModalVisible}
        transparent
        animated
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa tên</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Tên"
            />
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Họ"
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleRename}>
              <Text style={styles.modalButtonText}>Lưu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setNameModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Huy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [isNameModalVisible, firstName, lastName]
  );

  const renderPasswordModal = useMemo(
    () => (
      <Modal
        visible={isPasswordModalVisible}
        transparent
        animated
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <View style={styles.inputPasswordContainer}>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Mật khẩu cũ"
                secureTextEntry={!showOldPassword}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                style={styles.iconContainer}
              >
                <Entypo
                  name={showOldPassword ? "eye" : "eye-with-line"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </View>
            <View>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Mật khẩu mới"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={toggleNewPasswordVisibility}
                style={styles.iconContainer}
              >
                <Entypo
                  name={showNewPassword ? "eye" : "eye-with-line"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </View>
            <View>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Nhập lại mật khẩu"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={toggleConfirmPasswordVisibility}
                style={styles.iconContainer}
              >
                <Entypo
                  name={showConfirmPassword ? "eye" : "eye-with-line"}
                  size={24}
                  color="black"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.modalButtonText}>Lưu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancelPasswordChange}
            >
              <Text style={styles.modalButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [
      isPasswordModalVisible,
      oldPassword,
      newPassword,
      confirmPassword,
      showOldPassword,
      showNewPassword,
      showConfirmPassword,
    ]
  );

  const renderLogoutModal = useMemo(
    () => (
      <Modal
        visible={isLogoutModalVisible}
        transparent
        animated
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận đăng xuất</Text>
            <Text style={styles.modalText}>
              Bạn có chắc chắn muốn đăng xuất?
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSignOut}
            >
              <Text style={styles.modalButtonText}>Đăng xuất</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setLogoutModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ),
    [isLogoutModalVisible]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/Logo/PennyRoot.png")}
          style={styles.logo}
        />
        <View style={styles.headerName}>
          <Text style={styles.label}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.chanegeNameButton}
        onPress={() => setNameModalVisible(true)}
      >
        <FontAwesome name="exchange" size={24} color="white" />
        <Text style={styles.buttonNameText}>Đổi tên</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.chanegePasswordButton}
        onPress={() => setPasswordModalVisible(true)}
      >
        <MaterialIcons name="password" size={24} color="white" />
        <Text style={styles.buttonPasswordText}>Đổi mật khẩu</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.signOutButton]}
        onPress={() => setLogoutModalVisible(true)}
      >
        <Entypo name="log-out" size={24} color="white" />
        <Text style={styles.buttonText}>Đăng xuất</Text>
      </TouchableOpacity>

      {renderNameModal}
      {renderPasswordModal}
      {renderLogoutModal}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={() => setModalVisible(!modalVisible)}
            >
              <Text style={styles.textStyle}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {errorModal && (
        <ErrorModal
          visible={errorModal}
          message={errorModalMessage}
          onClose={() => setErrorModal(false)}
        />
      )}
    </View>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#CCCCCC", // Changed to light background
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    borderRadius: 30,
  },
  headerName: {
    marginLeft: 20,
    fontWeight: "bold",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000", // Changed to dark text
  },
  email: {
    fontSize: 14,
    color: "#000000", // Changed to dark text
  },
  chanegeNameButton: {
    backgroundColor: "#008B45",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "row",
  },
  chanegePasswordButton: {
    backgroundColor: "#008B45",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "row",
  },
  button: {
    backgroundColor: "#008B45",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    width: 150,
    alignSelf: "center",
    marginTop: 20,
  },
  buttonNameText: {
    color: "#FFFFFF", // Changed to light text
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 50,
  },
  buttonPasswordText: {
    color: "#FFFFFF", // Changed to light text
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 50,
  },
  buttonText: {
    color: "#FFFFFF", // Changed to light text
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#DC3545",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 320,
    padding: 20,
    backgroundColor: "#FFFFFF", // Changed to light background
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    backgroundColor: "#FFFFFF", // Changed to light background
  },
  modalButton: {
    backgroundColor: "#008B45",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  modalButtonText: {
    color: "#FFFFFF", // Changed to light text
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  iconContainer: {
    position: "absolute",
    right: 10,
    padding: 10,
    top: 5,
  },
  modalView: {
    margin: 20,
    backgroundColor: "#FFFFFF", // Changed to light background
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonConfirm: {
    backgroundColor: "#008B45",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
});
