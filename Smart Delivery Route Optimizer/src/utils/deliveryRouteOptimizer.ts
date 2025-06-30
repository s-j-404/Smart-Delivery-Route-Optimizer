import { DeliveryAddress, Vehicle, DeliveryStop, OptimizedDeliveryRoute, TrafficData } from '../types';
import { geocodeAddresses } from './geocoding';

// Enhanced distance calculation with traffic consideration
const calculateDistanceWithTraffic = async (
  origin: DeliveryAddress, 
  destination: DeliveryAddress
): Promise<TrafficData> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || !origin.coordinates || !destination.coordinates) {
    // Fallback to Haversine formula
    const distance = calculateHaversineDistance(
      origin.coordinates?.lat || 0,
      origin.coordinates?.lng || 0,
      destination.coordinates?.lat || 0,
      destination.coordinates?.lng || 0
    );
    
    return {
      duration: Math.round(distance * 180), // Assume 20 km/h average speed
      durationInTraffic: Math.round(distance * 240), // Add 33% for traffic
      distance: distance * 1000, // Convert to meters
      trafficLevel: 'moderate' as const
    };
  }
  
  try {
    const originStr = `${origin.coordinates.lat},${origin.coordinates.lng}`;
    const destStr = `${destination.coordinates.lat},${destination.coordinates.lng}`;
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destStr}&departure_time=now&traffic_model=best_guess&units=metric&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Distance Matrix API failed');
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
      const element = data.rows[0].elements[0];
      const trafficRatio = element.duration_in_traffic ? 
        element.duration_in_traffic.value / element.duration.value : 1.2;
      
      let trafficLevel: TrafficData['trafficLevel'] = 'light';
      if (trafficRatio > 1.5) trafficLevel = 'severe';
      else if (trafficRatio > 1.3) trafficLevel = 'heavy';
      else if (trafficRatio > 1.1) trafficLevel = 'moderate';
      
      return {
        duration: element.duration.value,
        durationInTraffic: element.duration_in_traffic?.value || element.duration.value,
        distance: element.distance.value,
        trafficLevel
      };
    }
    
    throw new Error('No route found');
  } catch (error) {
    console.warn('Traffic API failed, using fallback:', error);
    // Fallback calculation
    const distance = calculateHaversineDistance(
      origin.coordinates.lat,
      origin.coordinates.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );
    
    return {
      duration: Math.round(distance * 180),
      durationInTraffic: Math.round(distance * 240),
      distance: distance * 1000,
      trafficLevel: 'moderate' as const
    };
  }
};

// Haversine formula for distance calculation
const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Priority-based scoring system
const calculatePriorityScore = (address: DeliveryAddress): number => {
  const priorityScores = {
    urgent: 100,
    high: 75,
    medium: 50,
    low: 25
  };
  
  let score = priorityScores[address.priority] || 50;
  
  // Time window bonus
  if (address.timeWindow) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = address.timeWindow.start.split(':').map(Number);
    const [endHour, endMin] = address.timeWindow.end.split(':').map(Number);
    const windowStart = startHour * 60 + startMin;
    const windowEnd = endHour * 60 + endMin;
    
    if (currentTime >= windowStart && currentTime <= windowEnd) {
      score += 25; // Bonus for current time window
    } else if (currentTime < windowStart) {
      const timeUntilWindow = windowStart - currentTime;
      score += Math.max(0, 15 - timeUntilWindow / 10); // Decreasing bonus as window approaches
    }
  }
  
  // COD bonus (higher priority for cash collection)
  if (address.cashOnDelivery && address.cashOnDelivery > 0) {
    score += Math.min(20, address.cashOnDelivery / 100);
  }
  
  return score;
};

// Advanced route optimization with multiple factors
const optimizeRouteAlgorithm = async (
  addresses: DeliveryAddress[], 
  vehicle: Vehicle
): Promise<DeliveryAddress[]> => {
  if (addresses.length <= 2) return addresses;
  
  // Sort by priority first
  const prioritySorted = [...addresses].sort((a, b) => 
    calculatePriorityScore(b) - calculatePriorityScore(a)
  );
  
  // Apply nearest neighbor with priority weighting
  const route = [prioritySorted[0]];
  const remaining = prioritySorted.slice(1);
  
  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let bestIndex = 0;
    let bestScore = -Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      
      if (!current.coordinates || !candidate.coordinates) continue;
      
      const distance = calculateHaversineDistance(
        current.coordinates.lat,
        current.coordinates.lng,
        candidate.coordinates.lat,
        candidate.coordinates.lng
      );
      
      const priorityScore = calculatePriorityScore(candidate);
      const distanceScore = Math.max(0, 50 - distance * 2); // Closer is better
      
      // Combined score: priority + proximity + time window
      const combinedScore = priorityScore * 0.6 + distanceScore * 0.4;
      
      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestIndex = i;
      }
    }
    
    route.push(remaining[bestIndex]);
    remaining.splice(bestIndex, 1);
  }
  
  return route;
};

// Load validation
const validateVehicleLoad = (addresses: DeliveryAddress[], vehicle: Vehicle): {
  canCarry: boolean;
  totalWeight: number;
  recommendations: string[];
} => {
  const totalWeight = addresses.reduce((sum, addr) => sum + (addr.packageWeight || 1), 0);
  const availableCapacity = vehicle.maxWeight - vehicle.currentLoad;
  const canCarry = totalWeight <= availableCapacity;
  
  const recommendations: string[] = [];
  
  if (!canCarry) {
    recommendations.push(`Overweight by ${(totalWeight - availableCapacity).toFixed(1)}kg`);
    recommendations.push('Consider multiple trips or larger vehicle');
  }
  
  if (totalWeight / availableCapacity > 0.9) {
    recommendations.push('Near capacity limit - plan for fuel efficiency');
  }
  
  return { canCarry, totalWeight, recommendations };
};

export const optimizeDeliveryRoute = async (
  addresses: DeliveryAddress[], 
  vehicle: Vehicle
): Promise<OptimizedDeliveryRoute> => {
  // Validate and prepare addresses
  const uniqueAddresses = addresses.filter((addr, index, self) => 
    index === self.findIndex(a => a.original.toLowerCase().trim() === addr.original.toLowerCase().trim())
  );
  
  if (uniqueAddresses.length === 0) {
    throw new Error('No valid delivery addresses provided');
  }
  
  // Geocode addresses
  const addressStrings = uniqueAddresses.map(addr => addr.original);
  const geocodingResults = await geocodeAddresses(addressStrings);
  
  const geocodedAddresses: DeliveryAddress[] = [];
  const failedAddresses: string[] = [];
  
  uniqueAddresses.forEach((address, index) => {
    const result = geocodingResults[index];
    if (result) {
      geocodedAddresses.push({
        ...address,
        coordinates: { lat: result.lat, lng: result.lng },
        formatted: result.formatted
      });
    } else {
      failedAddresses.push(address.original);
    }
  });
  
  if (geocodedAddresses.length === 0) {
    throw new Error('Could not geocode any delivery addresses. Please check the address format.');
  }
  
  // Validate vehicle load
  const loadValidation = validateVehicleLoad(geocodedAddresses, vehicle);
  
  // Optimize route
  const optimizedAddresses = await optimizeRouteAlgorithm(geocodedAddresses, vehicle);
  
  // Calculate detailed route metrics with traffic
  let totalDistance = 0;
  let totalTime = 0;
  let totalTimeWithTraffic = 0;
  let trafficDelayMinutes = 0;
  const stops: DeliveryStop[] = [];
  
  for (let i = 0; i < optimizedAddresses.length; i++) {
    const address = optimizedAddresses[i];
    let trafficData: TrafficData | null = null;
    
    if (i > 0) {
      trafficData = await calculateDistanceWithTraffic(
        optimizedAddresses[i - 1],
        address
      );
      
      totalDistance += trafficData.distance / 1000; // Convert to km
      totalTime += trafficData.duration / 60; // Convert to minutes
      totalTimeWithTraffic += trafficData.durationInTraffic / 60;
      trafficDelayMinutes += (trafficData.durationInTraffic - trafficData.duration) / 60;
    }
    
    const estimatedDeliveryTime = address.estimatedDeliveryTime || 5; // Default 5 minutes per delivery
    const cumulativeTime = totalTimeWithTraffic + (i * estimatedDeliveryTime);
    
    // Calculate estimated arrival time
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + cumulativeTime * 60000);
    
    stops.push({
      address,
      order: i + 1,
      estimatedArrival: arrivalTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      estimatedDuration: estimatedDeliveryTime,
      trafficDelay: trafficData ? (trafficData.durationInTraffic - trafficData.duration) / 60 : 0,
      cumulativeDistance: totalDistance,
      cumulativeTime: cumulativeTime
    });
  }
  
  // Calculate fuel cost
  const fuelPrice = 1.5; // Assume $1.5 per liter
  const fuelCost = (totalDistance / vehicle.fuelEfficiency) * fuelPrice;
  
  // Calculate priority score
  const priorityScore = optimizedAddresses.reduce((sum, addr) => 
    sum + calculatePriorityScore(addr), 0
  ) / optimizedAddresses.length;
  
  // Generate recommendations
  const recommendations: string[] = [...loadValidation.recommendations];
  
  if (trafficDelayMinutes > 30) {
    recommendations.push('Heavy traffic detected - consider alternative departure time');
  }
  
  if (stops.length > 15) {
    recommendations.push('Large delivery batch - consider splitting into multiple routes');
  }
  
  const urgentDeliveries = optimizedAddresses.filter(addr => addr.priority === 'urgent').length;
  if (urgentDeliveries > 0) {
    recommendations.push(`${urgentDeliveries} urgent deliveries - prioritized in route`);
  }
  
  return {
    stops,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime: Math.round(totalTime),
    totalTimeWithTraffic: Math.round(totalTimeWithTraffic),
    fuelCost: Math.round(fuelCost * 100) / 100,
    priorityScore: Math.round(priorityScore),
    loadUtilization: Math.round((loadValidation.totalWeight / vehicle.maxWeight) * 100),
    trafficImpact: {
      delayMinutes: Math.round(trafficDelayMinutes),
      alternativeRoutes: Math.min(3, Math.floor(trafficDelayMinutes / 15))
    },
    recommendations
  };
};

export const generateGoogleMapsUrl = (route: OptimizedDeliveryRoute): string => {
  const baseUrl = 'https://www.google.com/maps/dir/';
  const waypoints = route.stops
    .map(stop => encodeURIComponent(stop.address.original))
    .join('/');
  
  return baseUrl + waypoints;
};