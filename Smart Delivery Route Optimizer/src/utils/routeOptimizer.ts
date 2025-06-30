import { Address, RouteStop, OptimizedRoute } from '../types';
import { geocodeAddresses } from './geocoding';

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

// Enhanced route optimization using Google Distance Matrix API when available
const getDistanceMatrix = async (origins: Address[], destinations: Address[]): Promise<number[][]> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || origins.length > 10 || destinations.length > 10) {
    // Fallback to Haversine formula for large datasets or when API key is not available
    return origins.map(origin => 
      destinations.map(dest => {
        if (!origin.coordinates || !dest.coordinates) return Infinity;
        return calculateDistance(
          origin.coordinates.lat,
          origin.coordinates.lng,
          dest.coordinates.lat,
          dest.coordinates.lng
        );
      })
    );
  }
  
  try {
    const originStr = origins.map(addr => 
      `${addr.coordinates!.lat},${addr.coordinates!.lng}`
    ).join('|');
    
    const destStr = destinations.map(addr => 
      `${addr.coordinates!.lat},${addr.coordinates!.lng}`
    ).join('|');
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destStr}&units=metric&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Distance Matrix API failed');
    }
    
    const data = await response.json();
    
    if (data.status === 'OK') {
      return data.rows.map((row: any) => 
        row.elements.map((element: any) => {
          if (element.status === 'OK') {
            return element.distance.value / 1000; // Convert meters to kilometers
          }
          return Infinity;
        })
      );
    }
    
    throw new Error(`Distance Matrix API error: ${data.status}`);
  } catch (error) {
    console.warn('Distance Matrix API failed, using Haversine formula:', error);
    // Fallback to Haversine formula
    return origins.map(origin => 
      destinations.map(dest => {
        if (!origin.coordinates || !dest.coordinates) return Infinity;
        return calculateDistance(
          origin.coordinates.lat,
          origin.coordinates.lng,
          dest.coordinates.lat,
          dest.coordinates.lng
        );
      })
    );
  }
};

// Improved nearest neighbor algorithm with distance matrix
const optimizeRouteNearestNeighbor = async (addresses: Address[]): Promise<Address[]> => {
  if (addresses.length <= 2) return addresses;
  
  // Get distance matrix for more accurate distances
  const distanceMatrix = await getDistanceMatrix(addresses, addresses);
  
  const unvisited = [...addresses.slice(1)];
  const route = [addresses[0]];
  
  while (unvisited.length > 0) {
    const currentIndex = addresses.indexOf(route[route.length - 1]);
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    
    unvisited.forEach((address, index) => {
      const addressIndex = addresses.indexOf(address);
      const distance = distanceMatrix[currentIndex][addressIndex];
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    
    route.push(unvisited[nearestIndex]);
    unvisited.splice(nearestIndex, 1);
  }
  
  // Apply 2-opt optimization
  return await twoOptOptimization(route, addresses, distanceMatrix);
};

// 2-opt optimization with distance matrix
const twoOptOptimization = async (route: Address[], allAddresses: Address[], distanceMatrix: number[][]): Promise<Address[]> => {
  if (route.length < 4) return route;
  
  let improved = true;
  let bestRoute = [...route];
  
  while (improved) {
    improved = false;
    
    for (let i = 1; i < bestRoute.length - 2; i++) {
      for (let j = i + 1; j < bestRoute.length - 1; j++) {
        const newRoute = twoOptSwap(bestRoute, i, j);
        
        if (calculateTotalDistanceFromMatrix(newRoute, allAddresses, distanceMatrix) < 
            calculateTotalDistanceFromMatrix(bestRoute, allAddresses, distanceMatrix)) {
          bestRoute = newRoute;
          improved = true;
        }
      }
    }
  }
  
  return bestRoute;
};

const twoOptSwap = (route: Address[], i: number, j: number): Address[] => {
  const newRoute = [...route];
  const segment = newRoute.slice(i, j + 1).reverse();
  newRoute.splice(i, j - i + 1, ...segment);
  return newRoute;
};

const calculateTotalDistanceFromMatrix = (route: Address[], allAddresses: Address[], distanceMatrix: number[][]): number => {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    const prevIndex = allAddresses.indexOf(route[i - 1]);
    const currIndex = allAddresses.indexOf(route[i]);
    total += distanceMatrix[prevIndex][currIndex];
  }
  return total;
};

const calculateTotalDistance = (route: Address[]): number => {
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    const prev = route[i - 1];
    const curr = route[i];
    if (prev.coordinates && curr.coordinates) {
      total += calculateDistance(
        prev.coordinates.lat,
        prev.coordinates.lng,
        curr.coordinates.lat,
        curr.coordinates.lng
      );
    }
  }
  return total;
};

export const optimizeRoute = async (addresses: Address[]): Promise<OptimizedRoute> => {
  // Extract unique addresses
  const uniqueAddresses = addresses.filter((addr, index, self) => 
    index === self.findIndex(a => a.original.toLowerCase().trim() === addr.original.toLowerCase().trim())
  );
  
  if (uniqueAddresses.length === 0) {
    throw new Error('No valid addresses provided');
  }
  
  // Geocode all addresses using Google API
  const addressStrings = uniqueAddresses.map(addr => addr.original);
  const geocodingResults = await geocodeAddresses(addressStrings);
  
  const geocodedAddresses: Address[] = [];
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
    throw new Error('Could not geocode any addresses. Please check the address format and try again.');
  }
  
  if (failedAddresses.length > 0) {
    console.warn('Failed to geocode addresses:', failedAddresses);
  }
  
  // Optimize route using enhanced algorithm
  const optimizedAddresses = await optimizeRouteNearestNeighbor(geocodedAddresses);
  
  // Calculate route metrics with more accurate distances
  let totalDistance = 0;
  const stops: RouteStop[] = [];
  
  for (let i = 0; i < optimizedAddresses.length; i++) {
    const address = optimizedAddresses[i];
    let distance = 0;
    
    if (i > 0 && address.coordinates && optimizedAddresses[i - 1].coordinates) {
      distance = calculateDistance(
        optimizedAddresses[i - 1].coordinates!.lat,
        optimizedAddresses[i - 1].coordinates!.lng,
        address.coordinates.lat,
        address.coordinates.lng
      );
      totalDistance += distance;
    }
    
    stops.push({
      address,
      order: i + 1,
      distance,
      estimatedTime: i === 0 ? '0 min' : `${Math.round(distance * 3)} min` // Assuming 20 km/h average speed
    });
  }
  
  // Calculate original route distance for savings comparison
  const originalDistance = calculateTotalDistance(geocodedAddresses);
  
  const savings = {
    distance: Math.max(0, originalDistance - totalDistance),
    time: `${Math.round((originalDistance - totalDistance) * 3)} min`
  };
  
  return {
    stops,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalTime: `${Math.round(totalDistance * 3)} min`,
    savings,
    geocodedAddresses,
    optimizedAddresses
  };
};

export const generateGoogleMapsUrl = (route: OptimizedRoute): string => {
  const baseUrl = 'https://www.google.com/maps/dir/';
  const waypoints = route.stops
    .map(stop => encodeURIComponent(stop.address.original))
    .join('/');
  
  return baseUrl + waypoints;
};