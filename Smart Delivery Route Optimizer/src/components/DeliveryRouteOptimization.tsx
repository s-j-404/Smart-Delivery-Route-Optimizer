import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Route, TrendingDown, ExternalLink, AlertTriangle, 
  CheckCircle, Truck, Fuel, Package, Phone, User, DollarSign,
  Navigation, Timer, Scale
} from 'lucide-react';
import { ExcelData, DeliveryColumnMapping as ColumnMappingType, DeliveryAddress, OptimizedDeliveryRoute, Vehicle } from '../types';
import { optimizeDeliveryRoute, generateGoogleMapsUrl } from '../utils/deliveryRouteOptimizer';
import { MapView } from './MapView';

interface DeliveryRouteOptimizationProps {
  data: ExcelData;
  mapping: ColumnMappingType;
  vehicle: Vehicle;
  onBack: () => void;
}

export const DeliveryRouteOptimization: React.FC<DeliveryRouteOptimizationProps> = ({ 
  data, 
  mapping, 
  vehicle,
  onBack 
}) => {
  const [isOptimizing, setIsOptimizing] = useState(true);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedDeliveryRoute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('Preparing delivery addresses...');
  const [progressSteps, setProgressSteps] = useState({
    preparing: false,
    geocoding: false,
    traffic: false,
    optimizing: false,
    complete: false
  });

  useEffect(() => {
    const performOptimization = async () => {
      try {
        setIsOptimizing(true);
        setError(null);

        // Step 1: Prepare addresses
        setProgress('Preparing delivery addresses...');
        setProgressSteps(prev => ({ ...prev, preparing: true }));
        
        const addresses: DeliveryAddress[] = data.rows
          .filter(row => row[mapping.addressColumn] && row[mapping.addressColumn].trim())
          .map((row, index) => {
            const priority = mapping.priorityColumn !== undefined ? 
              row[mapping.priorityColumn]?.toLowerCase() : 'medium';
            
            let normalizedPriority: DeliveryAddress['priority'] = 'medium';
            if (['urgent', 'high', 'rush', 'emergency'].some(p => priority?.includes(p))) {
              normalizedPriority = 'urgent';
            } else if (['high', 'important'].some(p => priority?.includes(p))) {
              normalizedPriority = 'high';
            } else if (['low', 'normal'].some(p => priority?.includes(p))) {
              normalizedPriority = 'low';
            }

            const timeWindow = mapping.timeWindowColumn !== undefined ? 
              row[mapping.timeWindowColumn] : undefined;
            
            let parsedTimeWindow: DeliveryAddress['timeWindow'] | undefined;
            if (timeWindow && timeWindow.includes('-')) {
              const [start, end] = timeWindow.split('-').map(t => t.trim());
              if (start && end) {
                parsedTimeWindow = { start, end };
              }
            }

            return {
              id: `delivery-${index}`,
              original: row[mapping.addressColumn].trim(),
              customerName: mapping.customerNameColumn !== undefined ? 
                row[mapping.customerNameColumn] : undefined,
              phoneNumber: mapping.phoneColumn !== undefined ? 
                row[mapping.phoneColumn] : undefined,
              priority: normalizedPriority,
              timeWindow: parsedTimeWindow,
              packageWeight: mapping.weightColumn !== undefined ? 
                parseFloat(row[mapping.weightColumn]) || 1 : 1,
              packageSize: mapping.sizeColumn !== undefined ? 
                row[mapping.sizeColumn] as DeliveryAddress['packageSize'] : 'medium',
              deliveryNotes: mapping.notesColumn !== undefined ? 
                row[mapping.notesColumn] : undefined,
              cashOnDelivery: mapping.codColumn !== undefined ? 
                parseFloat(row[mapping.codColumn]) || 0 : 0,
              estimatedDeliveryTime: 5 // Default 5 minutes per delivery
            };
          });

        if (addresses.length === 0) {
          throw new Error('No valid delivery addresses found in the selected column');
        }

        if (addresses.length > 25) {
          throw new Error('Too many addresses. Please limit to 25 deliveries for optimal performance.');
        }

        // Step 2: Geocoding
        setProgress(`Geocoding ${addresses.length} delivery addresses...`);
        setProgressSteps(prev => ({ ...prev, geocoding: true }));
        
        // Step 3: Traffic analysis
        setProgress('Analyzing real-time traffic conditions...');
        setProgressSteps(prev => ({ ...prev, traffic: true }));
        
        // Step 4: Route optimization
        setProgress('Optimizing delivery route with priorities and vehicle constraints...');
        setProgressSteps(prev => ({ ...prev, optimizing: true }));
        
        const result = await optimizeDeliveryRoute(addresses, vehicle);
        
        // Step 5: Complete
        setProgress('Delivery route optimization complete!');
        setProgressSteps(prev => ({ ...prev, complete: true }));
        
        setOptimizedRoute(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Optimization failed');
      } finally {
        setIsOptimizing(false);
      }
    };

    performOptimization();
  }, [data, mapping, vehicle]);

  const openInGoogleMaps = () => {
    if (optimizedRoute) {
      const url = generateGoogleMapsUrl(optimizedRoute);
      window.open(url, '_blank');
    }
  };

  const getPriorityColor = (priority: DeliveryAddress['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-blue-600 bg-blue-100';
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Optimizing Your Delivery Route
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
                <span>Processing delivery addresses</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.geocoding ? 'text-green-600' : progressSteps.preparing ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {progressSteps.geocoding ? <CheckCircle className="w-4 h-4" /> : progressSteps.preparing ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Geocoding with Google Maps API</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.traffic ? 'text-green-600' : progressSteps.geocoding ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {progressSteps.traffic ? <CheckCircle className="w-4 h-4" /> : progressSteps.geocoding ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Analyzing real-time traffic</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.optimizing ? 'text-green-600' : progressSteps.traffic ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {progressSteps.optimizing ? <CheckCircle className="w-4 h-4" /> : progressSteps.traffic ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Optimizing route with priorities</span>
              </div>
              <div className={`flex items-center justify-center space-x-2 ${
                progressSteps.complete ? 'text-green-600' : 'text-gray-500'
              }`}>
                {progressSteps.complete ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>}
                <span>Finalizing delivery plan</span>
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
              <p>• Ensure delivery addresses are properly formatted</p>
              <p>• Check that addresses include city/state information</p>
              <p>• Limit to 25 deliveries for best performance</p>
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
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Optimized Delivery Route</h2>
            <p className="text-gray-600">Smart route planning with real-time traffic and priority optimization</p>
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
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in Google Maps</span>
            </button>
          </div>
        </div>

        {/* Route Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
                <p className="text-sm text-green-600 font-medium">Time w/ Traffic</p>
                <p className="text-2xl font-bold text-green-900">
                  {Math.round(optimizedRoute.totalTimeWithTraffic)} min
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <Fuel className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Fuel Cost</p>
                <p className="text-2xl font-bold text-orange-900">
                  ${optimizedRoute.fuelCost}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center space-x-3">
              <Scale className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Load Usage</p>
                <p className="text-2xl font-bold text-purple-900">
                  {optimizedRoute.loadUtilization}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Impact */}
        {optimizedRoute.trafficImpact.delayMinutes > 0 && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Timer className="w-5 h-5 text-yellow-600" />
              <div>
                <h4 className="font-medium text-yellow-800">Traffic Impact</h4>
                <p className="text-yellow-700 text-sm">
                  Current traffic adds {optimizedRoute.trafficImpact.delayMinutes} minutes to your route. 
                  {optimizedRoute.trafficImpact.alternativeRoutes > 0 && 
                    ` ${optimizedRoute.trafficImpact.alternativeRoutes} alternative routes available.`
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {optimizedRoute.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Optimization Recommendations</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              {optimizedRoute.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Route Visualization</h3>
        <MapView 
          addresses={optimizedRoute.stops.map(stop => ({
            ...stop.address,
            id: stop.address.id,
            original: stop.address.original,
            formatted: stop.address.formatted,
            coordinates: stop.address.coordinates
          }))}
          route={optimizedRoute.stops.map(stop => ({
            ...stop.address,
            id: stop.address.id,
            original: stop.address.original,
            formatted: stop.address.formatted,
            coordinates: stop.address.coordinates
          }))}
        />
        <p className="text-sm text-gray-500 mt-4 text-center">
          Interactive map showing your optimized delivery route with real-time traffic consideration
        </p>
      </div>

      {/* Delivery Schedule */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Delivery Schedule</h3>
        
        <div className="space-y-4">
          {optimizedRoute.stops.map((stop, index) => (
            <div
              key={stop.address.id}
              className="flex items-start space-x-4 p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-green-600' : 
                  index === optimizedRoute.stops.length - 1 ? 'bg-red-600' : 
                  'bg-blue-600'
                }`}>
                  {stop.order}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {stop.address.customerName || `Stop ${stop.order}`}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(stop.address.priority)}`}>
                        {stop.address.priority}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{stop.address.original}</p>
                    
                    {stop.address.formatted && (
                      <p className="text-sm text-gray-500 mb-2">{stop.address.formatted}</p>
                    )}
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>ETA: {stop.estimatedArrival}</span>
                      </div>
                      
                      {stop.address.phoneNumber && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>{stop.address.phoneNumber}</span>
                        </div>
                      )}
                      
                      {stop.address.packageWeight && (
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{stop.address.packageWeight}kg</span>
                        </div>
                      )}
                      
                      {stop.address.cashOnDelivery && stop.address.cashOnDelivery > 0 && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>COD: ${stop.address.cashOnDelivery}</span>
                        </div>
                      )}
                    </div>
                    
                    {stop.address.timeWindow && (
                      <div className="mt-2 text-sm text-blue-600">
                        Preferred: {stop.address.timeWindow.start} - {stop.address.timeWindow.end}
                      </div>
                    )}
                    
                    {stop.address.deliveryNotes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        Note: {stop.address.deliveryNotes}
                      </div>
                    )}
                    
                    {stop.trafficDelay && stop.trafficDelay > 0 && (
                      <div className="mt-2 text-sm text-orange-600">
                        Traffic delay: +{Math.round(stop.trafficDelay)} min
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0 text-right text-sm text-gray-500">
                    {index > 0 && (
                      <div>
                        <div>{stop.cumulativeDistance.toFixed(1)} km total</div>
                        <div>{Math.round(stop.cumulativeTime)} min total</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};