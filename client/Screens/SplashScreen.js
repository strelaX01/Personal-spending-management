import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Modal, Text, Button, BackHandler } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';

const SplashScreen = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const logoScale = useSharedValue(0);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    // Bắt đầu từ 0, phóng to đến 1.3 (lớn hơn kích thước cuối), sau đó thu nhỏ về 1.0
    logoScale.value = withSequence(
      withTiming(1.3, { 
        duration: 1200, 
        easing: Easing.out(Easing.exp) 
      }),
      withTiming(1.0, {
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      })
    );

    const networkListener = NetInfo.addEventListener(state => {
      if (!isMounted.current) return;
      handleNetworkChange(state.isConnected);
    });

    // Kiểm tra ngay lập tức khi mount
    NetInfo.fetch().then(state => {
      if (!isMounted.current) return;
      handleNetworkChange(state.isConnected);
    });

    return () => {
      isMounted.current = false;
      networkListener();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleNetworkChange = (connected) => {
    setModalVisible(!connected);
    
    if (connected) {
      startLoginCheck();
    } else {
      cancelLoginCheck();
    }
  };

  const startLoginCheck = async () => {
    cancelLoginCheck();
    
    try {
      const userToken = await AsyncStorage.getItem('token');
      
      timeoutRef.current = setTimeout(async () => {
        const currentState = await NetInfo.fetch();
        
        if (currentState.isConnected) {
          navigateUser(userToken);
        } else {
          setModalVisible(true);
        }
      }, 3000);
    } catch (error) {
      console.error('Error checking login status:', error);
    }
  };

  const cancelLoginCheck = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const navigateUser = (token) => {
    if (!isMounted.current) return;
    navigation.replace(token ? 'BottomTabs' : 'Login');
  };

  const handleRetry = async () => {
    const state = await NetInfo.fetch();
    
    if (state.isConnected) {
      setModalVisible(false);
      startLoginCheck();
    }
  };

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Không có kết nối internet</Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Thử lại"
                onPress={handleRetry}
                color="#007AFF"
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="Thoát app"
                onPress={() => BackHandler.exitApp()}
                color="#FF3B30"
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.logoContainer}>
        <Animated.Image 
          source={require('../assets/Logo/PennyRoot-Logo.png')} 
          style={[styles.logo, logoAnimatedStyle]} 
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: '90%',  
    height: 300,  
  },
  logo: {
    flex: 1,
    width: undefined,
    height: undefined,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonSpacer: {
    width: 16,
  },
});

export default SplashScreen;