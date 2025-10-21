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
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import ErrorModal from "../Components/ErrorModal";

const ForgotPasswordScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleForgotPassword = async () => {
    setIsSending(true);
    const user = { email: email };

    try {
      const res = await axios.post(
        "http://10.0.2.2:3000/api/auth/forgot-password",
        user
      );
      setIsSending(false);
      navigation.navigate("ForgotPasswordVerification", { email: email });
      setEmail("");
    } catch (err) {
      setIsSending(false);
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
              <Text style={styles.title}>Quên mật khẩu</Text>
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
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={isSending}
            >
              <Text style={styles.buttonText}>
                {isSending ? "Đang gửi mã xác thực" : "Gửi mã xác thực"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Trở lại đăng nhập</Text>
            </TouchableOpacity>
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
                setModalVisible(!modalVisible);
                if (modalMessage === "Tài khoản chưa xác minh") {
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

export default ForgotPasswordScreen;

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
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#008B45",
    textAlign: "center",
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
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    width: "100%",
    marginBottom: 10,
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
    marginTop: 10,
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
