import { useEffect, useState, useCallback, useRef } from 'react';

export function useLeaflet(mapRef) {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Import Leaflet dynamically to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix for default markers in Webpack
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Create map instance
      const mapInstance = L.map(mapRef.current).setView([0, 0], 2);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      setMap(mapInstance);
      setIsReady(true);
    });

    // Cleanup function
    return () => {
      if (map) {
        map.remove();
        setMap(null);
        setIsReady(false);
      }
    };
  }, [mapRef]);

  const updateView = useCallback((center, zoom) => {
    if (map && center && zoom) {
      map.setView(center, zoom);
    }
  }, [map]);

  const addAsteroidMarkers = useCallback((asteroids, onAsteroidClick) => {
    if (!map || !asteroids) return;

    // Clear existing markers
    markers.forEach(marker => {
      map.removeLayer(marker);
    });

    // Import Leaflet for marker creation
    import('leaflet').then((L) => {
      const newMarkers = asteroids.map(asteroid => {
        const { lat, lon } = asteroid.impactLocation || { lat: 0, lon: 0 };
        
        // Create custom icon based on threat level
        const iconColor = getAsteroidColor(asteroid);
        const customIcon = L.divIcon({
          className: 'asteroid-marker',
          html: `<div style="background-color: ${iconColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        const marker = L.marker([lat, lon], { icon: customIcon })
          .addTo(map)
          .bindPopup(`
            <div class="asteroid-popup">
              <h4>${asteroid.name || 'Unknown Asteroid'}</h4>
              <p><strong>Diameter:</strong> ${asteroid.diameter || 'Unknown'} km</p>
              <p><strong>Velocity:</strong> ${asteroid.velocity || 'Unknown'} km/s</p>
              <p><strong>Threat Level:</strong> ${asteroid.threatLevel || 'Unknown'}</p>
            </div>
          `)
          .on('click', () => {
            if (onAsteroidClick) {
              onAsteroidClick(asteroid);
            }
          });

        return marker;
      });

      setMarkers(newMarkers);
    });
  }, [map, markers]);

  const addImpactCircle = useCallback((lat, lon, radius, options = {}) => {
    if (!map) return null;

    return import('leaflet').then((L) => {
      const circle = L.circle([lat, lon], {
        radius: radius * 1000, // Convert km to meters
        fillColor: options.color || '#ff0000',
        fillOpacity: options.opacity || 0.3,
        color: options.borderColor || '#ff0000',
        weight: options.borderWidth || 2,
        ...options
      }).addTo(map);

      return circle;
    });
  }, [map]);

  const addTrajectoryLine = useCallback((coordinates, options = {}) => {
    if (!map || !coordinates.length) return null;

    return import('leaflet').then((L) => {
      const line = L.polyline(coordinates, {
        color: options.color || '#0066ff',
        weight: options.weight || 3,
        opacity: options.opacity || 0.7,
        dashArray: options.dashed ? '10, 10' : null,
        ...options
      }).addTo(map);

      return line;
    });
  }, [map]);

  const clearLayers = useCallback(() => {
    if (!map) return;
    
    markers.forEach(marker => {
      map.removeLayer(marker);
    });
    setMarkers([]);
  }, [map, markers]);

  return {
    map,
    markers,
    isReady,
    updateView,
    addAsteroidMarkers,
    addImpactCircle,
    addTrajectoryLine,
    clearLayers,
  };
}

function getAsteroidColor(asteroid) {
  switch (asteroid.threatLevel) {
    case 'high':
      return '#ff4444';
    case 'medium':
      return '#ffaa00';
    case 'low':
      return '#44ff44';
    default:
      return '#ffffff';
  }
}
