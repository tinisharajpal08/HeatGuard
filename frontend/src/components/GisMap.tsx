import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Map as MapIcon, Layers } from 'lucide-react';
import { apiFetch } from '../lib/api';

// Fix default Leaflet marker icon links
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface GisMapProps {
  onSelectWard: (wardId: number) => void;
}

export const GisMap: React.FC<GisMapProps> = ({ onSelectWard }) => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [coolingCentres, setCoolingCentres] = useState<any[]>([]);
  const [activeLayer, setActiveLayer] = useState<string>('risk');
  const [loading, setLoading] = useState<boolean>(true);

  // CARTO is optional; the public OpenStreetMap tiles work without credentials.
  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY;
  const hasCartoApiKey = Boolean(cartoApiKey && cartoApiKey !== 'YOUR_CARTO_KEY');
  const tileUrl = hasCartoApiKey
    ? `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoApiKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = hasCartoApiKey
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  useEffect(() => {
    Promise.all([
      apiFetch('/api/wards/geojson').then(res => res.json()),
      apiFetch('/api/hospitals').then(res => res.json()),
      apiFetch('/api/cooling-centres').then(res => res.json())
    ])
      .then(([geoData, hospData, coolData]) => {
        setGeoJsonData(geoData);
        setHospitals(hospData || []);
        setCoolingCentres(coolData || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching GIS data:', err);
        setLoading(false);
      });
  }, []);

  const getWardColor = (feature: any) => {
    const props = feature.properties;
    if (activeLayer === 'htss') {
      const htss = props.htss || 50;
      if (htss >= 80) return '#9333ea'; // Purple
      if (htss >= 65) return '#ef4444'; // Red
      if (htss >= 50) return '#f97316'; // Orange
      if (htss >= 35) return '#eab308'; // Yellow
      return '#22c55e'; // Green
    }
    if (activeLayer === 'wbgt') {
      const wbgt = props.wbgt_outdoor_c || 30;
      if (wbgt >= 34) return '#9333ea';
      if (wbgt >= 31) return '#ef4444';
      if (wbgt >= 28) return '#f97316';
      return '#eab308';
    }

    // Default: Health Risk Level Color
    switch (props.health_risk_level) {
      case 'EXTREME': return '#9333ea';
      case 'VERY_HIGH': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MODERATE': return '#eab308';
      default: return '#22c55e';
    }
  };

  const styleFeature = (feature: any) => {
    const color = getWardColor(feature);
    return {
      fillColor: color,
      weight: 2,
      opacity: 0.9,
      color: '#0f172a',
      fillOpacity: 0.65
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    
    // Bind hover tooltip
    layer.bindTooltip(`
      <div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
        <strong>${props.name}</strong> (${props.zone})<br />
        Risk: <strong>${props.health_risk_level}</strong><br />
        HTSS: <strong>${props.htss}/100</strong> | WBGT: <strong>${props.wbgt_outdoor_c}°C</strong>
      </div>
    `, { sticky: true });

    layer.on({
      click: () => {
        onSelectWard(props.id);
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.85, weight: 3, color: '#f59e0b' });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.65, weight: 2, color: '#0f172a' });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex items-center gap-3 text-amber-400">
          <MapIcon className="w-6 h-6 animate-spin" />
          <span className="font-mono text-sm font-semibold">Loading Hyperlocal GIS Heat Risk Map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-amber-400" />
            Delhi / NCR Hyperlocal GIS Heat-Health Risk Map
          </h2>
          <p className="text-xs text-slate-400">
            Click any ward polygon to inspect detailed micro-climate metrics & Explainable AI attributions
          </p>
        </div>

        {/* Risk Layer Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-medium">
          <span className="text-slate-400 font-mono flex items-center gap-1 px-2">
            <Layers className="w-3.5 h-3.5 text-amber-400" /> Layer:
          </span>
          <button
            onClick={() => setActiveLayer('risk')}
            className={`px-3 py-1 rounded-lg transition ${activeLayer === 'risk' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Health Risk
          </button>
          <button
            onClick={() => setActiveLayer('htss')}
            className={`px-3 py-1 rounded-lg transition ${activeLayer === 'htss' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            HTSS Score
          </button>
          <button
            onClick={() => setActiveLayer('wbgt')}
            className={`px-3 py-1 rounded-lg transition ${activeLayer === 'wbgt' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            WBGT Sun
          </button>
        </div>
      </div>

      {/* MAP & LEGEND CONTAINER */}
      <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={11}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution={tileAttribution}
            url={tileUrl}
            maxZoom={hasCartoApiKey ? 20 : 19}
          />

          {geoJsonData && (
            <GeoJSON
              data={geoJsonData}
              style={styleFeature}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Hospitals Markers */}
          {hospitals.map(h => (
            <Marker key={`hosp-${h.id}`} position={[h.lat, h.lon]}>
              <Popup>
                <div className="p-1 text-slate-900 font-sans">
                  <strong className="text-red-700">{h.name}</strong><br />
                  Beds: {h.beds} | ICU: {h.icu_beds}<br />
                  Surge Risk: <strong>{h.current_surge_risk}</strong>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Cooling Centres Markers */}
          {coolingCentres.map(c => (
            <Marker key={`cool-${c.id}`} position={[c.lat, c.lon]}>
              <Popup>
                <div className="p-1 text-slate-900 font-sans">
                  <strong className="text-emerald-700">{c.name}</strong><br />
                  Capacity: {c.capacity} persons<br />
                  AC: {c.ac_available ? 'YES' : 'NO'} | Water: {c.water_station ? 'YES' : 'NO'}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* MAP LEGEND OVERLAY */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-xl text-xs space-y-2 z-[1000] shadow-xl">
          <span className="font-mono font-bold text-slate-300 block border-b border-slate-800 pb-1">
            HEAT THREAT LEGEND
          </span>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-600"></span> EXTREME RISK (&gt;85 HTSS)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500"></span> VERY HIGH RISK (70-84 HTSS)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-orange-500"></span> HIGH RISK (50-69 HTSS)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-500"></span> MODERATE RISK (30-49 HTSS)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500"></span> LOW RISK (&lt;30 HTSS)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
