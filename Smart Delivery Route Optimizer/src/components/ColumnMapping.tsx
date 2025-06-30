import React, { useState, useEffect } from 'react';
import { MapPin, User, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { ExcelData, ColumnMapping as ColumnMappingType } from '../types';
import { detectAddressColumns } from '../utils/excelParser';

interface ColumnMappingProps {
  data: ExcelData;
  onMappingComplete: (mapping: ColumnMappingType) => void;
}

export const ColumnMapping: React.FC<ColumnMappingProps> = ({ data, onMappingComplete }) => {
  const [mapping, setMapping] = useState<ColumnMappingType>({
    addressColumn: -1
  });
  const [detectedColumns, setDetectedColumns] = useState<number[]>([]);

  useEffect(() => {
    const detected = detectAddressColumns(data.headers);
    setDetectedColumns(detected);
    
    if (detected.length > 0) {
      setMapping(prev => ({ ...prev, addressColumn: detected[0] }));
    }
  }, [data.headers]);

  const handleSubmit = () => {
    if (mapping.addressColumn >= 0) {
      onMappingComplete(mapping);
    }
  };

  const isValid = mapping.addressColumn >= 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Map Your Columns</h2>
          <p className="text-gray-600">
            Help us identify which columns contain your address data
          </p>
        </div>

        {/* File Preview */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Preview: {data.fileName}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {data.headers.map((header, index) => (
                    <th key={index} className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                      {header}
                      {detectedColumns.includes(index) && (
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
                      <td key={cellIndex} className="px-3 py-2 text-sm text-gray-600 max-w-32 truncate">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Showing first 3 rows • {data.rows.length} total rows
          </p>
        </div>

        {/* Column Mapping */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Address Column - Required */}
          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <span className="font-medium text-gray-900">
                  Address Column *
                </span>
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
                    {detectedColumns.includes(index) ? ' (detected)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Name Column - Optional */}
          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">
                  Name Column
                </span>
                <span className="text-sm text-gray-500">(optional)</span>
              </div>
              <select
                value={mapping.nameColumn || -1}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setMapping(prev => ({ 
                    ...prev, 
                    nameColumn: value >= 0 ? value : undefined 
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

          {/* Notes Column - Optional */}
          <div className="space-y-3">
            <label className="block">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">
                  Notes Column
                </span>
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
        {detectedColumns.length > 0 && (
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">AI Detection</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  We automatically detected potential address columns based on column names. 
                  Please verify the selections are correct.
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
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <span>Optimize Route</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};