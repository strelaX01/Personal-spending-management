import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  FlatList,
  Modal
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { Ionicons, Fontisto, MaterialCommunityIcons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import colors from '../assets/Colors/Colors';
import icons from '../assets/Icons/Icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import ErrorModal from '../Components/ErrorModal';

const EditIncomeScreen = ({ route }) => {
  const { data } = route.params || {};
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const spinValue = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');


  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    getToken();
  }, []);

  useEffect(() => {
    if (data) {
      setAmount(formatCurrency(data.amount.toString()));
      setSelectedCategory(data.category_id);
      const [day, month, year] = data.date.split('-');
      setSelectedDate(new Date(`${year}-${month}-${day}T00:00:00`));
      setDescription(data.description);
    }
  }, [data]);

  useEffect(() => {
    if (token) {
      fetchCategories();
      if (!data) {
        setSelectedDate(new Date());
      }
    }
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      if (!data) {
        setSelectedDate(new Date());
      }
    }, [data])
  );

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



  const fetchCategories = async () => {
    try {
      const response = await axios.get(`http://10.0.2.2:3000/api/category/GetIncomeCategories?token=${token}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }

  }


  const handleExpenseCategory = () => {
    navigation.navigate('CategoryTabView', { initialIndex: 0 });

  };

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const toggleBackDatePicker = () => {
    setSelectedDate(new Date(selectedDate.getTime() - 86400000));

  }

  const toggleForwardDatePicker = () => {
    setSelectedDate(new Date(selectedDate.getTime() + 86400000));
  }


  const handleEdit = async () => {

    setLoading(true);

    try {
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const numericAmount = parseFloat(amount.replace(/\./g, ''));

      const updatedIncome = {
        amount: numericAmount,
        category_id: selectedCategory,
        date: formattedDate,
        description: description,
        token: token,
      };

      const response = await axios.put(`http://10.0.2.2:3000/api/transaction/EditIncome/${data.id}`, updatedIncome);

      if (response.status === 200) {
        setConfirmationMessage('Cập nhật thu nhập thành công');
        setConfirmationModalVisible(true);
      }

    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          setModalMessage(error.response.data.message);
          setModalVisible(true);
        } else {
          setErrorModalMessage(error.response.data.message);
          setErrorModal(true);
        }
      } else {
        setErrorModalMessage('Đã xảy ra lỗi. Vui lòng thử lại.');
        setErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmEdit = async () => {
    setLoading(true);
    try {
      const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      const numericAmount = parseFloat(amount.replace(/\./g, ''));

      const updatedIncome = {
        amount: numericAmount,
        category_id: selectedCategory,
        date: formattedDate,
        description: description,
        token: token,
        income_id: data.id,
      };
      const response = await axios.post('http://10.0.2.2:3000/api/transaction/confirmEditIncome', updatedIncome);

      if (response.status === 200) {
        setConfirmationMessage('Thu nhập đã được cập nhật thành công sau khi xác nhận!');
        setConfirmationModalVisible(true);
      } else {
        setErrorModalMessage(response.data.message || 'Lỗi không xác định từ server');
        setErrorModal(true);
      }
    } catch (error) {
      if (error.response) {
        setErrorModalMessage(error.response.data.message || 'Đã xảy ra lỗi từ server.');
      } else {
        setErrorModalMessage('Đã xảy ra lỗi. Vui lòng thử lại.');
      }
      setErrorModal(true);
    } finally {
      setLoading(false);
    }
  }


  const formatCurrency = (value) => {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleAmountChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(formatCurrency(numericValue));
  };



  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={30} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Sửa thu nhập</Text>
        {loading ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="add" size={30} color="#000000" />
          </Animated.View>
        ) : (
          <TouchableOpacity onPress={handleEdit}>
            <Text style={styles.addText}>Sửa</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.expenseContainer}>
        <View style={styles.expenseInputView}>
          <FontAwesome name="money" size={30} color="#008B45" />
          <TextInput
            style={styles.expenseInput}
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

        <View style={styles.expenseListCategory}>
          <FlatList
            data={categories}
            keyExtractor={(item) => item.category_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={item.category_id}
                style={[
                  styles.categoryButtonList,
                  selectedCategory === item.category_id && { borderColor: '#008B45', borderWidth: 2 },
                ]}
                onPress={() => setSelectedCategory(item.category_id)}
              >
                <Ionicons name={item.category_icon} size={30} color={item.category_color} />
                <Text style={styles.categoryName}>{item.category_name}</Text>

              </TouchableOpacity>
            )}
            numColumns={4}
            contentContainerStyle={styles.flatListContainer}
            style={styles.flatList}
          />
        </View>

        <View style={styles.noteBookContainer}>
          <MaterialCommunityIcons style={styles.noteBookIcon} name="notebook-minus-outline" size={30} />
          <TextInput
            style={styles.noteInput}
            placeholder="Nhập mô tả"
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.datePickerContainer}>
          <Fontisto name="date" size={30} color="#008B45" />
          <TouchableOpacity onPress={toggleBackDatePicker}>
            <MaterialCommunityIcons style={styles.backDateIcon} name="calendar-arrow-left" size={30} />
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleDatePicker} style={styles.dateDisplay}>
            <Text style={styles.dateText}>{selectedDate.toLocaleDateString('en-GB')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleForwardDatePicker}>
            <MaterialCommunityIcons style={styles.forwardDateIcon} name="calendar-arrow-right" size={30} />
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


      </View>

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
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Text style={styles.textStyle}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonConfirm]}
                onPress={() => {
                  setModalVisible(false);
                  confirmEdit(); 
                }}
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
              onPress={() => {
                setConfirmationModalVisible(false);
                navigation.goBack();
              }}
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

    </SafeAreaView>
  )
}

export default EditIncomeScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
  },
  headerText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  expenseContainer: {
    flexDirection: '1',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  expenseInputView: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  expenseInput: {
    color: '#000000',
    padding: 15,
    fontSize: 16,
    width: '90%',
    backgroundColor: '#DDDDDD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginLeft: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  catgegorSettings: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  categoryText: {
    color: '#000000', 
    fontSize: 16,
    marginRight: 10,
  },
  expenseListCategory: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    height: 250,
  },
  categoryButtonList: {
    width: '22%',
    backgroundColor: '#DDDDDD',
    padding: 10,
    borderRadius: 10,
    margin: 5,
    alignItems: 'center',
  },
  categoryName: {
    color: '#000000',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: 'bold',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
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
  backDateIcon: {
    color: '#000000',
  },
  forwardDateIcon: {
    color: '#000000',
  },
  dateText: {
    color: '#000000',
    fontSize: 16,
  },
  dateTimePicker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    width: '90%',
    alignSelf: 'center',
  },

  noteBookContainer: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  noteBookIcon: {
    color: '#008B45',

  },
  noteInput: {
    color: '#000000',
    padding: 15,
    fontSize: 16,
    width: '90%',
    backgroundColor: '#DDDDDD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
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
    textAlign: 'center',
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonConfirm: {
    backgroundColor: '#008B45',
  },
  buttonCancel: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});