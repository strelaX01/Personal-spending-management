import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import CategoryAmountInput from "../Components/CategoryAmountInput";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingModal from "../Components/LoadingModal";

const PlanScreen = () => {
  const [activeTab, setActiveTab] = useState("Expense");
  const [tabAnimation] = useState(new Animated.Value(0));
  const [expenseData, setExpenseData] = useState(null);
  const [incomeData, setIncomeData] = useState(null);
  const [amounts, setAmounts] = useState({});
  const [token, setToken] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedInputIndex, setFocusedInputIndex] = useState(-1);

  const expenseListRef = useRef(null);
  const incomeListRef = useRef(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardVisible(true);
        setKeyboardHeight(keyboardHeight);

        setTimeout(() => {
          if (focusedInputIndex >= 0) {
            if (activeTab === "Expense" && expenseListRef.current) {
              expenseListRef.current.scrollToIndex({
                index: focusedInputIndex,
                animated: true,
                viewPosition: 0.3, 
              });
            } else if (activeTab === "Income" && incomeListRef.current) {
              incomeListRef.current.scrollToIndex({
                index: focusedInputIndex,
                animated: true,
                viewPosition: 0.3,
              });
            }
          }
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        setFocusedInputIndex(-1);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [focusedInputIndex, activeTab]);

  useEffect(() => {
    if (token) {
      fetchData(activeTab);
    }
  }, [token, activeTab]);

  useEffect(() => {
    getToken();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        fetchData(activeTab);
      }
    }, [token, activeTab])
  );

  const getCurrentMonthYear = useCallback(() => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${year}`;
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

  const fetchData = async (type) => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const typeLower = type.toLowerCase();

      const categoryResponse = await axios.get(
        `http://10.0.2.2:3000/api/finance/${typeLower}/categories`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const planResponse = await axios.get(
        `http://10.0.2.2:3000/api/finance/plan/${typeLower}?month=${month}&year=${year}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (type === "Expense") {
        setExpenseData(categoryResponse.data.data || []);
      } else {
        setIncomeData(categoryResponse.data.data || []);
      }

      if (planResponse.data && planResponse.data.data) {
        const rawPlan = planResponse.data.data;

        const planArray = Array.isArray(rawPlan) ? rawPlan : [rawPlan];

        const initialAmounts = planArray.reduce((acc, item) => {
          acc[item.category_id] = parseFloat(item.amount) || 0;
          return acc;
        }, {});

        setAmounts(initialAmounts);
      }
    } catch (error) {
      console.error(`❌ Error fetching ${type.toLowerCase()} data:`, error);
    }
  };

  useEffect(() => {
    if (expenseData) {
      const initialAmounts = expenseData.reduce((acc, item) => {
        if (item.category_id) {
          acc[item.category_id] = amounts[item.category_id] || 0;
        }
        return acc;
      }, {});
      setAmounts(initialAmounts);
    }
  }, [expenseData]);

  useEffect(() => {
    if (incomeData) {
      const initialAmounts = incomeData.reduce((acc, item) => {
        if (item.category_id) {
          acc[item.category_id] = amounts[item.category_id] || 0;
        }
        return acc;
      }, {});
      setAmounts(initialAmounts);
    }
  }, [incomeData]);

  const calculateSpending = useCallback(() => {
    const totalSpending = Object.values(amounts).reduce(
      (total, amount) => total + parseFloat(amount || 0),
      0
    );

    const daysInMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    ).getDate();
    const averageSpending = totalSpending / daysInMonth;

    return { totalSpending, averageSpending };
  }, [amounts]);

  const spendingValues = useMemo(
    () => calculateSpending(),
    [calculateSpending]
  );

  const handleAmountChange = useCallback((amount, categoryId) => {
    const numericValue = amount.replace(/[^0-9]/g, "");
    setAmounts((prevAmounts) => ({
      ...prevAmounts,
      [categoryId]: Number(numericValue) || 0,
    }));
  }, []);

  const handleSavePlan = async (type) => {
    Keyboard.dismiss();
    setIsSaving(true);

    const plan = Object.keys(amounts).map((categoryId) => ({
      category_id: categoryId,
      amount: amounts[categoryId] || 0,
    }));

    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const typeLower = type.toLowerCase();

      // 🧠 Gán kết quả vào biến response
      const response = await axios.post(
        `http://10.0.2.2:3000/api/finance/plan/${typeLower}`,
        {
          month,
          year,
          items: plan,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setModalMessage(`Kế hoạch ${typeLower} đã được lưu thành công!`);
        setModalVisible(true);

        await fetchData(type);
      } else {
        setModalMessage(`Đã có lỗi xảy ra khi lưu kế hoạch ${typeLower}!`);
        setModalVisible(true);
      }
    } catch (error) {
      console.error(`❌ Error saving ${type.toLowerCase()} plan:`, error);
      setModalMessage("Đã có lỗi xảy ra, vui lòng thử lại sau!");
      setModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTabPress = (tab) => {
    if (tab === activeTab) return;
    Keyboard.dismiss();
    setActiveTab(tab);

    Animated.timing(tabAnimation, {
      toValue: tab === "Expense" ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleInputFocus = useCallback((index) => {
    setFocusedInputIndex(index);
  }, []);

  const handleScrollToIndexFailed = (info) => {
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      if (activeTab === "Expense" && expenseListRef.current) {
        expenseListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
        });
      } else if (activeTab === "Income" && incomeListRef.current) {
        incomeListRef.current.scrollToIndex({
          index: info.index,
          animated: true,
        });
      }
    });
  };

  const animatedTabStyle = {
    transform: [
      {
        scaleX: tabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
      {
        scaleY: tabAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      },
    ],
  };

  const renderExpenseContent = () => (
    <>
      <View style={styles.informationContainer}>
        <View style={styles.informationItem}>
          <Text style={styles.spendingLimitText}>Giới hạn chi tiêu</Text>
          <Text
            style={styles.spendingLimitNumber}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {spendingValues.totalSpending.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </Text>
        </View>

        <View style={styles.informationItem}>
          <Text style={styles.averageText}>Trung bình chi/ngày</Text>
          <Text
            style={styles.averageNumber}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {spendingValues.averageSpending.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </Text>
        </View>
      </View>

      <View style={styles.categoryTitleContainer}>
        <Text style={styles.categoryTitle}>Danh mục</Text>
        <TouchableOpacity onPress={() => handleSavePlan("Expense")}>
          <Text style={styles.saveSettings}>Lưu</Text>
        </TouchableOpacity>
      </View>

      {expenseData && expenseData.length > 0 ? (
        <Animated.FlatList
          style={styles.setCategoryContainer}
          data={expenseData}
          keyExtractor={(item) =>
            item.category_id
              ? item.category_id.toString()
              : Math.random().toString()
          }
          renderItem={({ item, index }) => (
            <View style={styles.setMoneyItem}>
              <View style={styles.dataTitle}>
                <Ionicons
                  name={item.category_icon}
                  size={30}
                  color={item.category_color}
                />
                <Text style={styles.categoryName}>{item.category_name}</Text>
              </View>
              <CategoryAmountInput
                categoryId={item.category_id}
                value={String(amounts[item.category_id] || 0)}
                onChange={handleAmountChange}
                onFocus={() => handleInputFocus(index)}
              />
            </View>
          )}
          ref={expenseListRef}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          contentContainerStyle={
            keyboardVisible ? { paddingBottom: keyboardHeight * 0.3 } : {}
          }
        />
      ) : (
        <Text style={styles.noDataText}>Không có dữ liệu</Text>
      )}
    </>
  );

  const renderIncomeContent = () => (
    <>
      <View style={styles.informationContainer}>
        <View style={styles.informationItem}>
          <Text style={styles.spendingLimitText}>Mục tiêu thu nhập</Text>
          <Text
            style={styles.incomeGoalNumber}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {spendingValues.totalSpending.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </Text>
        </View>

        <View style={styles.informationItem}>
          <Text style={styles.averageText}>Trung bình thu/ngày</Text>
          <Text
            style={styles.averageNumber}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {spendingValues.averageSpending.toLocaleString("vi-VN", {
              style: "currency",
              currency: "VND",
            })}
          </Text>
        </View>
      </View>

      <View style={styles.categoryTitleContainer}>
        <Text style={styles.categoryTitle}>Danh mục</Text>
        <TouchableOpacity onPress={() => handleSavePlan("Income")}>
          <Text style={styles.saveSettings}>Lưu</Text>
        </TouchableOpacity>
      </View>

      {incomeData && incomeData.length > 0 ? (
        <Animated.FlatList
          style={styles.setCategoryContainer}
          data={incomeData}
          keyExtractor={(item) =>
            item.category_id
              ? item.category_id.toString()
              : Math.random().toString()
          }
          renderItem={({ item, index }) => (
            <View style={styles.setMoneyItem}>
              <View style={styles.dataTitle}>
                <Ionicons
                  name={item.category_icon}
                  size={30}
                  color={item.category_color}
                />
                <Text style={styles.categoryName}>{item.category_name}</Text>
              </View>
              <CategoryAmountInput
                categoryId={item.category_id}
                value={String(amounts[item.category_id] || 0)}
                onChange={handleAmountChange}
                onFocus={() => handleInputFocus(index)}
              />
            </View>
          )}
          ref={incomeListRef}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          contentContainerStyle={
            keyboardVisible ? { paddingBottom: keyboardHeight * 0.3 } : {}
          }
        />
      ) : (
        <Text style={styles.noDataText}>Không có dữ liệu</Text>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      enabled={true}
    >
      <LoadingModal
        isVisible={isSaving}
        onClose={() => setIsSaving(false)}
        message="Đang lưu..."
      />
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

      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Kế hoạch</Text>
        <Text style={styles.headerDate}>({getCurrentMonthYear()})</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "Expense" && styles.activeTab,
          ]}
          onPress={() => handleTabPress("Expense")}
        >
          <Animated.View
            style={[
              styles.tabButtonContent,
              activeTab === "Expense" && styles.activeTabText,
              animatedTabStyle,
            ]}
          >
            <Text style={styles.tabText}>Chi tiêu</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Income" && styles.activeTab]}
          onPress={() => handleTabPress("Income")}
        >
          <Animated.View
            style={[
              styles.tabButtonContent,
              activeTab === "Income" && styles.activeTabText,
              animatedTabStyle,
            ]}
          >
            <Text style={styles.tabText}>Thu nhập</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.mainContainer,
          keyboardVisible && Platform.OS === "android"
            ? { paddingBottom: 0 }
            : {},
        ]}
      >
        <View style={styles.contentView}>
          {activeTab === "Expense"
            ? renderExpenseContent()
            : renderIncomeContent()}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default PlanScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center", // Adjusted for better alignment
    padding: 15,
    marginTop: 25,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerText: {
    color: "#000000", // Changed to dark text
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 5,
  },
  headerDate: {
    color: "#000000", // Changed to dark text
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 10,
    marginBottom: 10,
    width: "70%",
    justifyContent: "space-between",
    backgroundColor: "#CCCCCC", // Changed to light background
    padding: 5,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    alignSelf: "center",
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: "#008B45",
    elevation: 2,
    shadowColor: "#00FF88",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  tabButtonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 14,
    color: "#FFFFFF", // Changed to dark text
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF", // Changed to light text
    fontWeight: "bold",
  },
  mainContainer: {
    flex: 1,
    paddingBottom: 10, // Added padding for better spacing
  },
  keyboardActiveContainer: {
    paddingBottom: Platform.OS === "android" ? 120 : 0,
  },
  contentView: {
    flex: 1,
    padding: 15,
  },
  informationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  informationItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#E0E0E0", // Changed to light background
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 10,
  },
  spendingLimitText: {
    color: "#000000", // Changed to dark text
    fontSize: 16,
  },
  spendingLimitNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#BB0000",
  },
  incomeGoalNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#008B45",
  },
  averageText: {
    color: "#000000", // Changed to dark text
    fontSize: 16,
  },
  averageNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#008B45",
  },
  categoryTitleContainer: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryTitle: {
    color: "#000000", // Changed to dark text
    fontSize: 18,
    fontWeight: "bold",
  },
  saveSettings: {
    color: "#008B45",
    fontSize: 16,
    fontWeight: "bold",
  },
  setCategoryContainer: {
    flex: 1,
    paddingBottom: 20, // Added padding to avoid overlap with keyboard
  },
  setMoneyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#CCCCCC", // Changed to light background
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  dataTitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryName: {
    color: "#000000", // Changed to dark text
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  noDataText: {
    fontSize: 16,
    color: "#000000", // Changed to dark text
    textAlign: "center",
    marginTop: 20,
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
  button: {
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
