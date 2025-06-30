import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProgressSteps } from './components/ProgressSteps';
import { FileUpload } from './components/FileUpload';
import { DeliveryColumnMapping } from './components/DeliveryColumnMapping';
import { VehicleSetup } from './components/VehicleSetup';
import { DeliveryRouteOptimization } from './components/DeliveryRouteOptimization';
import { ExcelData, DeliveryColumnMapping as ColumnMappingType, Vehicle } from './types';

function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingType | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  const handleFileProcessed = (data: ExcelData) => {
    setExcelData(data);
    setCurrentStep(2);
  };

  const handleMappingComplete = (mapping: ColumnMappingType) => {
    setColumnMapping(mapping);
    setCurrentStep(3);
  };

  const handleVehicleSetup = (vehicleData: Vehicle) => {
    setVehicle(vehicleData);
    setCurrentStep(4);
  };

  const handleBack = () => {
    setCurrentStep(1);
    setExcelData(null);
    setColumnMapping(null);
    setVehicle(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <ProgressSteps currentStep={currentStep} />
        
        <div className="flex justify-center">
          {currentStep === 1 && (
            <div className="w-full">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Smart Delivery Route Optimizer
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Upload your delivery list and let our AI create the most efficient route considering 
                  real-time traffic, delivery priorities, and vehicle capacity. Save time, fuel, and 
                  improve customer satisfaction.
                </p>
                <div className="flex justify-center space-x-8 mt-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time Traffic</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Priority Optimization</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Load Management</span>
                  </div>
                </div>
              </div>
              <FileUpload onFileProcessed={handleFileProcessed} />
            </div>
          )}
          
          {currentStep === 2 && excelData && (
            <DeliveryColumnMapping 
              data={excelData} 
              onMappingComplete={handleMappingComplete} 
            />
          )}
          
          {currentStep === 3 && (
            <VehicleSetup onVehicleSetup={handleVehicleSetup} />
          )}
          
          {currentStep === 4 && excelData && columnMapping && vehicle && (
            <DeliveryRouteOptimization 
              data={excelData} 
              mapping={columnMapping} 
              vehicle={vehicle}
              onBack={handleBack}
            />
          )}
        </div>
      </main>
      
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2025 DeliveryPro. Intelligent delivery route optimization.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;