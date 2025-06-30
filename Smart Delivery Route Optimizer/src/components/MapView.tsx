import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { DivIcon } from "leaflet";
import { DeliveryAddress } from "../types";

interface MapViewProps {
  addresses: DeliveryAddress[];
  route?: DeliveryAddress[];
  center?: [number, number];
  zoom?: number;
}

// ✅ Automatically zoom to fit all markers
const FitBounds: React.FC<{ addresses: DeliveryAddress[] }> = ({
  addresses,
}) => {
  const map = useMap();

  React.useEffect(() => {
    const validCoords = addresses
      .filter((addr) => addr.coordinates)
      .map(
        (addr) =>
          [addr.coordinates!.lat, addr.coordinates!.lng] as [number, number]
      );

    if (validCoords.length > 0) {
      map.fitBounds(validCoords, { padding: [20, 20] });
    }
  }, [addresses, map]);

  return null;
};

// ✅ Custom marker icon with number and styles
const createNumberedIcon = (number: number, isStart = false, isEnd = false) => {
  let className = "route-marker";
  if (isStart) className += " start";
  if (isEnd) className += " end";

  return new DivIcon({
    html: `<div class="${className}">${number}</div>`,
    className: "custom-div-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const MapView: React.FC<MapViewProps> = ({
  addresses,
  route,
  center = [19.076, 72.8777], // Mumbai as fallback
  zoom = 10,
}) => {
  const displayAddresses = route || addresses;

  const routeCoordinates =
    route
      ?.filter((addr) => addr.coordinates)
      .map(
        (addr) =>
          [addr.coordinates!.lat, addr.coordinates!.lng] as [number, number]
      ) || [];

  return (
    <div className="w-full" style={{ height: "400px", minHeight: "400px" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="rounded-lg overflow-hidden shadow-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Automatically fit bounds */}
        <FitBounds addresses={displayAddresses} />

        {/* Route polyline */}
        {route && routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Markers */}
        {displayAddresses.map((address, index) => {
          if (!address.coordinates) return null;

          const isStart = route && index === 0;
          const isEnd = route && index === displayAddresses.length - 1;
          const markerNumber = index + 1;

          return (
            <Marker
              key={address.id}
              position={[address.coordinates.lat, address.coordinates.lng]}
              icon={createNumberedIcon(markerNumber, isStart, isEnd)}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-medium text-gray-900">
                    {route
                      ? `Stop ${markerNumber}`
                      : `Location ${markerNumber}`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.original}
                  </p>
                  {address.formatted &&
                    address.formatted !== address.original && (
                      <p className="text-xs text-gray-500 mt-1">
                        {address.formatted}
                      </p>
                    )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
