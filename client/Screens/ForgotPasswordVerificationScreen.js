import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import ErrorModal from "../Components/ErrorModal";

const ForgotPasswordVerificationScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [isResendEnabled, setIsResendEnabled] = useState(false);
  const inputsRef = useRef([]);
  const [codeValidityTimer, setCodeValidityTimer] = useState(15 * 60);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendEnabled(true);
    }
  }, [timer]);

  useEffect(() => {
    if (codeValidityTimer > 0) {
      const validityInterval = setInterval(() => {
        setCodeValidityTimer((prevTime) => prevTime - 1);
      }, 1000);
      return () => clearInterval(validityInterval);
    } else {
      setCode(["", "", "", "", "", ""]);
      setIsResendEnabled(true);
    }
  }, [codeValidityTimer]);

  const handleVerify = async () => {
    setLoading(true);
    const verificationCode = code.join("");

    try {
      const response = await fetch(
        "http://10.0.2.2:3000/api/auth/forgot-password/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            code: verificationCode, 
          }),
        }
      );

      const data = await response.json();

  
      if (!response.ok || !data.success) {

        const msg =
          data.details && Array.isArray(data.details) && data.details.length > 0
            ? data.details.join("\n")
            : data.message || "Mã xác minh không hợp lệ";

        setErrorModalMessage(msg);
        setErrorModal(true);
        setCode(["", "", "", "", "", ""]);
        inputsRef.current[0]?.focus();
        setLoading(false);
        return;
      }


      setLoading(false);
      setModalMessage(
        "Xác minh thành công, mật khẩu mới đã được gửi đến email của bạn."
      );
      setModalVisible(true);

      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate("Login");
      }, 2000);
    } catch (err) {
      console.error("❌ Lỗi verify:", err);
      setLoading(false);

      const msg =
        err instanceof SyntaxError
          ? "Server trả về dữ liệu không hợp lệ."
          : "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.";

      setErrorModalMessage(msg);
      setErrorModal(true);
    }
  };

    const handleResendCode = async () => {
    setIsResendEnabled(false);
    try {
      const response = await fetch("http://10.0.2.2:3000/api/auth/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setErrorModalMessage("Mã xác thực đã được gửi lại.");
        setErrorModal(true);
        setTimer(60);
        setCodeValidityTimer(15 * 60);
      } else {
        setErrorModalMessage(
          data.message || "Có gì đó không ổn. Vui lòng thử lại."
        );
        setErrorModal(true);
        setIsResendEnabled(true);
      }
    } catch (error) {
      setErrorModalMessage("Có gì đó không ổn. Vui lòng thử lại.");
      setErrorModal(true);
      setIsResendEnabled(true);
    }
  };

  const handleChangeText = (text, index) => {
    const newCode = [...code];

    if (text) {
      newCode[index] = text;
      if (index < inputsRef.current.length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    } else {
      newCode.splice(index, 1);
      newCode.push("");
      setCode(newCode);

      if (index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }

    setCode(newCode);
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Entypo name="chevron-thin-left" size={30} color="#008B45" />
        </TouchableOpacity>
      </View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}> Nhập mã xác minh</Text>
          <Text style={styles.subtitle}>
            Chúng tôi đã gửi mã xác minh đến email của bạn.
          </Text>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputsRef.current[index] = ref)}
                style={styles.input}
                keyboardType="numeric"
                maxLength={1}
                onChangeText={(text) => handleChangeText(text, index)}
                value={digit}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerify}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Đang xác thực..." : "Xác thực"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.expiresText}>
            Mã hết hạn trong: {Math.floor(codeValidityTimer / 60)}:
            {String(codeValidityTimer % 60).padStart(2, "0")}
          </Text>

          <Text style={styles.timerText}>
            {isResendEnabled ? (
              <TouchableOpacity onPress={handleResendCode}>
                <Text style={styles.link}>Gửi lại mã</Text>
              </TouchableOpacity>
            ) : (
              `Gửi lại mã trong ${timer}s`
            )}
          </Text>
        </View>
      </TouchableWithoutFeedback>

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
                navigation.navigate("Login");
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

export default ForgotPasswordVerificationScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 20,
  },
  backButton: {
    padding: 5,
    marginTop: 10,
    borderRadius: 20,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  innerContainer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 40,
    textAlign: "center",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F0F0F0",
    color: "#000000",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    width: "13%",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#000000",
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
  },
  timerText: {
    color: "#000000",
    fontSize: 16,
    marginTop: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  expiresText: {
    color: "#FF5555",
    fontSize: 18,
    marginTop: 15,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#F0F0F0",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5555",
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
