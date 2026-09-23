import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { GlobalSupplier } from '../../types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface SupplierMapProps {
  suppliers: GlobalSupplier[];
}

export function SupplierMap({ suppliers }: SupplierMapProps) {
  // Center of Algeria
  const center: [number, number] = [36.75, 3.05];

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative z-10">
      <MapContainer 
        center={center} 
        zoom={6} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-dark"
        />
        {suppliers.filter(s => s.location).map((supplier) => (
          <Marker 
            key={supplier.id} 
            position={[supplier.location!.lat, supplier.location!.lng]}
          >
            <Popup>
              <div className="p-2 min-w-[150px]">
                <h3 className="font-bold text-slate-900">{supplier.name}</h3>
                <p className="text-xs text-slate-600">{supplier.category}</p>
                <div className="mt-2 text-[10px] font-bold text-emerald-600 uppercase">
                  Wilaya: {supplier.wilaya}
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <div className="w-full bg-slate-200 rounded-full h-1">
                    <div className={`bg-emerald-500 h-1 rounded-full w-p-${Math.round(supplier.aiScore / 5) * 5}`} />
                  </div>
                  <span className="text-[10px] font-bold">{supplier.aiScore}%</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

    </div>
  );
}
