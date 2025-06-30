import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Route, TrendingDown, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { ExcelData, ColumnMapping as ColumnMappingType, Address, OptimizedRoute } from '../types';
import { optimizeRoute, generateGoogleMapsUrl } from '../utils/routeOptimizer';
import { MapView } from './MapView';

interface RouteOptimizationProps {
  data: ExcelData;
  mapping: ColumnMappingType;
  onBack: () => void;
}

export const RouteOptimization: React.FC<RouteOptimizationProps> = ({ 
  data, 
  mapping, 
  onBack 
}) => {
  const [isOptimizing, setIsOptimizing] = useState(true);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Preparing addresses...');
  const [progressSteps, setProgressSteps] = useState({
    preparing: false,
    geocoding: false,
    optimizing: false,
    complete: false
  });

  useEffect(() => {
    const performOptimization = async () => {
      try {
        setIsOptimizing(true);
        setError(null);

        // Step 1: Prepare addresses
        setProgress('Preparing addresses...');
        setProgressSteps(prev => ({ ...prev, preparing: true }));
        
        const addresses: Address[] = data.rows
          .filter(row => row[mapping.addressColumn] && row[mapping.addressColumn].trim())
          .map((row, index) => ({
            id: `addr-${index}`,
            original: row[mapping.addressColumn].trim(),
          }));

        if (addresses.length === 0) {
          throw new Error('No valid addresses found in the selected column');
        }

        if (addresses.length > 25) {
          throw new Error('Too many addresses. Please limit to 25 addresses for optimal performance.');
        }

        // Step 2: Geocoding
        setProgress(`Geocoding ${addresses.length} addresses using Google Maps API...`);
        setProgressSteps(prev => ({ ...prev, geocoding: true }));
        
        // Step 3: Route optimization
        setProgress('Calculating optimal route...');
        setProgressSteps(prev => ({ ...prev, optimizing: true }));
        
        const result = await optimizeRoute(addresses);
        
        // Step 4: Complete
        setProgress('Route optimization complete!');
        setProgressSteps(prev => ({ ...prev, complete: true }));
        
        setOptimizedRoute(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Optimization failed');
      } finally {
        setIsOptimizing(false);
      }
    };

    performOptimization();
  }, [data, mapping]);

  const openInGoogleMaps = () => {
    if (optimizedRoute) {
      const url = generateGoogleMapsUrl(optimizedRoute);
      window.open(url, '_blank');
    }
  };

  if (isOptimizing) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 relative">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Optimizing Your Route
              </h2>
              <p className="text-gray-600 mb-4">
                {progress}
              </p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.preparing ? 'text-green-600' : 'text-gray-500'
              }`}>
                {progressSteps.preparing ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Processing addresses</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.geocoding ? 'text-green-600' : progressSteps.preparing ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {progressSteps.geocoding ? <CheckCircle className="w-4 h-4" /> : progressSteps.preparing ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Geocoding with Google Maps API</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.optimizing ? 'text-green-600' : progressSteps.geocoding ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {progressSteps.optimizing ? <CheckCircle className="w-4 h-4" /> : progressSteps.geocoding ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Calculating optimal route</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.complete ? 'text-green-600' : 'text-gray-500'
              }`}>
                {progressSteps.complete ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Finalizing results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Optimization Failed</h2>
            <p className="text-red-600">{error}</p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Ensure addresses are properly formatted</p>
              <p>• Check that addresses include city/state information</p>
              <p>• Limit to 25 addresses for best performance</p>
              <p>• Verify your Google Maps API key is valid</p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!optimizedRoute) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Optimized Route</h2>
            <p className="text-gray-600">Your most efficient delivery path powered by Google Maps</p>
          </div>
          
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Start Over
            </button>
            <button
              onClick={openInGoogleMaps}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Maps</span>
            </button>
          </div>
        </div>

        {/* Route Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <Route className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Distance</p>
                <p className="text-2xl font-bold text-blue-900">
                  {optimizedRoute.totalDistance} km
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Estimated Time</p>
                <p className="text-2xl font-bold text-green-900">
                  {optimizedRoute.totalTime}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrendingDown className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Distance Saved</p>
                <p className="text-2xl font-bold text-orange-900">
                  {optimizedRoute.savings.distance.toFixed(1)} km
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Route Visualization</h3>
        <MapView 
          addresses={optimizedRoute.geocodedAddresses || []}
          route={optimizedRoute.optimizedAddresses || []}
        />
        <p className="text-sm text-gray-500 mt-4 text-center">
          Interactive map showing your optimized route with numbered stops • Powered by Google Maps geocoding
        </p>
      </div>

      {/* Route Steps */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Route Details</h3>
        
        <div className="space-y-4">
          {optimizedRoute.stops.map((stop, index) => (
            <div
              key={stop.address.id}
              className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-green-600' : 
                  index === optimizedRoute.stops.length - 1 ? 'bg-red-600' : 
                  'bg-blue-600'
                }`}>
                  {stop.order}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {index === 0 ? 'Start: ' : index === optimizedRoute.stops.length - 1 ? 'End: ' : ''}
                  {stop.address.original}
                </p>
                {stop.address.formatted && (
                  <p className="text-sm text-gray-500 truncate">
                    {stop.address.formatted}
                  </p>
                )}
                {stop.distance && stop.distance > 0 && (
                  <p className="text-sm text-gray-500">
                    {stop.distance.toFixed(1)} km from previous • {stop.estimatedTime}
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0">
                <MapPin className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};