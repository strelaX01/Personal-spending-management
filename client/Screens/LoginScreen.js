import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Modal,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorModal from "../Components/ErrorModal";
import axios from "axios";

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoToSignup = () => {
    navigation.navigate("Register");
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const user = {
        email: email.trim(),
        password: password.trim(),
      };

      const response = await axios.post(
        "http://10.0.2.2:3000/api/auth/login",
        user
      );

      const data = response.data;

      if (data.success) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("firstName", data.user.firstname);
        await AsyncStorage.setItem("lastName", data.user.lastname);
        await AsyncStorage.setItem("email", data.user.email);

        setIsLoggingIn(false);
        navigation.navigate("BottomTabs");
      } else {
        setIsLoggingIn(false);
        setModalMessage(data.message || "Đăng nhập thất bại.");
        setModalVisible(true);
      }
    } catch (err) {
      setIsLoggingIn(false);

      if (err.response) {
        const { message, details } = err.response.data;
        if (details && Array.isArray(details) && details.length > 0) {
          setModalMessage(details.join("\n"));
        } else {
          setModalMessage(message || "Đã xảy ra lỗi.");
        }
        setModalVisible(true);
      } else {
        setErrorModalMessage(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng."
        );
        setErrorModal(true);
      }
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.innerContainer}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/Logo/PennyRoot-Logo.png")}
                style={styles.logo}
              />
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Đăng nhập</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                keyboardType="email-address"
                returnKeyType="next"
                onChangeText={(text) => setEmail(text)}
                value={email}
              />
              <View style={styles.inputPasswordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  placeholderTextColor="#888"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onChangeText={(text) => setPassword(text)}
                  value={password}
                />
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  style={styles.iconContainer}
                >
                  <Entypo
                    name={showPassword ? "eye" : "eye-with-line"}
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>
                {isLoggingIn ? "Đang đăng nhập" : "Đăng nhập"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.link}>Quên mật khẩu?</Text>
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Bạn chưa có tài khoản?</Text>
              <TouchableOpacity onPress={handleGoToSignup}>
                <Text style={styles.footerLink}> Dăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

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
              style={[styles.buttonModal, styles.buttonConfirm]}
              onPress={() => {
                setModalVisible(false);
                if (modalMessage.includes("chưa được xác minh")) {
                  navigation.navigate("Verification", { email });
                }
              }}
            >
              <Text style={styles.textStyle}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {errorModal && (
        <ErrorModal
          message={errorModalMessage}
          onClose={() => setErrorModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  innerContainer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 100,
  },
  logo: {
    width: 320,
    height: 180,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#008B45",
    marginBottom: 40,
    textAlign: "center",
  },
  inputPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    position: "absolute",
    right: 10,
    padding: 10,
    top: 5,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#DDDDDD",
    color: "#000000",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    width: "100%",
  },
  button: {
    backgroundColor: "#008B45",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    color: "#008B45",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  footer: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "center",
  },
  footerText: {
    color: "#000000",
    fontSize: 14,
  },
  footerLink: {
    color: "#008B45",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
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
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  buttonModal: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
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
