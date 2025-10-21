import { StyleSheet, Text, View, TouchableOpacity, Animated, ScrollView, Alert, Modal } from 'react-native';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Ionicons, Fontisto, MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { PieChart } from 'react-native-gifted-charts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Svg, { Text as SvgText } from 'react-native-svg';
import axios from 'axios';


const TabButton = React.memo(({ label, isActive, onPress, animatedStyle }) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.activeTab]}
    onPress={onPress}
  >
    <Animated.View style={[styles.tabButtonContent, isActive && styles.activeTabText, animatedStyle]}>
      <Text style={styles.tabText}>{label}</Text>
    </Animated.View>
  </TouchableOpacity>
));


const PieChartView = React.memo(({ data, centerLabel }) => {
  if (!data || data.length === 0) {
    return <Text style={styles.noDataText}>Không có dữ liệu</Text>;
  }

  return (
    <Animated.View>
      <PieChart
        data={data}
        showText
        textColor="black"
        textSize={12}
        radius={100}
        innerRadius={60}
        centerLabelComponent={() => (
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{centerLabel}</Text>
        )}
        renderLabels={({ slices }) => (
          <Svg height="100%" width="100%">
            {slices.map((slice, index) => {
              const { centroid, data } = slice;
              return (
                <SvgText
                  key={index}
                  x={centroid[0]}
                  y={centroid[1]}
                  fill={data.color} 
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {data.name}
                </SvgText>
              );
            })}
          </Svg>
        )}
      />
    </Animated.View>
  );
});


const ItemList = React.memo(({ items, planItems, activeTab, handleItemPress, type }) => {

  if (!items || items.length === 0) {
    return <Text style={styles.noDataText}>Không có dữ liệu</Text>;
  }

  const textColor = type === 'Income' ? '#008B45' : '#FF0000';
  const prefix = type === 'Income' ? '+' : '-';
  
  const categoryMap = new Map();
  items.forEach(item => {
    if (!categoryMap.has(item.category_id)) {
      const matchingPlan = planItems?.find(plan => plan.category_id === item.category_id);
      
      categoryMap.set(item.category_id, {
        category_id: item.category_id,
        category_name: item.category_name,
        category_color: item.category_color,
        category_icon: item.category_icon,
        planAmount: matchingPlan ? matchingPlan.amount : 0
      });
    }
  });
  
  const categories = Array.from(categoryMap.values());

  return (
    <Animated.View>
      {categories.map((category, index) => {
        const matchingItems = items.filter(item => item.category_id === category.category_id);
        const totalAmount = matchingItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        
        let percentageText;
        if (category.planAmount > 0) {
          percentageText = `(${((totalAmount / category.planAmount) * 100).toFixed(2)}%)`;
        } else if (totalAmount > 0) {
          percentageText = "(--)"; 
        } else {
          percentageText = "(0%)";
        }

        return (
          <TouchableOpacity
            key={index}
            style={styles.listItem}
            onPress={() => handleItemPress({...category, amount: category.planAmount}, type)}
          >
            <View style={styles.listItemRow}>
              <Ionicons name={category.category_icon || 'help-circle-outline'} size={30} color={category.category_color || '#cccccc'} />
              <View style={styles.listItemTextContainer}>
                <Text style={styles.listItemText}>{category.category_name || 'Unknown'}</Text>
                {activeTab === 'Monthly' && (
                  <Text style={styles.listItemPlan}>
                    Kế hoạch: {(category.planAmount || 0).toLocaleString('vi-VN')}
                  </Text>
                )}
              </View>
              <View style={styles.listItemAmountContainer}>
                <Text style={[styles.listItemAmount, { color: textColor }]}>
                  {prefix}{(totalAmount || 0).toLocaleString('vi-VN')}
                </Text>
                {activeTab === 'Monthly' && (
                  <Text style={styles.listItemPercentage}>
                    {percentageText}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
});

const DatePickerModal = React.memo(({ visible, onClose, selectedDate, handleDateChange, activeTab }) => (
  <Modal
    transparent={true}
    animationType="slide"
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.pickerContainer}>
        {activeTab === 'Monthly' ? (
          <>
            <Picker
              selectedValue={selectedDate.getMonth()}
              onValueChange={(itemValue) => handleDateChange(itemValue, selectedDate.getFullYear())}
              style={{ width: 200, height: 50 }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <Picker.Item key={i} label={`Tháng ${i + 1}`} value={i} />
              ))}
            </Picker>
            <Picker
              selectedValue={selectedDate.getFullYear()}
              onValueChange={(itemValue) => handleDateChange(selectedDate.getMonth(), itemValue)}
              style={{ width: 200, height: 50 }}
            >
              {Array.from({ length: 30 }, (_, i) => (
                <Picker.Item key={i} label={`${2020 + i}`} value={2020 + i} />
              ))}
            </Picker>
          </>
        ) : (
          <Picker
            selectedValue={selectedDate.getFullYear()}
            onValueChange={(itemValue) => handleDateChange(selectedDate.getMonth(), itemValue)}
            style={{ width: 200, height: 50 }}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <Picker.Item key={i} label={`${2020 + i}`} value={2020 + i} />
            ))}
          </Picker>
        )}
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Đóng</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
));


const calculateTotalAmount = (items) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => total + (item.amount || 0), 0);
};

const ReportScreen = () => {
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [tabAnimation] = useState(new Animated.Value(0));
  const [activeTab, setActiveTab] = useState('Monthly');
  const [activeSubTab, setActiveSubTab] = useState('Income');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);


  const [expenseData, setExpenseData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [expensePlanData, setExpensePlanData] = useState([]);
  const [incomePlanData, setIncomePlanData] = useState([]);


  const [monthlyExpense, setMonthlyExpense] = useState('0');
  const [monthlyIncome, setMonthlyIncome] = useState('0');
  const [monthlyTotal, setMonthlyTotal] = useState('0');
  const [annualExpense, setAnnualExpense] = useState('0');
  const [annualIncome, setAnnualIncome] = useState('0');
  const [annualTotal, setAnnualTotal] = useState('0');


  const [annualExpenseCategories, setAnnualExpenseCategories] = useState([]);
  const [annualIncomeCategories, setAnnualIncomeCategories] = useState([]);
  const [expenseCategory, setExpenseCategory] = useState([]);
  const [incomeCategory, setIncomeCategory] = useState([]);




  useEffect(() => {
    const getToken = async () => {
      try {
        const value = await AsyncStorage.getItem('token');
        if (value !== null) {
          setToken(value);
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
    };

    getToken();
  }, []);


  const calculateAnnualCategoryData = useCallback((data) => {
    if (!data || data.length === 0) return [];

    const categoryMap = new Map();

    data.forEach(item => {
      const { category_id, category_name, category_color, category_icon, amount } = item;

      if (categoryMap.has(category_id)) {
        const categoryData = categoryMap.get(category_id);
        categoryData.totalAmount += (amount || 0);
      } else {
        categoryMap.set(category_id, {
          category_id,
          category_name,
          category_color,
          category_icon,
          totalAmount: amount || 0,
          amount: 0,
        });
      }
    });

    return Array.from(categoryMap.values());
  }, []);


  const fetchExpenseData = useCallback(async (date) => {
    if (!token) return;

    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const response = await axios.get(
        `http://10.0.2.2:3000/api/finance/expense?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const expenses = (response.data?.data || []).map((item) => ({
        ...item,
        amount: Number(item.amount),
      }));

      setExpenseData(expenses);

      const totalExpense = calculateTotalAmount(expenses);
      setMonthlyExpense(totalExpense.toLocaleString('vi-VN'));
    } catch (error) {
      console.error('Error fetching expense data:', error);
      setExpenseData([]);
      setMonthlyExpense('0');
    }
  }, [token]);


  const fetchIncomeData = useCallback(async (date) => {
    if (!token) return;

    try {
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const response = await axios.get(
        `http://10.0.2.2:3000/api/finance/income?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const incomes = (response.data?.data || []).map((item) => ({
        ...item,
        amount: Number(item.amount),
      }));

      setIncomeData(incomes);

      const totalIncome = calculateTotalAmount(incomes);
      setMonthlyIncome(totalIncome.toLocaleString('vi-VN'));
    } catch (error) {
      console.error('Error fetching income data:', error);
      Alert.alert('Error', 'Failed to fetch income data');
      setIncomeData([]);
      setMonthlyIncome('0');
    }
  }, [token]);


  const fetchAnnualExpenseData = useCallback(async (date) => {
    if (!token) return;

    try {
      const year = date.getFullYear();
      
      const response = await axios.get(
        `http://10.0.2.2:3000/api/finance/plan/expense/annual?year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const expenses = (response.data?.data || []).map((item) => ({
        ...item,
        amount: Number(item.amount),
      }));

      setExpenseData(expenses);

      const expenseCategories = calculateAnnualCategoryData(expenses);
      setAnnualExpenseCategories(expenseCategories);
      
      const totalExpense = calculateTotalAmount(expenses);
      setAnnualExpense(totalExpense.toLocaleString('vi-VN'));
    } catch (error) {
      console.error('Error fetching annual expense data:', error);
      Alert.alert('Error', 'Failed to fetch annual expense data');
      setExpenseData([]);
      setAnnualExpenseCategories([]);
      setAnnualExpense('0');
    }
  }, [token, calculateAnnualCategoryData]);

  const fetchAnnualIncomeData = useCallback(async (date) => {
    if (!token) return;

    try {
      const year = date.getFullYear();
      
      const response = await axios.get(
        `http://10.0.2.2:3000/api/finance/plan/income/annual?year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const incomes = (response.data?.data || []).map((item) => ({
        ...item,
        amount: Number(item.amount),
      }));

      setIncomeData(incomes);

      const incomeCategories = calculateAnnualCategoryData(incomes);
      setAnnualIncomeCategories(incomeCategories);

      const totalIncome = calculateTotalAmount(incomes);
      setAnnualIncome(totalIncome.toLocaleString('vi-VN'));
    } catch (error) {
      console.error('Error fetching annual income data:', error);
      Alert.alert('Error', 'Failed to fetch annual income data');
      setIncomeData([]);
      setAnnualIncomeCategories([]);
      setAnnualIncome('0');
    }
  }, [token, calculateAnnualCategoryData]);


  const updateYearlyData = useCallback((date) => {
    if (!token) return;

    fetchAnnualExpenseData(date);
    fetchAnnualIncomeData(date);
  }, [
    token,
    fetchAnnualExpenseData,
    fetchAnnualIncomeData
  ]);


  const updateData = useCallback((date) => {
    if (!token) return;

    if (activeTab === 'Monthly') {
      fetchExpenseData(date);
      fetchIncomeData(date);
      fetchPlanData(date);
    } else {
      fetchAnnualExpenseData(date);
      fetchAnnualIncomeData(date);
      fetchPlanData(date);
    }
  }, [
    token,
    activeTab,
    fetchExpenseData,
    fetchIncomeData,
    fetchPlanData,
    fetchAnnualExpenseData,
    fetchAnnualIncomeData
  ]);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        updateData(selectedDate);
      }
    }, [token, selectedDate, updateData])
  );


  const handleTabPress = useCallback((tab) => {
    setActiveTab(tab);
    const newDate = new Date();
    setSelectedDate(newDate);
    updateData(newDate);

    Animated.timing(tabAnimation, {
      toValue: tab === 'Monthly' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [tabAnimation, updateData]);


  const handleSubTabPress = useCallback((subTab) => {
    setActiveSubTab(subTab);
  }, []);


  const handleDateChange = useCallback((month, year) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(month);
    newDate.setFullYear(year);
    setSelectedDate(newDate);
    setShowMonthYearPicker(false);
    updateData(newDate);
  }, [selectedDate, updateData]);


  const handleBackDate = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'Monthly') {
      newDate.setMonth(selectedDate.getMonth() - 1);
    } else {
      newDate.setFullYear(selectedDate.getFullYear() - 1);
    }
    setSelectedDate(newDate);
    updateData(newDate);
  }, [selectedDate, activeTab, updateData]);


  const handleForwardDate = useCallback(() => {
    const newDate = new Date(selectedDate);
    if (activeTab === 'Monthly') {
      newDate.setMonth(selectedDate.getMonth() + 1);
    } else {
      newDate.setFullYear(selectedDate.getFullYear() + 1);
    }
    setSelectedDate(newDate);
    updateData(newDate);
  }, [selectedDate, activeTab, updateData]);


  const handleItemPress = useCallback((item, type) => {
    const categoryData = type === 'Income' ? incomeData : expenseData;
    if (!categoryData || categoryData.length === 0) return;

    const filteredData = categoryData.filter(dataItem => dataItem.category_id === item.category_id);
    if (activeTab === 'Monthly') {
      navigation.navigate('DetailReport', { item, filteredData, type });
    } else {
      navigation.navigate('DetailReportYear', { item, filteredData, type });
    }
  }, [incomeData, expenseData, activeTab, navigation]);


  const calculateTotalForPlan = useCallback((planData, data) => {
    if (!planData || !data) return [];

    return planData.map(planItem => {
      const matchingData = data.filter(dataItem => dataItem.category_id === planItem.category_id);
      const totalAmount = matchingData.reduce((sum, dataItem) => sum + (dataItem.amount || 0), 0);

      if (matchingData.length > 0) {
        const { category_name, category_color, category_icon } = matchingData[0];
        return { ...planItem, totalAmount, category_name, category_color, category_icon };
      } else {
        return {
          ...planItem,
          totalAmount,
          category_name: planItem.category_name || 'Unknown',
          category_color: planItem.category_color || '#cccccc',
          category_icon: planItem.category_icon || 'ios-help-circle'
        };
      }
    });
  }, []);


  const chartData = useMemo(() => {
    const categoryMap = new Map();
    expenseData.forEach(item => {
      if (categoryMap.has(item.category_id)) {
        categoryMap.get(item.category_id).value += item.amount;
      } else {
        categoryMap.set(item.category_id, {
          name: item.category_name,
          value: item.amount,
          color: item.category_color,
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [expenseData]);

  const incomeChartData = useMemo(() => {
    const categoryMap = new Map();
    incomeData.forEach(item => {
      if (categoryMap.has(item.category_id)) {
        categoryMap.get(item.category_id).value += item.amount;
      } else {
        categoryMap.set(item.category_id, {
          name: item.category_name,
          value: item.amount,
          color: item.category_color,
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [incomeData]);


  const calculateTotal = useCallback((income, expense) => {
    const total = income - expense;
    return total >= 0 ? `+${total.toLocaleString('vi-VN')}` : `-${Math.abs(total).toLocaleString('vi-VN')}`;
  }, []);


  useEffect(() => {
    const totalIncome = incomeData.length > 0 ? incomeData.reduce((sum, income) => sum + (income.amount || 0), 0) : 0;
    const totalExpense = expenseData.length > 0 ? expenseData.reduce((sum, expense) => sum + (expense.amount || 0), 0) : 0;

    if (activeTab === 'Monthly') {
      setMonthlyTotal(calculateTotal(totalIncome, totalExpense));
      setMonthlyIncome(totalIncome.toLocaleString('vi-VN'));
      setMonthlyExpense(totalExpense.toLocaleString('vi-VN'));
    } else {
      setAnnualTotal(calculateTotal(totalIncome, totalExpense));
      setAnnualIncome(totalIncome.toLocaleString('vi-VN'));
      setAnnualExpense(totalExpense.toLocaleString('vi-VN'));
    }
  }, [incomeData, expenseData, activeTab, calculateTotal]);


  const updatedExpensePlanData = useMemo(() => {
    return calculateTotalForPlan(expensePlanData, expenseData);
  }, [expensePlanData, expenseData, calculateTotalForPlan]);

  const updatedIncomePlanData = useMemo(() => {
    return calculateTotalForPlan(incomePlanData, incomeData);
  }, [incomePlanData, incomeData, calculateTotalForPlan]);


  const animatedTabStyle = useMemo(() => ({
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
  }), [tabAnimation]);

  const SummaryList = React.memo(({ data, type }) => {
    if (!data || data.length === 0) {
      return <Text style={styles.noDataText}>Không có dữ liệu</Text>;
    }

    const textColor = type === 'Income' ? '#008B45' : '#FF0000';
    const prefix = type === 'Income' ? '+' : '-';

    const groupedData = data.reduce((acc, item) => {
      const existingItem = acc.find(i => i.category_id === item.category_id);
      if (existingItem) {
        existingItem.totalAmount += item.amount || 0;
      } else {
        acc.push({ ...item, totalAmount: item.amount || 0 });
      }
      return acc;
    }, []);

    return (
      <Animated.View>
        {groupedData.map((item, index) => (
          <View key={index} style={styles.summaryItem}>
            <Ionicons name={item.category_icon} size={30} color={item.category_color} />
            <Text style={styles.summaryItemText}>{item.category_name}</Text>
            <Text style={[styles.summaryItemAmount, { color: textColor }]}>
              {prefix}{(item.totalAmount || 0).toLocaleString('vi-VN')}
            </Text>
          </View>
        ))}
      </Animated.View>
    );
  });


const fetchPlanData = useCallback(async (date) => {
  if (!token) return;

  try {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();


    // --- GỌI API SONG SONG ---
    const [
      expensePlanResponse,
      incomePlanResponse,
      annualExpensePlanResponse,
      annualIncomePlanResponse
    ] = await Promise.all([
      axios.get(
        `http://10.0.2.2:3000/api/finance/plan/expense?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      axios.get(
        `http://10.0.2.2:3000/api/finance/plan/income?month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      axios.get(
        `http://10.0.2.2:3000/api/finance/plan/expense/annual?year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ),
      axios.get(
        `http://10.0.2.2:3000/api/finance/plan/income/annual?year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    ]);

    // --- CHUYỂN DỮ LIỆU SANG SỐ ---
    const expensePlan = (expensePlanResponse.data?.data || []).map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));

    const incomePlan = (incomePlanResponse.data?.data || []).map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));

    const annualExpensePlan = (annualExpensePlanResponse.data?.data || []).map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));

    const annualIncomePlan = (annualIncomePlanResponse.data?.data || []).map((item) => ({
      ...item,
      amount: Number(item.amount),
    }));

  

    // --- LƯU STATE ---
    setExpensePlanData(expensePlan);
    setIncomePlanData(incomePlan);
    setAnnualExpenseCategories(annualExpensePlan);
    setAnnualIncomeCategories(annualIncomePlan);

  } catch (error) {

    setExpensePlanData([]);
    setIncomePlanData([]);
    setAnnualExpenseCategories([]);
    setAnnualIncomeCategories([]);
  }
}, [token]);


  useEffect(() => {
    updateData(selectedDate);
  }, [activeTab]);

  return (
    <View style={styles.container}>

      <View style={styles.tabContainer}>
        <TabButton
          label="Hàng tháng"
          isActive={activeTab === 'Monthly'}
          onPress={() => handleTabPress('Monthly')}
          animatedStyle={animatedTabStyle}
        />
        <TabButton
          label="Hàng năm"
          isActive={activeTab === 'Annual'}
          onPress={() => handleTabPress('Annual')}
          animatedStyle={animatedTabStyle}
        />
      </View>

      <View style={styles.mainContainer}>

        <View style={styles.headerContainer}>

          <View style={styles.datePickerContainer}>
            <Fontisto name="date" size={30} color="#008B45" />
            <TouchableOpacity onPress={handleBackDate}>
              <MaterialCommunityIcons style={styles.backDateIcon} name="calendar-arrow-left" size={30} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowMonthYearPicker(true)} style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {activeTab === 'Monthly'
                  ? selectedDate.toLocaleDateString('en-GB', { month: '2-digit', year: 'numeric' })
                  : selectedDate.getFullYear()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForwardDate}>
              <MaterialCommunityIcons style={styles.forwardDateIcon} name="calendar-arrow-right" size={30} />
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.expenseTitle}>Chi tiêu</Text>
            <Text style={styles.expenseValue} numberOfLines={1} ellipsizeMode="tail">
              {activeTab === 'Monthly' ? monthlyExpense : annualExpense}
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.incomeTitle}>Thu nhập</Text>
            <Text style={styles.incomeValue} numberOfLines={1} ellipsizeMode="tail">
              {activeTab === 'Monthly' ? monthlyIncome : annualIncome}
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.totalTitle}>Thu chi</Text>
            <Text style={styles.totalValue} numberOfLines={1} ellipsizeMode="tail">
              {activeTab === 'Monthly' ? monthlyTotal : annualTotal}
            </Text>
          </View>
        </View>

        <View style={styles.subTabContainer}>
          <TouchableOpacity
            style={[styles.subTabButton, activeSubTab === 'Expenditure' && styles.activeSubTab]}
            onPress={() => handleSubTabPress('Expenditure')}
          >
            <Text style={styles.tabText}>Chi tiêu</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.subTabButton, activeSubTab === 'Income' && styles.activeSubTab]}
            onPress={() => handleSubTabPress('Income')}
          >
            <Text style={styles.tabText}>Thu nhập</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartContainer}>
          {activeSubTab === 'Income' ? (
            <PieChartView data={incomeChartData} centerLabel="Thu nhập" />
          ) : (
            <PieChartView data={chartData} centerLabel="Chi tiêu" />
          )}
        </View>

        <ScrollView style={styles.listContainer}>
          {activeSubTab === 'Income' ? (
            <ItemList items={incomeData} planItems={activeTab === 'Monthly' ? incomePlanData : annualIncomeCategories} activeTab={activeTab} handleItemPress={handleItemPress} type="Income" />
          ) : (
            <ItemList items={expenseData} planItems={activeTab === 'Monthly' ? expensePlanData : annualExpenseCategories} activeTab={activeTab} handleItemPress={handleItemPress} type="Expense" />
          )}
        </ScrollView>
      </View>

      <DatePickerModal
        visible={showMonthYearPicker}
        onClose={() => setShowMonthYearPicker(false)}
        selectedDate={selectedDate}
        handleDateChange={handleDateChange}
        activeTab={activeTab}
      />
    </View>
  );
};


export default ReportScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 50,
    width: '75%',
    justifyContent: 'space-between',
    backgroundColor: '#CCCCCC', 
    padding: 5,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#008B45',
    elevation: 2,
    shadowColor: '#00FF88',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabText: {
    color: '#FFFFFF', 
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 14,
    color: '#FFFFFF', 
    fontWeight: '600',
  },
  mainContainer: {
    width: '90%',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
    backgroundColor: '#E0E0E0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  headerContainer: {
    width: '100%',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#E0E0E0', 
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  backDateIcon: {
    color: '#000000', 
  },
  forwardDateIcon: {
    color: '#000000', 
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 10,
    padding: 5,
    width: '50%',
    justifyContent: 'center',
  },
  dateText: {
    color: '#000000', 
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF', 
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 20,
    color: '#008B45',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
    backgroundColor: '#CCCCCC', 
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  expenseTitle: {
    color: '#000000', 
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseValue: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeTitle: {
    color: '#000000', 
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeValue: {
    color: '#008B45',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalTitle: {
    color: '#000000', 
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#000000', 
    fontSize: 16,
    fontWeight: 'bold',
  },
  subTabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    width: '100%',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: '#CCCCCC', 
    borderRadius: 20,
  },
  subTabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',

  },
  activeSubTab: {
    backgroundColor: '#00A86B',
    elevation: 2,
    shadowColor: '#00FF88',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  
  },
  chartContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  listContainer: {
    marginTop: 20,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#E0E0E0', 
  },
  listItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  listItemText: {
    color: '#000000', 
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  listItemAmountContainer: {
    alignItems: 'flex-end',
  },
  listItemAmount: {
    color: '#000000', 
    fontSize: 16,
  },
  listItemPercentage: {
    color: '#000000',
    marginLeft: 10,
  },
  listItemPlan: {
    color: '#000000',
    fontSize: 14,
    marginLeft: 10,
  },
  noDataText: {
    color: '#000000', 
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  summaryContainer: {
    marginTop: 20,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#E0E0E0', 
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC', 
  },
  summaryItemText: {
    color: '#000000', 
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
  },
  summaryItemAmount: {
    color: '#000000', 
    fontSize: 16,
  },
  categoriesContainer: {
    marginTop: 20,
    width: '100%',
    maxHeight: 200,
    backgroundColor: '#E0E0E0', 
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC', 
  },
  categoryText: {
    color: '#000000', 
    fontSize: 16,
    marginLeft: 10,
  },
  listPlanAmount: {
    fontSize: 16,
  },
});