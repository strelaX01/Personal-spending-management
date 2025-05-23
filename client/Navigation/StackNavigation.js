import { KeyboardAvoidingView, Platform, Text, View, Animated, StyleSheet } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SplashScreen from '../Screens/SplashScreen';
import LoginScreen from '../Screens/LoginScreen';
import RegisterScreen from '../Screens/RegisterScreen';
import HomeScreen from '../Screens/HomeScreen';
import VerificationScreen from '../Screens/VerificationScreen ';
import ForgotPasswordScreen from '../Screens/ForgotPasswordScreen';
import ForgotPasswordVerificationScreen from '../Screens/ForgotPasswordVerificationScreen';
import SettingScreen from '../Screens/SettingScreen';
import ReportScreen from '../Screens/ReportScreen';
import PlanScreen from '../Screens/PlanScreen';
import AddScreen from '../Screens/AddScreen';
import CategoryTabView from '../Screens/CategoryTabView';
import IncomeCategoryHome from '../Screens/IncomeCategoryHome';
import ExpenseCategoryHome from '../Screens/ExpenseCategoryHome';
import AddIncomeCategoryScreen from '../Screens/AddIncomeCategoryScreen';
import AddExpenseCategoryScreen from '../Screens/AddExpenseCategoryScreen';
import EditIncomeCategoryScreen from '../Screens/EditIncomeCategoryScreen';
import EditExpenseCategoryScreen from '../Screens/EditExpenseCategoryScreen';
import EditIncomeScreen from '../Screens/EditIncomeScreen';
import EditExpenseScreen from '../Screens/EditExpenseScreen';
import DetailReportScreen from '../Screens/DetailReportScreen';
import DetailReportYearScreen from '../Screens/DetailReportYearScreen';
import { Entypo } from "@expo/vector-icons";
import { AntDesign } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from 'react-native-svg';
import { Dimensions } from 'react-native';

const StackNavigation = () => {
    const Stack = createNativeStackNavigator();
    const Tab = createBottomTabNavigator();
    const { width } = Dimensions.get('window');

    const CustomTabLabel = ({ focused, label }) => {
        return <Text style={{ color: focused ? '#008B45' : '#696969' }}>{label}</Text>;
    };

    function BottomTab() {
        return (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'android' ? 'height' : undefined}
                keyboardVerticalOffset={Platform.OS === 'android' ? -100 : 0}>
                <Tab.Navigator 
                    screenOptions={{ 
                        tabBarStyle: { 
                            backgroundColor: 'transparent',
                            position: 'absolute',
                            borderTopWidth: 0,
                            elevation: 0,
                            height: 60
                        },
                        tabBarBackground: () => (
                            <View style={StyleSheet.absoluteFill}>
                                <Svg width={width} height={60}>
                                    <Path
                                        d={`
                                            M0,0
                                            L${width},0
                                            L${width},60
                                            L0,60
                                            L0,0
                                            Z
                                            M${width/2 - 30},0
                                            A30,30 0 0 1 ${width/2 + 30},0
                                        `}
                                        fill="#F0F0F0"
                                    />
                                </Svg>
                            </View>
                        )
                    }}
                >
                    <Tab.Screen name="Home" component={HomeScreen} options={{
                        tabBarLabel: ({ focused }) => <CustomTabLabel focused={focused} label="Trang chủ" />,
                        tabBarLabelStyle: { color: "#008E97" },
                        headerShown: false,
                        tabBarIcon: ({ focused }) =>
                            focused ? (
                                <Entypo name="home" size={24} color="#008B45" />
                            ) : (
                                <AntDesign name="home" size={24} color="#696969" />
                            ),
                    }} />
                    <Tab.Screen name="Report" component={ReportScreen} options={{
                        tabBarLabel: ({ focused }) => <CustomTabLabel focused={focused} label="Báo cáo" />,
                        tabBarLabelStyle: { color: "#008E97" },
                        headerShown: false,
                        tabBarIcon: ({ focused }) =>
                            focused ? (
                                <MaterialIcons name="analytics" size={24} color="#008B45" />
                            ) : (
                                <MaterialIcons name="analytics" size={24} color="#696969" />
                            ),
                    }} />
                    <Tab.Screen
                        name="Add"
                        component={AddScreen}
                        options={{
                            tabBarLabel: ({ focused }) => <CustomTabLabel focused={focused} />,
                            tabBarLabelStyle: { color: "#008E97" },
                            headerShown: false,
                            tabBarIcon: ({ focused }) => {
                                const scaleAnim = useRef(new Animated.Value(1)).current;

                                useEffect(() => {
                                    const pulse = Animated.loop(
                                        Animated.sequence([
                                            Animated.timing(scaleAnim, {
                                                toValue: 1.5,
                                                duration: 500,
                                                useNativeDriver: true,
                                            }),
                                            Animated.timing(scaleAnim, {
                                                toValue: 1,
                                                duration: 500,
                                                useNativeDriver: true,
                                            }),
                                        ])
                                    );

                                    if (focused) {
                                        pulse.start();
                                    } else {
                                        scaleAnim.setValue(1);
                                    }

                                    return () => pulse.stop();
                                }, [focused]);

                                return (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: 50,
                                            height: 50,
                                            backgroundColor: '#008B45',
                                            borderRadius: 25,
                                            top: -25,
                                            shadowColor: '#000',
                                            shadowOffset: {
                                                width: 0,
                                                height: 2,
                                            },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 3,
                                            elevation: 5,
                                        }}
                                    >
                                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                            <AntDesign
                                                name={focused ? 'plus' : 'plus'}
                                                size={32}
                                                color="#FFFFFF"
                                            />
                                        </Animated.View>
                                    </View>
                                );
                            },
                        }}
                    />

                    <Tab.Screen
                        name="Plan"
                        component={PlanScreen}
                        options={{
                            tabBarLabel: ({ focused }) => (
                                <CustomTabLabel focused={focused} label="Kế hoạch" />
                            ),
                            tabBarLabelStyle: { color: "#008E97" },
                            headerShown: false,
                            tabBarIcon: ({ focused }) =>
                                focused ? (
                                    <Ionicons name="clipboard" size={24} color="#008B45" />
                                ) : (
                                    <Ionicons name="clipboard" size={24} color="#696969" />
                                ),
                        }}
                    />

                    <Tab.Screen
                        name="Settings"
                        component={SettingScreen}
                        options={{
                            tabBarLabel: ({ focused }) => (
                                <CustomTabLabel focused={focused} label="Cài đặt" />
                            ),
                            tabBarLabelStyle: { color: "#008E97" },
                            headerShown: false,
                            tabBarIcon: ({ focused }) =>
                                focused ? (
                                    <Entypo name="cog" size={24} color="#008B45" />
                                ) : (
                                    <Entypo name="cog" size={24} color="#696969" />
                                ),
                        }}
                    />

                </Tab.Navigator>
            </KeyboardAvoidingView>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                }}
            >
                <Stack.Screen name="Splash" component={SplashScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Verification" component={VerificationScreen} />
                <Stack.Screen name='ForgotPassword' component={ForgotPasswordScreen} />
                <Stack.Screen name='ForgotPasswordVerification' component={ForgotPasswordVerificationScreen} />
                <Stack.Screen name='Settings' component={SettingScreen} />
                <Stack.Screen name='Report' component={ReportScreen} />
                <Stack.Screen name='Plan' component={PlanScreen} />
                <Stack.Screen name='CategoryTabView' component={CategoryTabView} />
                <Stack.Screen name='IncomeCategoryHome' component={IncomeCategoryHome} />
                <Stack.Screen name='ExpenseCategoryHome' component={ExpenseCategoryHome} />
                <Stack.Screen name='AddIncomeCategory' component={AddIncomeCategoryScreen} />
                <Stack.Screen name='AddExpenseCategory' component={AddExpenseCategoryScreen} />
                <Stack.Screen name='EditIncomeCategory' component={EditIncomeCategoryScreen} />
                <Stack.Screen name='EditExpenseCategory' component={EditExpenseCategoryScreen} />
                <Stack.Screen name='EditIncome' component={EditIncomeScreen} />
                <Stack.Screen name='EditExpense' component={EditExpenseScreen} />
                <Stack.Screen name='DetailReport' component={DetailReportScreen} />
                <Stack.Screen name='DetailReportYear' component={DetailReportYearScreen} />
                <Stack.Screen name='BottomTabs' component={BottomTab} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default StackNavigation;