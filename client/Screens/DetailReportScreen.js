import { StyleSheet, Text, View, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const DetailReportScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { item, filteredData, type } = route.params;

  const spentAmount = filteredData.reduce((total, detail) => total + detail.amount, 0);
  const remainingAmount = item.amount ? item.amount - spentAmount : -spentAmount;
  const incomeRemainingAmount = item.amount ? spentAmount - item.amount : spentAmount;

  const parseDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return new Date(year, month - 1, day);
  };

  const sortedFilteredData = [...filteredData].sort((a, b) => parseDate(b.date) - parseDate(a.date));

  const groupedItems = sortedFilteredData.reduce((acc, detail) => {
    const date = detail.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(detail);
    return acc;
  }, {});

  const listData = Object.keys(groupedItems).map((date) => ({ date, items: groupedItems[date] }));

  const renderDateGroup = ({ item }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemDateContainer}>
        <Text style={styles.listItemDate}>{item.date}</Text>
      </View>
      {item.items.map((detail, detailIndex) => (
        <View key={detailIndex} style={styles.listItemContent}>
          <Ionicons name={detail.category_icon} size={30} color={detail.category_color} style={styles.listItemIcon} />
          <View style={styles.listItemTextContainer}>
            <Text style={styles.listItemName}>{detail.category_name}</Text>
            <Text style={styles.listItemNotes}>({detail.description || 'Không có ghi chú'})</Text>
          </View>
          <Text style={[styles.listItemAmount, { color: type === 'Expense' ? '#FF0000' : '#008B45' }]}>
            {detail.amount === 0 ? '0' : (type === 'Expense' ? '-' : '+')}{detail.amount.toLocaleString('vi-VN')}
          </Text>
        </View>
      ))}
    </View>
  );

  const month = filteredData.length > 0 ? filteredData[0].date.split('-')[1] : new Date().getMonth() + 1;
  const year = filteredData.length > 0 ? filteredData[0].date.split('-')[2] : new Date().getFullYear();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={30} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerText}>
          {item.category_name} - {month}/{year}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.bodyItem}>
          <Text style={styles.bodyItemLabel}>{type === 'Expense' ? 'Đã tiêu:' : 'Đã thu:'}</Text>
          <Text style={[styles.bodyItemValue, { color: type === 'Expense' ? '#FF0000' : '#008B45' }]}>
            {spentAmount === 0 ? '0' : `${type === 'Expense' ? '-' : '+'}${spentAmount.toLocaleString('vi-VN')}`}
          </Text>
        </View>
        <View style={styles.bodyItem}>
          <Text style={styles.bodyItemLabel}>Kế hoạch:</Text>
          <Text style={styles.bodyItemValue}>
            {item.amount === 0 ? '0' : item.amount.toLocaleString('vi-VN')}
          </Text>
        </View>
        <View style={styles.bodyItem}>
          <Text style={styles.bodyTotalLabel}>
            {type === 'Expense' && remainingAmount < 0 ? 'Chi tiêu vượt ngân sách' : 
             type === 'Income' && incomeRemainingAmount > 0 ? 'Thu nhập vượt kế hoạch' : 
             type === 'Income' && incomeRemainingAmount < 0 ? 'Mục tiêu còn thiếu' : 'Còn lại:'}
          </Text>
          <Text style={[styles.bodyTotalValue, { color: type === 'Expense' ? (remainingAmount < 0 ? '#FF0000' : '#008B45') : (incomeRemainingAmount < 0 ? '#FF0000' : '#008B45') }]}>
            {type === 'Expense' ? 
              (remainingAmount === 0 ? '0' : `${remainingAmount < 0 ? '-' : '+'}${Math.abs(remainingAmount).toLocaleString('vi-VN')}`) : 
              (incomeRemainingAmount === 0 ? '0' : `${incomeRemainingAmount < 0 ? '-' : '+'}${Math.abs(incomeRemainingAmount).toLocaleString('vi-VN')}`)
            }
          </Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={listData}
          renderItem={renderDateGroup}
          keyExtractor={(item) => item.date}
        />
      </View>
      
    </View>
  );
};

export default DetailReportScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20, 
    justifyContent: 'space-between',
    borderBottomWidth: 1, 
    borderBottomColor: '#CCCCCC', 
    
  },
  backButton: {
    padding: 10, 
  },
  headerText: {
    color: '#000000',
    fontSize: 20, 
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  planValue: {
    color: '#000000',
    fontSize: 18,
  },
  body: {
    width: '90%',
    backgroundColor: '#DDDDDD',
    alignSelf: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  bodyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bodyItemLabel: {
    color: '#000000',
    fontSize: 16,
  },
  bodyItemValue: {
    color: '#000000',
    fontSize: 16,
  },
  bodyTotalLabel: {
    color: '#000000',
    fontSize: 16,
  },
  bodyTotalValue: {
    color: '#000000',
    fontSize: 18,
  },
  listContainer: {
    width: '90%',
    marginTop: 20,
    flex: 1,
    paddingBottom: 20,
    alignSelf: 'center', 
  },
  listItem: {
    marginBottom: 10,
  },
  listItemDateContainer: {
    marginBottom: 5,
  },
  listItemDate: {
    color: '#000000',
    fontSize: 14,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10,
    borderRadius: 10,
    flex: 1,
    marginBottom: 5,
  },
  listItemIcon: {
    marginRight: 10,
  },
  listItemTextContainer: {
    flex: 1,
  },
  listItemName: {
    color: '#000000',
    fontSize: 16,
  },
  listItemNotes: {
    color: '#000000',
    fontSize: 12,
  },
  listItemAmount: {
    color: '#000000',
    fontSize: 16,
  },
});