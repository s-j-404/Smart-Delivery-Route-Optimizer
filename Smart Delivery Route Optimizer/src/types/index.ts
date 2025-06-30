export interface DeliveryAddress {
  id: string;
  original: string;
  formatted?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  customerName?: string;
  phoneNumber?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeWindow?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  packageWeight?: number; // in kg
  packageSize?: 'small' | 'medium' | 'large';
  deliveryNotes?: string;
  estimatedDeliveryTime?: number; // in minutes
  cashOnDelivery?: number; // amount
}

export interface Vehicle {
  id: string;
  type: 'bike' | 'scooter' | 'car' | 'van';
  maxWeight: number; // kg
  maxVolume: number; // cubic meters
  fuelEfficiency: number; // km per liter
  currentLoad: number; // kg
}

export interface TrafficData {
  duration: number; // seconds
  durationInTraffic: number; // seconds with current traffic
  distance: number; // meters
  trafficLevel: 'light' | 'moderate' | 'heavy' | 'severe';
}

export interface DeliveryStop {
  address: DeliveryAddress;
  order: number;
  estimatedArrival: string;
  estimatedDuration: number; // minutes at location
  trafficDelay?: number; // additional minutes due to traffic
  cumulativeDistance: number; // km from start
  cumulativeTime: number; // minutes from start
}

export interface OptimizedDeliveryRoute {
  stops: DeliveryStop[];
  totalDistance: number;
  totalTime: number; // minutes
  totalTimeWithTraffic: number; // minutes including traffic
  fuelCost: number;
  priorityScore: number;
  loadUtilization: number; // percentage
  trafficImpact: {
    delayMinutes: number;
    alternativeRoutes: number;
  };
  recommendations: string[];
}

export interface ExcelData {
  headers: string[];
  rows: string[][];
  fileName: string;
}

export interface DeliveryColumnMapping {
  addressColumn: number;
  customerNameColumn?: number;
  phoneColumn?: number;
  priorityColumn?: number;
  timeWindowColumn?: number;
  weightColumn?: number;
  sizeColumn?: number;
  notesColumn?: number;
  codColumn?: number;
}