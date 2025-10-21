import React, { useState, useEffect } from 'react';
import { TextInput, StyleSheet } from 'react-native';

const formatCurrency = (amount) => {
  if (!amount) return ''; 
  return parseInt(amount, 10)
    .toLocaleString('vi-VN') 
    .replaceAll(',', '.'); 
};

const CategoryAmountInput = ({ categoryId, value, onChange }) => {
  const [formattedValue, setFormattedValue] = useState(''); 
  const [rawValue, setRawValue] = useState(''); 

  useEffect(() => {
    const numericValue = value ? value.replace(/\D/g, '') : '';
    setRawValue(numericValue);
    setFormattedValue(formatCurrency(numericValue));
  }, [value]);

  const handleAmountChange = (text) => {
    const numericValue = text.replace(/\D/g, '');

    const formatted = formatCurrency(numericValue);

    setRawValue(numericValue);
    setFormattedValue(formatted);
    onChange(numericValue, categoryId);
  };

  return (
    <TextInput
      style={styles.amountInput}
      value={formattedValue} 
      onChangeText={handleAmountChange} 
      keyboardType="numeric" 
      placeholder="Nhập số tiền"
      placeholderTextColor="#888"
    />
  );
};


const styles = StyleSheet.create({
  amountInput: {
    width: 150,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginLeft: 10,
    color: '#000000',
    fontWeight: 'bold',
  },
});

export default CategoryAmountInput;
