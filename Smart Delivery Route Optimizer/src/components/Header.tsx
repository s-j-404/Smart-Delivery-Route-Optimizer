import React from 'react';
import { Truck, Zap, Clock, MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                DeliveryPro
              </h1>
              <p className="text-xs text-gray-500">Smart Route Optimizer</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Real-time Traffic</span>
            </div>
            {/* <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 rounded-full">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">AI Powered</span>
            </div> */}
          </div>
        </div>
      </div>
    </header>
  );
};