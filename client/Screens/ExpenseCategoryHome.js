import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingModal from "../Components/LoadingModal";
import ErrorModal from "../Components/ErrorModal";

const ExpenseCategoryHome = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const openSwipeableRef = useRef(null);
  const navigation = useNavigation();
  const [token, setToken] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  const swipeableRefs = useRef({});
  const openSwipeableId = useRef(null);

  useEffect(() => {
    const initialize = async () => {
      await getToken();
      fetchCategories();
    };
    initialize();
  }, []);

  const fetchCategories = async (token) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `http://10.0.2.2:3000/api/finance/expense/categories`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching expense categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    try {
      const value = await AsyncStorage.getItem("token");
      if (value !== null) {
        setToken(value);
        fetchCategories(value);
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchCategories(token);
      }
    }, [token])
  );

  const closeAllSwipeables = useCallback(() => {
    if (openSwipeableId.current) {
      const swipeableToClose = swipeableRefs.current[openSwipeableId.current];
      if (swipeableToClose) {
        swipeableToClose.close();
      }
      openSwipeableId.current = null;
    }
  }, []);

  const handleEdit = useCallback(
    (item) => {
      closeAllSwipeables();

      setTimeout(() => {
        navigation.navigate("EditExpenseCategory", { category: item });
      }, 300); 
    },
    [navigation, closeAllSwipeables]
  );

  const handleDelete = useCallback(
    (item) => {
      closeAllSwipeables();

      setTimeout(() => {
        setCategoryToDelete(item);
        setModalVisible(true);
      }, 300);
    },
    [closeAllSwipeables]
  );

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await axios.delete(
        `http://10.0.2.2:3000/api/finance/expense/category`,
        {
          data: { category_id: categoryToDelete.category_id },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 200) {
        setCategories((prevCategories) =>
          prevCategories.filter(
            (category) => category.category_id !== categoryToDelete.category_id
          )
        );
        setErrorModalMessage("Xóa danh mục thành công.");
        setErrorModal(true);
      } else {
        setErrorModalMessage("Đã xảy ra lỗi khi xóa danh mục");
        setErrorModal(true);
      }
    } catch (error) {
      setErrorModalMessage("Đã xảy ra lỗi khi xóa danh mục");
      setErrorModal(true);
    } finally {
      setDeleting(false);
      setModalVisible(false);
      setCategoryToDelete(null);
    }
  };

  const closeOtherSwipeables = useCallback((currentId) => {
    if (openSwipeableId.current && openSwipeableId.current !== currentId) {
      const swipeableToClose = swipeableRefs.current[openSwipeableId.current];
      if (swipeableToClose) {
        swipeableToClose.close();
      }
    }
    openSwipeableId.current = currentId;
  }, []);

  const renderRightActions = (item, progress) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [64, 0],
    });

    const opacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 1],
    });

    return (
      <View style={styles.actionContainer}>
        <Animated.View style={{ transform: [{ translateX: trans }], opacity }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text style={styles.actionText}>Sửa</Text>
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          style={{ transform: [{ translateX: trans }], opacity, marginLeft: 5 }}
        >
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.actionText}>Xóa</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };
  const renderCategory = ({ item, index }) => {
    const itemId = item.category_id || `temp-${index}`;

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current[itemId] = ref;
          } else {
            delete swipeableRefs.current[itemId];
          }
        }}
        renderRightActions={(progress) => renderRightActions(item, progress)}
        onSwipeableOpen={() => closeOtherSwipeables(itemId)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={styles.categoryContainer}
          onPress={() => {
    
            if (openSwipeableId.current === itemId) {
              swipeableRefs.current[itemId]?.close();
              openSwipeableId.current = null;
            }
          }}
        >
          <View style={[styles.iconContainer]}>
            <Ionicons
              name={item.category_icon}
              size={26}
              color={item.category_color}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.categoryName}>
              {item.category_name || "Unnamed Category"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) =>
            item.id ? item.id.toString() : Math.random().toString()
          }
          renderItem={renderCategory}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.noDataText}>Không có dữ liệu</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
    
          onScroll={() => {
            closeAllSwipeables();
          }}
          scrollEventThrottle={16}
        />
      )}
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
            <Text style={styles.modalText}>
              Bạn có chắc chắn muốn xóa danh mục "
              {categoryToDelete?.category_name}"?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setModalVisible(!modalVisible)}
                disabled={deleting}
              >
                <Text style={styles.textStyle}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonDelete]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                <Text style={styles.textStyle}>Xóa</Text>
              </TouchableOpacity>
            </View>
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
      {deleting && <LoadingModal />}
    </View>
  );
};

export default ExpenseCategoryHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F0F0F0", 
  },
  listContainer: {
    paddingVertical: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    color: "#000000", 
    fontSize: 16,
    fontWeight: "bold",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#CCCCCC",
    borderRadius: 12,
    padding: 12,
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
});
