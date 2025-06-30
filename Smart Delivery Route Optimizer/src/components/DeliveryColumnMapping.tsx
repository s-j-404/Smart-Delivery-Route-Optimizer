import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, Clock, Package, FileText, ArrowRight, Sparkles, AlertCircle, DollarSign } from 'lucide-react';
import { ExcelData, DeliveryColumnMapping as ColumnMappingType } from '../types';
import { detectDeliveryColumns } from '../utils/excelParser';

interface DeliveryColumnMappingProps {
  data: ExcelData;
  onMappingComplete: (mapping: ColumnMappingType) => void;
}

export const DeliveryColumnMapping: React.FC<DeliveryColumnMappingProps> = ({ data, onMappingComplete }) => {
  const [mapping, setMapping] = useState<ColumnMappingType>({
    addressColumn: -1
  });
  const [detectedColumns, setDetectedColumns] = useState<{[key: string]: number[]}>({});

  useEffect(() => {
    const detected = detectDeliveryColumns(data.headers);
    setDetectedColumns(detected);
    
    // Auto-select detected columns
    if (detected.address && detected.address.length > 0) {
      setMapping(prev => ({ ...prev, addressColumn: detected.address[0] }));
    }
    if (detected.customerName && detected.customerName.length > 0) {
      setMapping(prev => ({ ...prev, customerNameColumn: detected.customerName[0] }));
    }
    if (detected.phone && detected.phone.length > 0) {
      setMapping(prev => ({ ...prev, phoneColumn: detected.phone[0] }));
    }
    if (detected.priority && detected.priority.length > 0) {
      setMapping(prev => ({ ...prev, priorityColumn: detected.priority[0] }));
    }
  }, [data.headers]);

  const handleSubmit = () => {
    if (mapping.addressColumn >= 0) {
      onMappingComplete(mapping);
    }
  };

  const isValid = mapping.addressColumn >= 0;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Map Your Delivery Data</h2>
          <p className="text-gray-600">
            Help us identify which columns contain your delivery information for optimal route planning
          </p>
        </div>

        {/* File Preview */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Preview: {data.fileName}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {data.headers.map((header, index) => (
                    <th key={index} className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      {header}
                      {Object.values(detectedColumns).some(cols => cols.includes(index)) && (
                        <Sparkles className="inline w-4 h-4 ml-1 text-yellow-500" />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.slice(0, 3).map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-100">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-600 max-w-32 truncate">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Showing first 3 rows • {data.rows.length} total deliveries
          </p>
        </div>

        {/* Column Mapping Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Required Fields */}
          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <span className="font-medium text-gray-900">Delivery Address *</span>
              </div>
              <select
                value={mapping.addressColumn}
                onChange={(e) => setMapping(prev => ({ ...prev, addressColumn: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                    {detectedColumns.address?.includes(index) ? ' (detected)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">Customer Name</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.customerNameColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    customerNameColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                    {detectedColumns.customerName?.includes(index) ? ' (detected)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">Phone Number</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.phoneColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    phoneColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                    {detectedColumns.phone?.includes(index) ? ' (detected)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-900">Priority</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.priorityColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    priorityColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                    {detectedColumns.priority?.includes(index) ? ' (detected)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-900">Time Window</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.timeWindowColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    timeWindowColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-5 h-5 text-indigo-500" />
                <span className="font-medium text-gray-900">Package Weight</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.weightColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    weightColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <Package className="w-5 h-5 text-teal-500" />
                <span className="font-medium text-gray-900">Package Size</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.sizeColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    sizeColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="font-medium text-gray-900">Cash on Delivery</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.codColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    codColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Delivery Notes</span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.notesColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    notesColumn: value >= 0 ? value : undefined 
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={-1}>Select column...</option>
                {data.headers.map((header, index) => (
                  <option key={index} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* AI Detection Notice */}
        {Object.keys(detectedColumns).length > 0 && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">AI Column Detection</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  We automatically detected potential delivery data columns based on column names. 
                  Please verify the selections are correct for optimal route optimization.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`
              px-8 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200
              ${isValid
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <span>Setup Vehicle</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};