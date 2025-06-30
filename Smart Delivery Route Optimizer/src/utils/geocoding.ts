// Enhanced geocoding service using Google Geocoding API for better accuracy

interface GeocodingResult {
  lat: number;
  lng: number;
  formatted: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  try {
    // Add delay to respect rate limits
    await delay(50);
    
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found, falling back to OpenStreetMap');
      return await geocodeAddressOSM(address);
    }
    
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`Google Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address
      };
    } else if (data.status === 'ZERO_RESULTS') {
      console.warn('No results found for address:', address);
      return null;
    } else if (data.status === 'OVER_QUERY_LIMIT') {
      console.warn('Google API quota exceeded, falling back to OpenStreetMap');
      return await geocodeAddressOSM(address);
    } else if (data.status === 'REQUEST_DENIED') {
      console.warn('Google API request denied (check API key and billing), falling back to OpenStreetMap');
      return await geocodeAddressOSM(address);
    } else if (data.status === 'INVALID_REQUEST') {
      console.warn('Invalid request to Google API, falling back to OpenStreetMap');
      return await geocodeAddressOSM(address);
    } else {
      console.warn(`Google Geocoding error: ${data.status}, falling back to OpenStreetMap`);
      return await geocodeAddressOSM(address);
    }
  } catch (error) {
    console.error('Google geocoding error for address:', address, error);
    // Fallback to OpenStreetMap
    return await geocodeAddressOSM(address);
  }
};

// Fallback geocoding using OpenStreetMap Nominatim API
const geocodeAddressOSM = async (address: string): Promise<GeocodingResult | null> => {
  try {
    await delay(200); // Longer delay for OSM to respect their rate limits
    
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RouteOptimizer/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`OSM Geocoding failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted: result.display_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('OSM geocoding error for address:', address, error);
    return null;
  }
};

export const geocodeAddresses = async (addresses: string[]): Promise<(GeocodingResult | null)[]> => {
  const results: (GeocodingResult | null)[] = [];
  const batchSize = 10; // Process in smaller batches to avoid rate limits
  
  for (let i = 0; i < addresses.length; i += batchSize) {
    const batch = addresses.slice(i, i + batchSize);
    
    // Process batch sequentially
    for (const address of batch) {
      const result = await geocodeAddress(address);
      results.push(result);
    }
    
    // Add longer delay between batches
    if (i + batchSize < addresses.length) {
      await delay(500);
    }
  }
  
  return results;
};