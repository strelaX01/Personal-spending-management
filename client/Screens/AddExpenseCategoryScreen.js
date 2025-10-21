import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import colors from "../assets/Colors/Colors";
import icons from "../assets/Icons/Icons";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorModal from "../Components/ErrorModal";
import axios from "axios";

const AddExpenseCategoryScreen = () => {
  const navigation = useNavigation();
  const [categoryName, setCategoryName] = useState("");
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getToken = async () => {
      try {
        const value = await AsyncStorage.getItem("token");
        if (value !== null) {
          setToken(value);
        }
      } catch (error) {
        console.error("Error getting token:", error);
      }
    };

    getToken();
  }, []);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  const handleIconSelect = (icon) => {
    setSelectedIcon(icon);
  };

  const startAnimation = () => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const handleAdd = async () => {
    setLoading(true);
    startAnimation();

    try {
      const newCategory = {
        name: categoryName,
        color: selectedColor,
        icon: selectedIcon,
      };

      const response = await axios.post(
        "http://10.0.2.2:3000/api/finance/expense/category",
        newCategory,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setModalMessage("Thêm danh mục thành công.");
        setModalVisible(true);
        setCategoryName("");
        setSelectedColor(null);
        setSelectedIcon(null);
      }
    } catch (error) {
      if (error.response) {
        setErrorModalMessage(error.response.data.message);
        setErrorModal(true);
      } else {
        setErrorModalMessage("Lỗi kết nối.");
        setErrorModal(true);
      }
    } finally {
      setLoading(false);
      spinValue.setValue(0);
    }
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={30} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Thêm danh mục</Text>
        {loading ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="add" size={30} color="#000000" />
          </Animated.View>
        ) : (
          <TouchableOpacity onPress={handleAdd}>
            <Text style={styles.addText}>Thêm</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bodyContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tên danh mục</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên danh mục"
            placeholderTextColor="#666"
            value={categoryName}
            onChangeText={(text) => setCategoryName(text)}
          />
        </View>

        <View style={styles.colorContainer}>
          <Text style={styles.colorLabel}>màu sắc</Text>
          <View style={styles.colorPicker}>
            {colors.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.color,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor,
                ]}
                onPress={() => handleColorSelect(color)}
              />
            ))}
          </View>
        </View>

        <View style={styles.iconContainer}>
          <Text style={styles.iconLabel}>Biểu tượng</Text>
          <View style={styles.scrollContainer}>
            <ScrollView contentContainerStyle={styles.iconPicker}>
              {icons.map((icon, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.icon,
                    selectedIcon === icon && styles.selectedIcon,
                    selectedIcon === icon && styles.selectedIconStyle,
                  ]}
                  onPress={() => handleIconSelect(icon)}
                >
                  <Ionicons
                    name={icon}
                    size={30}
                    color={
                      selectedIcon === icon && selectedColor
                        ? selectedColor
                        : "#333"
                    }
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={() => {
                setModalVisible(!modalVisible);
                navigation.goBack();
              }}
            >
              <Text style={styles.textStyle}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {modalMessage !== "Thêm danh mục thành công." && (
        <ErrorModal
          visible={errorModal}
          message={errorModalMessage}
          onClose={() => setErrorModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default AddExpenseCategoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: 50,
  },
  headerText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  addText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  bodyContainer: {
    padding: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: "#000000",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  input: {
    backgroundColor: "#DDDDDD",
    color: "#000000",
    padding: 10,
    borderRadius: 5,
  },
  colorContainer: {
    marginBottom: 20,
  },
  colorLabel: {
    color: "#000000",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
  },
  color: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#000000",
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconLabel: {
    color: "#000000",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  scrollContainer: {
    height: 380,
  },
  iconPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  icon: {
    width: "15%",
    aspectRatio: 1,
    borderRadius: 20,
    margin: "1%",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIcon: {
    borderWidth: 2,
    borderColor: "#000000",
  },
  selectedIconStyle: {
    transform: [{ scale: 1.2 }],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000000",
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
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonConfirm: {
    backgroundColor: "#008B45",
  },
  textStyle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
});
