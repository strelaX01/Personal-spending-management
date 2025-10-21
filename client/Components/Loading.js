import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Text } from 'react-native';

const Loading = ({ message = 'Loading...', size = 30, color = '#00ff00' }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    rotateAnimation.start();

    return () => rotateAnimation.stop(); 
  }, [rotateAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderColor: color,
            transform: [{ rotate: rotateInterpolate }],
          },
        ]}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111111',
  },
  spinner: {
    borderWidth: 3,
    borderColor: '#333',
    borderTopColor: '#00ff00', // Customizable color for the animated part
    borderRadius: 15,
  },
  message: {
    marginTop: 10,
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
});
