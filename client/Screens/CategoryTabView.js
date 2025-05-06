import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import React, { useState, useEffect, useRef } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import IncomeCategoryHome from './IncomeCategoryHome';
import ExpenseCategoryHome from './ExpenseCategoryHome';

const CategoryTabView = ({ route }) => {
    const navigation = useNavigation();
    const initialIndex = route.params?.initialIndex || 0;

    const [index, setIndex] = useState(initialIndex);
    const [routes] = useState([
        { key: 'income', title: 'Thu nhập' },
        { key: 'expense', title: 'Chi tiêu' },
    ]);

    const scaleValue = useRef(new Animated.Value(1)).current; 

    const translateValue = useRef(new Animated.Value(0)).current; 

    useEffect(() => {
        setIndex(initialIndex); 
    }, [initialIndex]);

    const handleBack = () => {
        navigation.goBack();
    }

    const renderScene = SceneMap({
        income: IncomeCategoryHome,
        expense: ExpenseCategoryHome,
    });

    const handleAdd = () => {
        if (index === 0) {
            navigation.navigate('AddIncomeCategory');
        }
        if (index === 1) {
            navigation.navigate('AddExpenseCategory');
        }
    }

    const animateAddButton = () => {
        Animated.sequence([
            Animated.spring(scaleValue, {
                toValue: 1.2,
                friction: 3,
                useNativeDriver: true,
            }),
            Animated.spring(scaleValue, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateTabChange = (index) => {
        Animated.timing(translateValue, {
            toValue: index === 0 ? 0 : -300, 
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    useEffect(() => {
        animateTabChange(index); 
    }, [index]);

    const renderTabBar = props => (
        <View style={styles.tabContainer}>
            {props.navigationState.routes.map((route, i) => {
                const isActive = index === i;
                return (
                    <TouchableOpacity
                        key={i}
                        style={[styles.tabButton, isActive && styles.activeTab]}
                        onPress={() => setIndex(i)}
                    >
                        <Animated.View
                            style={[
                                styles.tabButtonContent,
                                isActive && styles.activeTabContent,
                            ]}
                        >
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                {route.title}
                            </Text>
                        </Animated.View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );


    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={30} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Danh mục</Text>
                <TouchableOpacity
                    onPress={() => {
                        handleAdd(); 
                        animateAddButton();
                    }}
                >
                    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                        <MaterialIcons name="add" size={30} color="black" />
                    </Animated.View>
                </TouchableOpacity>
            </View>

  
            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                renderTabBar={renderTabBar}
            />
        </SafeAreaView>
    );
};

export default CategoryTabView;

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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
    },
    tabBar: {
        backgroundColor: '#333333',
        marginTop: 10,
        marginHorizontal: 70,
        borderRadius: 30,
        paddingVertical: 5,
        justifyContent: 'center',
        alignItems: 'center',
        height: 45,
    },
    tabBarLabel: {
        color: 'white',
        fontSize: 16,
    },
    tabBarIndicator: {
        backgroundColor: '#008B45',
        height: 4,
        borderRadius: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        marginTop: 5,
        width: '70%', 
        alignSelf: 'center', 
        backgroundColor: '#CCCCCC',
        padding: 4,
        borderRadius: 20, 
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
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
    activeTabContent: {
        transform: [{ scale: 1.05 }],
    },
    tabText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
});
