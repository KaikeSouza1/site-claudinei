'use client'

// Mapa OpenStreetMap com Leaflet (gratuito, sem chave de API).
// Com `onChange`, o marcador pode ser arrastado ou reposicionado com um clique.
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  lat: number;
  lng: number;
  zoom?: number;
  onChange?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
};

// Pino em SVG: evita os ícones PNG padrão do Leaflet, que quebram no bundler.
const PINO = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
  <path d="M17 1C8.2 1 1 8 1 16.8 1 28.5 17 45 17 45s16-16.5 16-28.2C33 8 25.8 1 17 1z" fill="#c9a84c" stroke="#04122b" stroke-width="2"/>
  <circle cx="17" cy="17" r="6" fill="#04122b"/>
</svg>`;

export default function MapaImovel({ lat, lng, zoom = 16, onChange, className, style }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Cria o mapa uma vez
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([lat, lng], zoom);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(map);

      const editavel = Boolean(onChangeRef.current);
      const marker = L.marker([lat, lng], {
        draggable: editavel,
        icon: L.divIcon({ html: PINO, className: '', iconSize: [34, 46], iconAnchor: [17, 45] }),
      }).addTo(map);

      if (editavel) {
        marker.on('dragend', () => {
          const p = marker.getLatLng();
          onChangeRef.current?.(p.lat, p.lng);
        });
        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          onChangeRef.current?.(e.latlng.lat, e.latlng.lng);
        });
      }

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Acompanha mudanças de coordenada vindas de fora (CEP, botão "Localizar")
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const atual = marker.getLatLng();
    if (Math.abs(atual.lat - lat) > 1e-7 || Math.abs(atual.lng - lng) > 1e-7) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], Math.max(map.getZoom(), zoom));
    }
  }, [lat, lng, zoom]);

  // isolation: os painéis do Leaflet (z-index 400+) não passam por cima de menus e barras fixas
  return <div ref={containerRef} className={className} style={{ isolation: 'isolate', ...style }} />;
}
