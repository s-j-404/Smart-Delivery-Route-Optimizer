import * as XLSX from 'xlsx';
import { ExcelData } from '../types';

export const parseExcelFile = (file: File): Promise<ExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        const headers = jsonData[0] || [];
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
        
        resolve({
          headers,
          rows,
          fileName: file.name
        });
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const detectDeliveryColumns = (headers: string[]): {[key: string]: number[]} => {
  const detectionRules = {
    address: ['address', 'addr', 'location', 'street', 'place', 'destination', 'delivery address'],
    customerName: ['name', 'customer', 'client', 'recipient', 'customer name', 'receiver'],
    phone: ['phone', 'mobile', 'contact', 'number', 'tel', 'telephone', 'cell'],
    priority: ['priority', 'urgent', 'importance', 'level', 'rush'],
    timeWindow: ['time', 'window', 'delivery time', 'preferred time', 'schedule'],
    weight: ['weight', 'kg', 'mass', 'heavy'],
    size: ['size', 'dimension', 'volume', 'small', 'medium', 'large'],
    notes: ['notes', 'comment', 'instruction', 'remark', 'special'],
    cod: ['cod', 'cash', 'payment', 'amount', 'money', 'collect']
  };
  
  const results: {[key: string]: number[]} = {};
  
  Object.entries(detectionRules).forEach(([category, keywords]) => {
    const matches = headers
      .map((header, index) => ({
        index,
        score: keywords.reduce((score, keyword) => {
          return score + (header.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
        }, 0)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.index);
    
    if (matches.length > 0) {
      results[category] = matches;
    }
  });
  
  return results;
};