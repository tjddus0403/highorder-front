"use client";

import { useEffect, useRef } from 'react';

const StoreMap = ({ latitude, longitude, storeName, address }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const initializeMap = () => {
      if (typeof window !== 'undefined' && window.L) {
        const L = window.L;
        
        // 이전 맵 인스턴스가 있다면 제거
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // 맵 초기화
        const map = L.map(mapRef.current).setView([latitude, longitude], 15);
        mapInstanceRef.current = map;

        // OpenStreetMap 타일 레이어 추가
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // 커스텀 핀 이미지 아이콘 생성
        const customIcon = L.icon({
          iconUrl: '/red_pin.png',
          iconSize: [40, 40], // 핀 이미지 크기에 맞춰 조정
          iconAnchor: [20, 40], // 핀의 하단 중앙을 기준점으로 설정
          popupAnchor: [0, -40] // 팝업이 핀 위에 표시되도록 설정
        });

        // 가게 위치 마커 추가
        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
        
        // 팝업 추가
        marker.bindPopup(`
          <div class="text-center">
            <h3 class="text-lg font-bold mb-2">${storeName}</h3>
            <p class="text-sm text-gray-600">${address}</p>
          </div>
        `);

        // 맵 크기 조정
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    };

    // Leaflet이 로드되었는지 확인
    if (typeof window !== 'undefined' && window.L) {
      initializeMap();
    } else {
      // Leaflet 로드 이벤트 리스너 추가
      const handleLeafletLoaded = () => {
        initializeMap();
      };
      
      window.addEventListener('leafletLoaded', handleLeafletLoaded);
      
      return () => {
        window.removeEventListener('leafletLoaded', handleLeafletLoaded);
      };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [latitude, longitude, storeName, address]);

  // Leaflet CSS 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBgI1+UcN9v4mRJFIc82R5v98mQ5WgH6CwNQ=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Leaflet JS 로드
    if (typeof window !== 'undefined' && !window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = () => {
        // 스크립트 로드 후 맵 초기화를 위해 useEffect 재실행
        window.dispatchEvent(new Event('leafletLoaded'));
      };
      document.head.appendChild(script);
    }
  }, []);

  if (!latitude || !longitude) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">위치 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div 
        ref={mapRef} 
        className="w-full h-64 rounded-lg border border-gray-200"
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

export default StoreMap;
