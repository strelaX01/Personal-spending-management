import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { BarChart } from "react-native-gifted-charts";
import { Dimensions } from "react-native";

const DetailReportYearScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { item, filteredData, type } = route.params;


  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    amount: 0,
  }));

filteredData.forEach((data, idx) => {
  let dateStr = data.date || "2025-01-01"; 
  const parts = dateStr.split("-");
  if (parts.length < 2) {
    return;
  }

  const month = parseInt(parts[1], 10);
  if (!isNaN(month) && month >= 1 && month <= 12) {
    const amount = type === "Expense" ? -data.amount : data.amount;
    months[month - 1].amount += amount;
  }
});


  const chartData = months.map((m) => ({
    value: type === "Expense" ? -m.amount : m.amount,
    label: `T${m.month}`,
    frontColor: m.amount >= 0 ? "#008B45" : "red",
  }));



  const renderItem = ({ item }) => {
    let amountColor = "white";
    let amountText = item.amount.toLocaleString("vi-VN");

    if (item.amount < 0) {
      amountColor = "red";
    } else if (item.amount > 0) {
      amountColor = "#008B45";
      amountText = `+${amountText}`;
    }

    return (
      <View style={styles.itemContainer}>
        <View style={styles.monthContainer}>
          <Text style={styles.monthText}>Tháng {item.month}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountText, { color: amountColor }]}>
            {amountText}
          </Text>
        </View>
      </View>
    );
  };

  const totalAmount = months.reduce((total, m) => total + m.amount, 0);
  const totalAmountColor =
    totalAmount < 0 ? "red" : totalAmount > 0 ? "#008B45" : "white";
  const totalAmountText = totalAmount.toLocaleString("vi-VN");
  const totalAmountDisplay =
    totalAmount > 0 ? `+${totalAmountText}` : totalAmountText;

  const year =
    filteredData.length > 0 && filteredData[0].date
      ? filteredData[0].date.split("-")[0]
      : "";
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={30} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {item.category_name} năm {year}
        </Text>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={chartData}
            barWidth={30}
            noOfSections={5}
            maxValue={Math.max(...months.map((m) => Math.abs(m.amount)))}
            isAnimated
            yAxisThickness={0}
            xAxisThickness={2}
            width={Dimensions.get("window").width * 1.55}
          />
        </ScrollView>
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.totalText}>
          Tổng cộng:{" "}
          <Text style={{ color: totalAmountColor }}>{totalAmountDisplay}</Text>
        </Text>
        <Text style={styles.averageText}>
          Trung bình: {(totalAmount / months.length).toLocaleString("vi-VN")}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, marginTop: 10 }}
      >
        <FlatList
          data={months}
          renderItem={renderItem}
          keyExtractor={(item) => item.month.toString()}
          contentContainerStyle={styles.listViewContainer}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default DetailReportYearScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
  },
  backButton: {
    padding: 10,
  },
  headerText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  totalText: {
    color: "#000000",
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
  },
  averageText: {
    color: "#000000",
    fontSize: 16,
    textAlign: "center",
    marginVertical: 5,
  },
  bodyContainer: {
    padding: 15,
    backgroundColor: "#DDDDDD",
    borderRadius: 15,
    marginVertical: 10,
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
    padding: 10,
    backgroundColor: "#CCCCCC",
    borderRadius: 15,
  },
  monthContainer: {
    flex: 1,
  },
  amountContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  monthText: {
    fontSize: 16,
    color: "#000000",
  },
  amountText: {
    fontSize: 16,
    color: "#000000",
  },
  listViewContainer: {
    paddingHorizontal: 10,
  },
});
