import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  FlatList,
  Modal,
  ActivityIndicator,
  LayoutAnimation,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { PieChart } from "react-native-gifted-charts";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Swipeable from "react-native-gesture-handler/Swipeable";

const TabButton = React.memo(({ label, isActive, onPress, animatedStyle }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.activeTab]}
    onPress={onPress}
  >
    <Animated.View
      style={[
        styles.tabButtonContent,
        isActive && styles.activeTabText,
        animatedStyle,
      ]}
    >
      <Text style={styles.tabText}>{label}</Text>
    </Animated.View>
  </TouchableOpacity>
));

const PieChartView = React.memo(({ data }) => (
  <PieChart
    data={data}
    innerCircleColor="#FFFFFF"
    innerCircleBorderWidth={2}
    radius={70}
    showText
    textColor="white"
    textSize={13}
    donut={true}
  />
));

const ExpenseListItem = React.memo(
  ({ item, isIncome, onEdit, onDelete, onSwipeableOpen }) => {
    const swipeableRef = useRef(null);

    const renderRightActions = (progress, dragX) => {
      const trans = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [0, 100],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[
            styles.actionContainer,
            { transform: [{ translateX: trans }] },
          ]}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              onEdit(item);
              swipeableRef.current?.close();
            }}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.actionText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              onDelete(item);
              swipeableRef.current?.close();
            }}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.actionText}>Xóa</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    return (
      <Swipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={50}
        renderRightActions={renderRightActions}
        onSwipeableOpen={() => onSwipeableOpen(item.id, swipeableRef)}
        overshootRight={false}
      >
        <TouchableOpacity style={styles.expenseListItem}>
          <Ionicons
            name={item.category_icon}
            size={30}
            color={item.category_color}
            style={styles.icon}
          />
          <View style={styles.expenseListItemLeft}>
            <Text style={styles.expenseCategory}>{item.category_name}</Text>
            <Text style={styles.descriptionText}>
              ({item.description || "không có ghi chú"})
            </Text>
          </View>
          <View style={styles.expenseListItemRight}>
            <Text style={isIncome ? styles.incomeAmount : styles.expenseAmount}>
              {isIncome ? "+" : "-"}
              {item.amount.toLocaleString("vi-VN").replace(/,/g, ".")}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  }
);

const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState("Expense");
  const [tabAnimation] = useState(new Animated.Value(0));
  const [expensePlanData, setExpensePlanData] = useState(null);
  const [incomePlanData, setIncomePlanData] = useState(null);
  const [amountsplan, setAmountsPlan] = useState({});
  const [token, setToken] = useState(null);
  const [totalPlanAmount, setTotalPlanAmount] = useState(0);
  const [expenseData, setExpenseData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [displayedDates, setDisplayedDates] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 10;
  const navigation = useNavigation();
  const openSwipeableRef = useRef(null);
  const [openItemId, setOpenItemId] = useState(null);
  const swipeableRefs = useRef(new Map());
  const [displayedTotalAmount, setDisplayedTotalAmount] = useState(0);

  const getCurrentMonthYear = useCallback(() => {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${year}`;
  }, []);

  const getToken = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem("token");
      if (value) {
        setToken(value);
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
  }, []);

  const fetchData = useCallback(
    async (type) => {
      if (!token) return;
      const typeLower = type.toLowerCase();
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      try {

        const planResponse = await axios.get(
          `http://10.0.2.2:3000/api/finance/plan/${typeLower}?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const planData = planResponse.data?.data || [];

        if (planData.length > 0) {
          const initialAmounts = planData.reduce((acc, item) => {
            const amountNumber = Number(item.amount);
            acc[item.category_id] = amountNumber; 
            return acc;
          }, {});


          if (typeLower === "expense") {
            setAmountsPlan(initialAmounts);
            setExpensePlanData(planData);
          } else {
            setIncomePlanData(planData);
          }
        }


        const dataResponse = await axios.get(
          `http://10.0.2.2:3000/api/finance/${typeLower}?month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const fetchedData = (dataResponse.data?.data || []).map((item) => ({
          ...item,
          amount: Number(item.amount),
        }));

        if (fetchedData.length > 0) {
          if (typeLower === "expense") setExpenseData(fetchedData);
          else setIncomeData(fetchedData);
        }
      } catch (error) {
        console.error(`Error fetching ${type.toLowerCase()} data:`, error);
      }
    },
    [token]
  );

  const fetchTotalAmount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(
        "http://10.0.2.2:3000/api/finance/getTotalAmount",
        {
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: () => true,
        }
      );
      const total = response.data?.data?.totalAmount ?? 0;

      setTotalAmount(total);
      setDisplayedTotalAmount(total);
    } catch (error) {
      setTotalAmount(0);
      setDisplayedTotalAmount(0);
    }
  }, [token]);

  useEffect(() => {
    getToken();
  }, [getToken]);


  useEffect(() => {
    if (token) {
      fetchData("Expense");
      fetchData("Income");
      fetchTotalAmount();
    }
  }, [token, fetchData, fetchTotalAmount]);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      fetchData(activeTab);
      fetchTotalAmount();
    }, [token, fetchData, fetchTotalAmount, activeTab])
  );

  const totalPlanAmountMemo = useMemo(() => {
    if (activeTab === "Expense" && expensePlanData) {
      return expensePlanData.reduce((acc, item) => acc + item.amount, 0);
    } else if (activeTab === "Income" && incomePlanData) {
      return incomePlanData.reduce((acc, item) => acc + item.amount, 0);
    }
    return 0;
  }, [activeTab, expensePlanData, incomePlanData]);

  useEffect(() => {
    setTotalPlanAmount(totalPlanAmountMemo);
  }, [totalPlanAmountMemo]);

  useEffect(() => {
    setDisplayedTotalAmount(totalAmount);
  }, [totalAmount]);

  const pieExpenseData = useMemo(() => {
    const totalSpent = expenseData.reduce(
      (acc, item) => acc + Number(item.amount || 0),
      0
    );
    const spentColor = totalSpent < totalPlanAmount ? "#008B45" : "#FF4444";
    const remainingColor = totalSpent > totalPlanAmount ? "#FFFFFF" : "#EEB422";

    if (totalPlanAmount === 0 || isNaN(totalPlanAmount)) {
      return [{ value: 100, color: spentColor, text: "100%" }];
    }
    if (totalSpent > totalPlanAmount) {
      return [{ value: 100, color: spentColor, text: "100%" }];
    }

    const remaining = totalPlanAmount - totalSpent;
    const spentPercentage = (totalSpent / totalPlanAmount) * 100;
    const remainingPercentage = 100 - spentPercentage;

    return [
      {
        value: spentPercentage,
        color: spentColor,
        text: `${spentPercentage.toFixed(2)}%`,
      },
      {
        value: remainingPercentage,
        color: remainingColor,
        text: `${remainingPercentage.toFixed(2)}%`,
      },
    ];
  }, [expenseData, totalPlanAmount]);

  const pieIncomeData = useMemo(() => {
    const totalReceived = incomeData.reduce(
      (acc, item) => acc + Number(item.amount || 0),
      0
    );
    const receivedColor =
      totalReceived < totalPlanAmount ? "#FF4444" : "#008B45";
    const remainingColor =
      totalReceived > totalPlanAmount ? "#FFFFFF" : "#EEB422";

    if (totalPlanAmount === 0 || isNaN(totalPlanAmount)) {
      return [{ value: 100, color: receivedColor, text: "100%" }];
    }
    if (totalReceived > totalPlanAmount) {
      return [{ value: 100, color: receivedColor, text: "100%" }];
    }

    const remaining = totalPlanAmount - totalReceived;
    const receivedPercentage = (totalReceived / totalPlanAmount) * 100;
    const remainingPercentage = 100 - receivedPercentage;

    return [
      {
        value: receivedPercentage,
        color: receivedColor,
        text: `${receivedPercentage.toFixed(2)}%`,
      },
      {
        value: remainingPercentage,
        color: remainingColor,
        text: `${remainingPercentage.toFixed(2)}%`,
      },
    ];
  }, [incomeData, totalPlanAmount]);

  const handleTabPress = useCallback(
    (tab) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveTab(tab);
      setPage(1);
      Animated.timing(tabAnimation, {
        toValue: tab === "Expense" ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    },
    [tabAnimation]
  );

  const animatedTabStyle = useMemo(
    () => ({
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
    }),
    [tabAnimation]
  );

  const parseDate = useCallback((dateStr) => {
    const [year, month, day] = dateStr.split("-");
    return new Date(year, month - 1, day);
  }, []);

  const sortedExpenseData = useMemo(() => {
    const currentDate = new Date();
    return [...expenseData].sort(
      (a, b) =>
        Math.abs(parseDate(a.date) - currentDate) -
        Math.abs(parseDate(b.date) - currentDate)
    );
  }, [expenseData, parseDate]);

  const sortedIncomeData = useMemo(() => {
    const currentDate = new Date();
    return [...incomeData].sort(
      (a, b) =>
        Math.abs(parseDate(a.date) - currentDate) -
        Math.abs(parseDate(b.date) - currentDate)
    );
  }, [incomeData, parseDate]);

  const groupByDate = useCallback(
    (data) =>
      data.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
      }, {}),
    []
  );

  const groupedExpenseData = useMemo(
    () => groupByDate(sortedExpenseData),
    [sortedExpenseData, groupByDate]
  );

  const groupedIncomeData = useMemo(
    () => groupByDate(sortedIncomeData),
    [sortedIncomeData, groupByDate]
  );

  const listData = useMemo(() => {
    const groupedData =
      activeTab === "Expense" ? groupedExpenseData : groupedIncomeData;
    return Object.keys(groupedData)
      .sort((a, b) => parseDate(b) - parseDate(a))
      .map((date) => ({ date, items: groupedData[date] }));
  }, [activeTab, groupedExpenseData, groupedIncomeData, parseDate]);

  const loadMoreData = useCallback(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const newData = listData.slice(0, endIndex);
    setDisplayedDates(newData);
  }, [page, listData, itemsPerPage]);

  useEffect(() => {
    loadMoreData();
  }, [loadMoreData, activeTab]);

  const handleLoadMore = async () => {
    if (displayedDates.length < listData.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setPage((prev) => prev + 1);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsLoadingMore(false);
    }
  };

  const totalExpenseAmount = useMemo(
    () => expenseData.reduce((acc, item) => acc + item.amount, 0),
    [expenseData]
  );

  const totalIncomeAmount = useMemo(
    () => incomeData.reduce((acc, item) => acc + item.amount, 0),
    [incomeData]
  );

  const handleEdit = useCallback(
    (item) => {
      const formattedDate = new Date(item.date);
      const day = String(formattedDate.getDate()).padStart(2, "0");
      const month = String(formattedDate.getMonth() + 1).padStart(2, "0");
      const year = formattedDate.getFullYear();
      const formatted = `${day}/${month}/${year}`;

      const newItem = { ...item, date: formatted };

      const screen = activeTab === "Income" ? "EditIncome" : "EditExpense";
      navigation.navigate(screen, {
        data: newItem,
        onGoBack: async () => {
          if (activeTab === "Income") {
            await fetchTotalAmount();
          }
          fetchData(activeTab);
        },
      });

      if (openItemId === item.id) {
        const ref = swipeableRefs.current.get(item.id);
        ref?.close();
        setOpenItemId(null);
      }
    },
    [activeTab, navigation, openItemId, fetchTotalAmount, fetchData]
  );

  const handleDelete = useCallback(
    (item) => {
      setItemToDelete(item);
      setModalVisible(true);
      if (openItemId === item.id) {
        const ref = swipeableRefs.current.get(item.id);
        ref?.close();
        setOpenItemId(null);
      }
    },
    [openItemId]
  );

  const confirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    const isIncome = activeTab === "Income";
    const itemType = isIncome ? "thu nhập" : "chi tiêu";
    const deleteUrl = `http://10.0.2.2:3000/api/finance/${
      isIncome ? "income" : "expense"
    }/${itemToDelete.id}`;

    try {
      const response = await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        if (isIncome) {
          setIncomeData((prev) =>
            prev.filter((data) => data.id !== itemToDelete.id)
          );
          await fetchTotalAmount();
        } else {
          setExpenseData((prev) =>
            prev.filter((data) => data.id !== itemToDelete.id)
          );
        }

        setAlertMessage(`✅ Đã xóa ${itemType} thành công`);
      } else {
        setAlertMessage(`❌ Đã xảy ra lỗi khi xóa ${itemType}`);
      }
    } catch (error) {
      console.error(
        `❌ Error deleting ${itemType}:`,
        error.response?.data || error.message
      );
      setAlertMessage(`Đã xảy ra lỗi khi xóa ${itemType}`);
    } finally {
      setConfirmationModalVisible(true);
      setModalVisible(false);
      setItemToDelete(null);
    }
  }, [activeTab, itemToDelete, token, fetchTotalAmount]);

  const handleSwipeableOpen = useCallback(
    (itemId, ref) => {
      if (openItemId && openItemId !== itemId) {
        const prevRef = swipeableRefs.current.get(openItemId);
        prevRef?.close();
      }

      setOpenItemId(itemId);
      swipeableRefs.current.set(itemId, ref.current);
    },
    [openItemId]
  );

  const renderDateGroup = ({ item }) => (
    <View style={styles.dateGroupContainer}>
      <Text style={styles.dateGroupHeader}>
        {" "}
        {new Date(item.date).toLocaleDateString("vi-VN")}
      </Text>
      {item.items.map((expense, index) => (
        <ExpenseListItem
          key={index}
          item={expense}
          isIncome={activeTab === "Income"}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSwipeableOpen={handleSwipeableOpen}
        />
      ))}
    </View>
  );

  const renderFooter = () => {
    if (isLoadingMore) return <ActivityIndicator size="small" color="#fff" />;
    if (displayedDates.length === listData.length && listData.length > 0) {
      return <Text style={styles.noMoreDataText}>Hết dữ liệu</Text>;
    }
    return null;
  };

  const formatNumber = (value) => {
    const number = Number(value);
    if (isNaN(number)) return "0";
    return Math.round(number).toLocaleString("vi-VN");
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Text style={styles.totalAmount}>
            {formatNumber(displayedTotalAmount)}
          </Text>
          <Text style={styles.brandText}>PennyRoot</Text>
        </View>
        <Text style={styles.textMonth}>{getCurrentMonthYear()}</Text>
        <View style={styles.tabContainer}>
          <TabButton
            label="Chi tiêu"
            isActive={activeTab === "Expense"}
            onPress={() => handleTabPress("Expense")}
            animatedStyle={animatedTabStyle}
          />
          <TabButton
            label="Thu nhập"
            isActive={activeTab === "Income"}
            onPress={() => handleTabPress("Income")}
            animatedStyle={animatedTabStyle}
          />
        </View>
      </View>

      <View style={styles.mainContainer}>
        {activeTab === "Expense" ? (
          <View style={styles.contentView}>
            <View style={styles.overviewContainer}>
              <View style={styles.leftSide}>
                <Text style={styles.expenseText}>Đã tiêu</Text>
                <Text
                  style={[
                    styles.expenseTotal,
                    {
                      color:
                        totalExpenseAmount >= totalPlanAmount
                          ? "#FF4444"
                          : "#008B45",
                    },
                  ]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {formatNumber(totalExpenseAmount)}
                </Text>
                <Text style={styles.planText}>Kế hoạch</Text>
                <Text
                  style={styles.planNumber}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {formatNumber(totalPlanAmount)}
                </Text>
                <Text
                  style={styles.remainingtext}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {totalPlanAmount - totalExpenseAmount < 0
                    ? "Chi tiêu vượt ngân sách"
                    : "Còn lại"}
                </Text>
                <Text
                  style={[
                    styles.remainingNumber,
                    {
                      color:
                        totalExpenseAmount >= totalPlanAmount
                          ? "#000000"
                          : "#EEB422",
                    },
                  ]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {formatNumber(totalPlanAmount - totalExpenseAmount)}
                </Text>
              </View>
              <View style={styles.rightSide}>
                <PieChartView data={pieExpenseData} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.contentView}>
            <View style={styles.overviewContainer}>
              <View style={styles.leftSide}>
                <Text style={styles.incomeText}>Đã thu</Text>
                <Text
                  style={[
                    styles.incomeTotal,
                    {
                      color:
                        totalIncomeAmount < totalPlanAmount
                          ? "#FF4444"
                          : "#008B45",
                    },
                  ]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {formatNumber(totalIncomeAmount)}
                </Text>
                <Text style={styles.planText}>Kế hoạch</Text>
                <Text
                  style={styles.planNumber}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {formatNumber(totalPlanAmount)}
                </Text>
                <Text
                  style={styles.remainingtext}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {totalIncomeAmount > totalPlanAmount
                    ? "Thu nhập vượt kế hoạch"
                    : "Mục tiêu còn thiếu"}
                </Text>
                <Text
                  style={[
                    styles.totalRevenueNumber,
                    {
                      color:
                        totalIncomeAmount >= totalPlanAmount
                          ? "#000000"
                          : "#EEB422",
                    },
                  ]}
                  adjustsFontSizeToFit
                  numberOfLines={1}
                >
                  {totalIncomeAmount > totalPlanAmount
                    ? `+${formatNumber(totalIncomeAmount - totalPlanAmount)}`
                    : formatNumber(totalPlanAmount - totalIncomeAmount)}
                </Text>
              </View>
              <View style={styles.rightSide}>
                <PieChartView data={pieIncomeData} />
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.datalistContainer}>
        <FlatList
          data={displayedDates}
          renderItem={renderDateGroup}
          keyExtractor={(item) => item.date}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <Text style={styles.noDataText}>Không có dữ liệu</Text>
          }
          ListFooterComponent={renderFooter}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Bạn có chắc chắn muốn xóa{" "}
              {activeTab === "Income" ? "thu nhập" : "chi tiêu"} "
              {itemToDelete?.category_name}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonDelete]}
                onPress={confirmDelete}
              >
                <Text style={styles.textStyle}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={confirmationModalVisible}
        onRequestClose={() =>
          setConfirmationModalVisible(!confirmationModalVisible)
        }
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>{alertMessage}</Text>
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
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    alignItems: "center",
  },
  brandText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    fontFamily: "Cursive",
    textShadowColor: "#00FF88",
    textShadowOffset: { width: 1, height: 3 },
    textShadowRadius: 5,
  },
  innerContainer: {
    width: "100%",
    height: "25%",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#008B45",
    borderBottomRightRadius: 70,
  },
  mainContainer: {
    width: "90%",
    height: "25%",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#E0E0E0",
    borderRadius: 20,
    marginTop: -45,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  totalAmount: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginTop: 40,
  },
  textMonth: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "bold",
    color: "#CFCFCF",
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: 5,
    width: "80%",
    justifyContent: "space-between",
    backgroundColor: "#CCCCCC",
    padding: 5,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
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
    color: "#FFFFFF",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  contentView: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  overviewContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  leftSide: {
    flex: 1,
    alignItems: "flex-start",
  },
  rightSide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseText: {
    fontSize: 16,
    color: "#000000",
    marginTop: 20,
  },
  incomeText: {
    fontSize: 16,
    color: "#000000",
    marginTop: 20,
  },
  incomeTotal: {
    fontSize: 24,
    color: "#00CD66",
    fontWeight: "bold",
  },
  expenseTotal: {
    fontSize: 24,
    color: "#FF4444",
    fontWeight: "bold",
  },
  planText: {
    fontSize: 16,
    color: "#000000",
    marginTop: 20,
  },
  planNumber: {
    fontSize: 18,
    color: "#000000",
    fontWeight: "bold",
  },
  remainingtext: {
    fontSize: 16,
    color: "#000000",
    marginTop: 20,
  },
  remainingNumber: {
    fontSize: 18,
    color: "#CDBE70",
    fontWeight: "bold",
  },
  datalistContainer: {
    width: "90%",
    marginTop: 20,
    flex: 1,
    paddingBottom: 20,
  },
  dateGroupContainer: {
    marginBottom: 20,
    borderRadius: 10,
  },
  dateGroupHeader: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 10,
    fontWeight: "bold",
  },
  expenseListItem: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  expenseListItemLeft: {
    flex: 1,
  },
  icon: {
    marginRight: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: "#000000",
  },
  expenseCategory: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "bold",
  },
  expenseAmount: {
    fontSize: 15,
    color: "#FF4444",
    marginLeft: 10,
    fontWeight: "bold",
  },
  incomeAmount: {
    fontSize: 15,
    color: "#008B45",
    marginLeft: 10,
    fontWeight: "bold",
  },
  totalRevenueNumber: {
    fontSize: 18,
    color: "#CDBE70",
    fontWeight: "bold",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: "#00c853",
  },
  deleteButton: {
    backgroundColor: "#d32f2f",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
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
    color: "#000000",
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
  buttonDelete: {
    backgroundColor: "#d32f2f",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
    marginTop: 20,
  },
  buttonConfirm: {
    backgroundColor: "#008B45",
  },
  expenseListItemRight: {
    width: "40%",
    alignItems: "flex-end",
  },
  noMoreDataText: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
    marginTop: 20,
  },
});
