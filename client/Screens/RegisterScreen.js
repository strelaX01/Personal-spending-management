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
  Modal,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import ErrorModal from "../Components/ErrorModal";
import axios from "axios";

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepassword, setShowRepassword] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRePasswordVisibility = () => {
    setShowRepassword(!showRepassword);
  };

  const handleGoToLogin = () => {
    navigation.navigate("Login");
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      const user = {
        email: email.trim(),
        password: password.trim(),
        repassword: repassword.trim(),
      };

      console.log("📤 Data gửi:", user);

      const response = await axios.post(
        "http://10.0.2.2:3000/api/auth/register",
        user
      );

      const data = response.data;

      if (data.success) {
        setEmail("");
        setPassword("");
        setRepassword("");
        setShowPassword(false);
        setShowRepassword(false);
        setIsRegistering(false);

        navigation.navigate("Verification", { email: user.email });
      } else {
        setIsRegistering(false);
        setErrorModalMessage(data.message || "Đăng ký thất bại.");
        setErrorModal(true);
      }
    } catch (err) {
      setIsRegistering(false);

      if (err.response) {
        const { message, details } = err.response.data;
        console.log("📥 Dữ liệu lỗi từ server:", err.response.data);

        const errorMsg =
          details && Array.isArray(details)
            ? details[0]
            : message || "Đăng ký thất bại.";

        setErrorModalMessage(errorMsg);
        setErrorModal(true);
      } else {
        setErrorModalMessage(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng."
        );
        setErrorModal(true);
      }
    }
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
              <Text style={styles.title}>Đăng ký</Text>
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
              <View style={styles.inputPasswordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#888"
                  secureTextEntry={!showRepassword}
                  returnKeyType="done"
                  onChangeText={(text) => setRepassword(text)}
                  value={repassword}
                />
                <TouchableOpacity
                  onPress={toggleRePasswordVisibility}
                  style={styles.iconContainer}
                >
                  <Entypo
                    name={showRepassword ? "eye" : "eye-with-line"}
                    size={24}
                    color="black"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister}>
              <Text style={styles.buttonText}>
                {isRegistering ? "Đang đăng ký..." : "Đăng ký"}
              </Text>
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.footerText}>Bạn đã có tài khoản?</Text>
              <TouchableOpacity onPress={handleGoToLogin}>
                <Text style={styles.footerLink}> Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {errorModal && (
        <ErrorModal
          message={errorModalMessage}
          onClose={() => setErrorModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default RegisterScreen;

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
    color: "#00FF88",
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
});
