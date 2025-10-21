import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Ionicons,
  Fontisto,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingModal from "../Components/LoadingModal";
import ErrorModal from "../Components/ErrorModal";

const AddScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState("Income");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [token, setToken] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      await getToken();
      if (!token) return;
      if (selectedType === "Income") {
        const categories = await fetchIncomeCategories();
        setIncomeCategories(categories);
      } else {
        const categories = await fetchExpenseCategories();
        setExpenseCategories(categories);
      }
    };

    fetchData();
  }, [selectedType]);

  useEffect(() => {
    const fetchData = async () => {
      await getToken();
      if (!token) return;
      if (selectedType === "Income") {
        const categories = await fetchIncomeCategories();
        setIncomeCategories(categories);
      } else {
        const categories = await fetchExpenseCategories();
        setExpenseCategories(categories);
      }
    };

    fetchData();
  }, []);

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

  const fetchCategories = async (type) => {
    try {
      const typeLower = type.toLowerCase();

      const response = await axios.get(
        `http://10.0.2.2:3000/api/finance/${typeLower}/categories`,
        { headers: { Authorization: `Bearer ${token}` } } 
      );

      return response.data.data;
    } catch (error) {
      console.error(`Error fetching ${type} categories:`, error);
      Alert.alert("Error", `Failed to fetch ${type} categories`);
      return [];
    }
  };

  const fetchIncomeCategories = async () => fetchCategories("Income");
  const fetchExpenseCategories = async () => fetchCategories("Expense");

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        await getToken();
        if (!token) return;
        if (selectedType === "Income") {
          const categories = await fetchIncomeCategories();
          setIncomeCategories(categories);
        } else {
          const categories = await fetchExpenseCategories();
          setExpenseCategories(categories);
        }
      };

      fetchData();
      setSelectedDate(new Date());
      resetForm();
    }, [selectedType])
  );

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        await getToken();
        if (!token) return;
        if (selectedType === "Income") {
          const categories = await fetchIncomeCategories();
          setIncomeCategories(categories);
        } else {
          const categories = await fetchExpenseCategories();
          setExpenseCategories(categories);
        }
      };

      fetchData();
      resetForm();
    }, [selectedType, token])
  );

  const openModal = () => {
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const selectType = (type) => {
    setSelectedType(type);
    closeModal();
  };

  const handleIncomeCategory = () => {
    navigation.navigate("CategoryTabView", { initialIndex: 0 });
  };

  const handleExpenseCategory = () => {
    navigation.navigate("CategoryTabView", { initialIndex: 1 });
  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const toggleBackDatePicker = () => {
    setSelectedDate(new Date(selectedDate.getTime() - 86400000));
  };

  const toggleForwardDatePicker = () => {
    setSelectedDate(new Date(selectedDate.getTime() + 86400000));
  };

  const formatCurrency = (value) => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleAmountChange = (value) => {
    const val = value || ""; 
    const numericValue = val.replace(/[^0-9]/g, "");
    setAmount(formatCurrency(numericValue));
  };

  const addIncome = async () => {
    setIsSaving(true);

    try {
      const newIncome = {
        amount: parseFloat(amount.replace(/\./g, "") || "0"),
        categoryId: selectedCategory,
        date: selectedDate,
        description: description || "",
      };

      const response = await axios.post(
        "http://10.0.2.2:3000/api/finance/income",
        newIncome,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (data.requireConfirmation) {
        setLimitMessage(data.message);
        setLimitModalVisible(true);
        return;
      }

      if (response.status === 201) {
        setErrorModalMessage("✅ Thu nhập đã được thêm thành công!");
        setErrorModal(true);
        resetForm();
      } else {
        setErrorModalMessage("Lỗi khi thêm thu nhập!");
        setErrorModal(true);
      }
    } catch (error) {
      const backendError = error.response?.data;

      if (backendError && backendError.details) {
        const friendlyErrors = backendError.details.map((msg) => {
          if (msg.includes("danh mục")) return "Vui lòng chọn danh mục hợp lệ.";
          if (msg.includes("số tiền")) return "Số tiền phải lớn hơn 0.";
          if (msg.includes("ngày")) return "Ngày không hợp lệ.";
          return msg; 
        });

        setErrorModalMessage(`${friendlyErrors.join("\n")}`);
      } else {
        setErrorModalMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      }

      setErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmIncome = async () => {
    setIsSaving(true);

    try {
      const newIncome = {
        amount: parseFloat(amount.replace(/\./g, "")),
        categoryId: selectedCategory,
        date: selectedDate.toISOString(),
        description: description,
        token: token,
      };

      const response = await axios.post(
        `http://10.0.2.2:3000/api/finance/confirmIncome`,
        newIncome
      );

      if (response.status === 201) {
        setConfirmationMessage(
          "Thu nhập đã được thêm thành công sau khi xác nhận!"
        );
        setConfirmationModalVisible(true);
        resetForm();
      }
    } catch (error) {
      if (error.response) {
        setErrorModalMessage(error.response.data.message);
        setErrorModal(true);
      } else {
        setErrorModalMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
        setErrorModal(true);
      }
    } finally {
      setIsSaving(false);
      setLimitModalVisible(false);
    }
  };

  const addExpense = async () => {
    setIsSaving(true);

    try {
      const formattedDate = new Date(selectedDate).toISOString().slice(0, 10);
      const newExpense = {
        amount: parseFloat(amount.replace(/\./g, "") || "0"),
        categoryId: selectedCategory,
        date: formattedDate,
        description: description || "",
      };

      const response = await axios.post(
        "http://10.0.2.2:3000/api/finance/expense",
        newExpense,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;

      if (data.requireConfirmation) {
        setLimitMessage(data.message);
        setLimitModalVisible(true);
        return;
      }

      if (data.success) {
        setErrorModalMessage("✅ Chi tiêu đã được thêm thành công!");
        setErrorModal(true);
        resetForm();
      } else {
        setErrorModalMessage("⚠️ Lỗi khi thêm chi tiêu!");
        setErrorModal(true);
      }
    } catch (error) {
      const backendError = error.response?.data;

      if (backendError && backendError.details) {
        const friendlyErrors = backendError.details.map((msg) => {
          if (msg.includes("danh mục")) return "Vui lòng chọn danh mục hợp lệ.";
          if (msg.includes("số tiền")) return "Số tiền phải lớn hơn 0.";
          if (msg.includes("ngày")) return "Ngày không hợp lệ.";
          return msg;
        });

        setErrorModalMessage(`${friendlyErrors.join("\n")}`);
      } else {
        setErrorModalMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
      }

      setErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmExpense = async () => {
    setIsSaving(true);

    try {
      const newExpense = {
        amount: parseFloat(amount.replace(/\./g, "")),
        categoryId: selectedCategory,
        date: selectedDate.toISOString(),
        description: description,
        token: token,
      };

      const response = await axios.post(
        `http://10.0.2.2:3000/api/finance/confirmExpense`,
        newExpense
      );

      if (response.status === 201) {
        setConfirmationMessage(
          "Chi tiêu đã được thêm thành công sau khi xác nhận!"
        );
        setConfirmationModalVisible(true);
        resetForm();
      }
    } catch (error) {
      if (error.response) {
        setErrorModalMessage(error.response.data.message);
        setErrorModal(true);
      } else {
        setErrorModalMessage("Đã xảy ra lỗi. Vui lòng thử lại.");
        setErrorModal(true);
      }
    } finally {
      setIsSaving(false);
      setLimitModalVisible(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setSelectedCategory(null);
    setSelectedDate(new Date());
    setDescription("");
  };

  const fetchExpenseData = useCallback(
    async (date) => {
      await waitForToken();
      if (!token) {
        setExpenseData([]);
        return;
      }

      try {
        const monthYear = `${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${date.getFullYear()}`;
        const response = await fetch(
          `http://10.0.2.2:3000/getExpense?token=${token}&monthYear=${monthYear}`
        );
        const data = await response.json();
        setExpenseData(data.expenses || []);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch data");
        setExpenseData([]);
      }
    },
    [token]
  );

  const fetchIncomeData = useCallback(
    async (date) => {
      await waitForToken();
      if (!token) {
        setIncomeData([]);
        return;
      }

      try {
        const monthYear = `${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${date.getFullYear()}`;
        const response = await fetch(
          `http://10.0.2.2:3000/getIncome?token=${token}&monthYear=${monthYear}`
        );
        const data = await response.json();
        setIncomeData(data.incomes || []);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch data");
        setIncomeData([]);
      }
    },
    [token]
  );

  const waitForToken = async () => {
    while (!token) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  return (
    <View style={styles.container}>
      <LoadingModal
        isVisible={isSaving}
        onClose={() => setIsSaving(false)}
        message="Đang lưu..."
      />
      <TouchableOpacity style={styles.changeAddButton} onPress={openModal}>
        <Text style={styles.buttonText}>
          {selectedType === "Income" ? "Thu nhập" : "Chi tiêu"}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={24}
          color="white"
          style={styles.icon}
        />
      </TouchableOpacity>

      {modalVisible && (
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.dropdown,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedType === "Income" && styles.selectedOption,
                ]}
                onPress={() => selectType("Income")}
              >
                <Text style={styles.optionText}>Thu nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedType === "Expense" && styles.selectedOption,
                ]}
                onPress={() => selectType("Expense")}
              >
                <Text style={styles.optionText}>Chi tiêu</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}

      <View style={styles.dataContainer}>
        {selectedType === "Income" && (
          <View style={styles.incomeContainer}>
            <View style={styles.incomeInputView}>
              <FontAwesome name="money" size={30} color="#008B45" />
              <TextInput
                style={styles.incomeInput}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#888"
                value={amount}
                onChangeText={handleAmountChange}
              />
            </View>

            <View style={styles.categoryContainer}>
              <View style={styles.catgegorSettings}>
                <Text style={styles.categoryText}>Danh mục</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={handleIncomeCategory}
                >
                  <MaterialIcons name="settings" size={30} color="#008B45" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.incomeListCategory}>
              {incomeCategories && incomeCategories.length > 0 ? (
                <FlatList
                  data={incomeCategories}
                  keyExtractor={(item) => item.category_id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      key={item.category_id}
                      style={[
                        styles.categoryButtonList,
                        selectedCategory === item.category_id && {
                          borderColor: "#008B45",
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedCategory(item.category_id)}
                    >
                      <Ionicons
                        name={item.category_icon}
                        size={30}
                        color={item.category_color}
                      />
                      <Text style={styles.categoryName}>
                        {item.category_name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  numColumns={4}
                  contentContainerStyle={styles.flatListContainer}
                  style={styles.flatList}
                />
              ) : (
                <Text style={styles.noDataText}>Không có dữ liệu</Text>
              )}
            </View>

            <View style={styles.noteBookContainer}>
              <MaterialCommunityIcons
                style={styles.noteBookIcon}
                name="notebook-minus-outline"
                size={30}
                color="black"
              />
              <TextInput
                style={styles.noteInput}
                placeholder="Nhập mô tả"
                placeholderTextColor="#888"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.datePickerContainer}>
              <Fontisto name="date" size={24} color="#008B45" />
              <TouchableOpacity onPress={toggleBackDatePicker}>
                <MaterialCommunityIcons
                  style={styles.backDateIcon}
                  name="calendar-arrow-left"
                  size={30}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleDatePicker}
                style={styles.dateDisplay}
              >
                <Text style={styles.dateText}>
                  {selectedDate.toLocaleDateString("en-GB")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleForwardDatePicker}>
                <MaterialCommunityIcons
                  style={styles.forwardDateIcon}
                  name="calendar-arrow-right"
                  size={30}
                />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                  setShowDatePicker(false);
                }}
                style={styles.dateTimePicker}
              />
            )}

            <View style={styles.addButtonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={addIncome}>
                <Text style={styles.buttonAddText}>Thêm thu nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedType === "Expense" && (
          <View style={styles.incomeContainer}>
            <View style={styles.incomeInputView}>
              <FontAwesome name="money" size={30} color="#008B45" />
              <TextInput
                style={styles.incomeInput}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#888"
                value={amount}
                onChangeText={handleAmountChange}
              />
            </View>

            <View style={styles.categoryContainer}>
              <View style={styles.catgegorSettings}>
                <Text style={styles.categoryText}>Danh mục</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={handleExpenseCategory}
                >
                  <MaterialIcons name="settings" size={30} color="#008B45" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.incomeListCategory}>
              {expenseCategories && expenseCategories.length > 0 ? (
                <FlatList
                  data={expenseCategories}
                  keyExtractor={(item) => item.category_id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      key={item.category_id}
                      style={[
                        styles.categoryButtonList,
                        selectedCategory === item.category_id && {
                          borderColor: "#008B45",
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedCategory(item.category_id)}
                    >
                      <Ionicons
                        name={item.category_icon}
                        size={30}
                        color={item.category_color}
                      />
                      <Text style={styles.categoryName}>
                        {item.category_name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  numColumns={4}
                  contentContainerStyle={styles.flatListContainer}
                  style={styles.flatList}
                />
              ) : (
                <Text style={styles.noDataText}>Không có dữ liệu</Text>
              )}
            </View>

            <View style={styles.noteBookContainer}>
              <MaterialCommunityIcons
                style={styles.noteBookIcon}
                name="notebook-minus-outline"
                size={30}
              />
              <TextInput
                style={styles.noteInput}
                placeholder="Nhập mô tả"
                placeholderTextColor="#888"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.datePickerContainer}>
              <Fontisto name="date" size={24} color="#008B45" />
              <TouchableOpacity onPress={toggleBackDatePicker}>
                <MaterialCommunityIcons
                  style={styles.backDateIcon}
                  name="calendar-arrow-left"
                  size={30}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={toggleDatePicker}
                style={styles.dateDisplay}
              >
                <Text style={styles.dateText}>
                  {selectedDate.toLocaleDateString("en-GB")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleForwardDatePicker}>
                <MaterialCommunityIcons
                  style={styles.forwardDateIcon}
                  name="calendar-arrow-right"
                  size={30}
                />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  if (date) {
                    setSelectedDate(date);
                  }
                  setShowDatePicker(false);
                }}
                style={styles.dateTimePicker}
              />
            )}

            <View style={styles.addButtonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={addExpense}>
                <Text style={styles.buttonAddText}>Thêm chi tiêu</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={limitModalVisible}
        onRequestClose={() => {
          setLimitModalVisible(!limitModalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{limitMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setLimitModalVisible(!limitModalVisible)}
              >
                <Text style={styles.textStyle}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonConfirm]}
                onPress={
                  selectedType === "Income" ? confirmIncome : confirmExpense
                }
              >
                <Text style={styles.textStyle}>Tiếp tục</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={() => {
          setConfirmationModalVisible(!confirmationModalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{confirmationMessage}</Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonConfirm]}
              onPress={() =>
                setConfirmationModalVisible(!confirmationModalVisible)
              }
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

export default AddScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Changed to light background
  },
  changeAddButton: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#008B45",
    width: 200,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 30,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  icon: {
    position: "absolute",
    right: 15,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 100,
  },

  dropdown: {
    marginTop: 110,
    width: "50%",
    backgroundColor: "#E0E0E0", // Changed to light background
    borderRadius: 10,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC", // Changed to light border
  },

  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  optionText: {
    color: "#000000", // Changed to dark text
    fontSize: 16,
  },
  selectedOption: {
    backgroundColor: "#008B45",
  },
  dataContainer: {
    marginTop: 120,
    paddingHorizontal: 20,
  },
  incomeContainer: {
    flexDirection: "1",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  incomeInputView: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginTop: 5,
  },
  incomeInput: {
    color: "#000000", // Changed to dark text
    padding: 15,
    fontSize: 16,
    width: "90%",
    backgroundColor: "#DDDDDD", // Changed to light background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC", // Changed to light border
    marginLeft: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  catgegorSettings: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  categoryText: {
    color: "#000000", // Changed to dark text
    fontSize: 16,
    marginRight: 10,
    fontWeight: "bold",
  },
  incomeListCategory: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
    height: 220,
    paddingHorizontal: 5,
  },
  categoryButtonList: {
    width: "22%",
    backgroundColor: "#E0E0E0", // Changed to light background
    padding: 10,
    borderRadius: 10,
    margin: 5,
    alignItems: "center",
  },
  flatList: {
    maxHeight: 220,
  },

  flatListContainer: {
    justifyContent: "center",
    width: "100%",
    paddingBottom: 20,
  },
  categoryName: {
    color: "#000000", // Changed to dark text
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    fontWeight: "bold",
  },
  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    width: "100%",
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 10,
    padding: 5,
    width: "50%",
    justifyContent: "center",
  },
  backDateIcon: {
    color: "#000000", // Changed to dark icon
  },
  forwardDateIcon: {
    color: "#000000", // Changed to dark icon
  },
  dateText: {
    color: "#000000", // Changed to dark text
    fontSize: 16,
  },
  dateTimePicker: {
    backgroundColor: "#F0F0F0", // Changed to light background
    borderRadius: 10,
    padding: 10,
    width: "90%",
    alignSelf: "center",
  },
  noteBookContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  noteBookIcon: {
    color: "#008B45",
  },
  noteInput: {
    color: "#000000", // Changed to dark text
    padding: 15,
    fontSize: 16,
    width: "90%",
    backgroundColor: "#DDDDDD", // Changed to light background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CCCCCC", // Changed to light border
    marginLeft: 10,
  },

  addButtonContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#008B45",
    padding: 15,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
  },
  buttonAddText: {
    color: "#FFFFFF",
    fontSize: 16,
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
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    color: "#000000", // Changed to dark text
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonCancel: {
    backgroundColor: "#2196F3",
  },
  buttonConfirm: {
    backgroundColor: "#008B45",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#000000", // Changed to dark text
    textAlign: "center",
    marginTop: 20,
  },
});
