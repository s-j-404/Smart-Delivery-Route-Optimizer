import React, { useState } from 'react';
import { Truck, Bike, Car, Package, Fuel, ArrowRight, Scale } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleSetupProps {
  onVehicleSetup: (vehicle: Vehicle) => void;
}

const vehicleTypes = [
  {
    type: 'bike' as const,
    name: 'Motorcycle/Bike',
    icon: Bike,
    maxWeight: 15,
    maxVolume: 0.1,
    fuelEfficiency: 40,
    description: 'Fast delivery for small packages'
  },
  {
    type: 'scooter' as const,
    name: 'Scooter',
    icon: Bike,
    maxWeight: 25,
    maxVolume: 0.15,
    fuelEfficiency: 35,
    description: 'Balanced speed and capacity'
  },
  {
    type: 'car' as const,
    name: 'Car',
    icon: Car,
    maxWeight: 100,
    maxVolume: 0.5,
    fuelEfficiency: 15,
    description: 'Medium capacity deliveries'
  },
  {
    type: 'van' as const,
    name: 'Van',
    icon: Truck,
    maxWeight: 500,
    maxVolume: 2.0,
    fuelEfficiency: 10,
    description: 'Large capacity deliveries'
  }
];

export const VehicleSetup: React.FC<VehicleSetupProps> = ({ onVehicleSetup }) => {
  const [selectedType, setSelectedType] = useState<Vehicle['type'] | null>(null);
  const [customSettings, setCustomSettings] = useState({
    maxWeight: 0,
    maxVolume: 0,
    fuelEfficiency: 0,
    currentLoad: 0
  });

  const handleVehicleSelect = (vehicleType: typeof vehicleTypes[0]) => {
    setSelectedType(vehicleType.type);
    setCustomSettings({
      maxWeight: vehicleType.maxWeight,
      maxVolume: vehicleType.maxVolume,
      fuelEfficiency: vehicleType.fuelEfficiency,
      currentLoad: 0
    });
  };

  const handleSubmit = () => {
    if (selectedType) {
      const vehicle: Vehicle = {
        id: `vehicle-${Date.now()}`,
        type: selectedType,
        maxWeight: customSettings.maxWeight,
        maxVolume: customSettings.maxVolume,
        fuelEfficiency: customSettings.fuelEfficiency,
        currentLoad: customSettings.currentLoad
      };
      onVehicleSetup(vehicle);
    }
  };

  const isValid = selectedType && customSettings.maxWeight > 0 && customSettings.fuelEfficiency > 0;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Setup Your Delivery Vehicle</h2>
          <p className="text-gray-600">
            Configure your vehicle specifications for accurate route optimization and load management
          </p>
        </div>

        {/* Vehicle Type Selection */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Vehicle Type</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicleTypes.map((vehicle) => {
              const VehicleIcon = vehicle.icon;
              const isSelected = selectedType === vehicle.type;
              
              return (
                <button
                  key={vehicle.type}
                  onClick={() => handleVehicleSelect(vehicle)}
                  className={`
                    p-6 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}
                    `}>
                      <VehicleIcon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900">{vehicle.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{vehicle.description}</p>
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        <div>Max: {vehicle.maxWeight}kg</div>
                        <div>{vehicle.fuelEfficiency} km/L</div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Settings */}
        {selectedType && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Specifications</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scale className="w-4 h-4 inline mr-1" />
                  Max Weight (kg)
                </label>
                <input
                  type="number"
                  value={customSettings.maxWeight}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    maxWeight: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Max Volume (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={customSettings.maxVolume}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    maxVolume: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Fuel className="w-4 h-4 inline mr-1" />
                  Fuel Efficiency (km/L)
                </label>
                <input
                  type="number"
                  value={customSettings.fuelEfficiency}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    fuelEfficiency: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4 inline mr-1" />
                  Current Load (kg)
                </label>
                <input
                  type="number"
                  value={customSettings.currentLoad}
                  onChange={(e) => setCustomSettings(prev => ({ 
                    ...prev, 
                    currentLoad: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max={customSettings.maxWeight}
                />
              </div>
            </div>

            {/* Load Utilization Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Load Utilization</span>
                <span>{Math.round((customSettings.currentLoad / customSettings.maxWeight) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((customSettings.currentLoad / customSettings.maxWeight) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Summary */}
        {selectedType && (
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Vehicle Summary</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  Capacity: {customSettings.maxWeight - customSettings.currentLoad}kg available
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Fuel className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  Efficiency: {customSettings.fuelEfficiency} km/L
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="text-blue-800">
                  Volume: {customSettings.maxVolume}m³
                </span>
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
            <span>Optimize Delivery Route</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};