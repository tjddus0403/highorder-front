"use client";

import { useEffect, useRef, useCallback } from 'react';

const StoreMap = ({ latitude, longitude, storeName, address }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const isInitializedRef = useRef(false);

  const cleanupMap = useCallback(() => {
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      } catch (error) {
        console.log('Map cleanup error:', error);
      }
    }
    isInitializedRef.current = false;
  }, []);

  const initializeMap = useCallback(() => {
    if (typeof window === 'undefined' || !window.L || !mapRef.current || isInitializedRef.current) {
      return;
    }

    try {
      const L = window.L;
      
      // 맵 컨테이너가 이미 사용 중인지 확인
      if (mapRef.current._leaflet_id) {
        return;
      }

      // 맵 초기화
      const map = L.map(mapRef.current).setView([latitude, longitude], 15);
      mapInstanceRef.current = map;
      isInitializedRef.current = true;

      // OpenStreetMap 타일 레이어 추가
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // 커스텀 핀 이미지 아이콘 생성
      const customIcon = L.icon({
        iconUrl: '/red_pin.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
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

      // 맵 크기 조정을 위한 안전한 방법
      const resizeMap = () => {
        if (map && !map._removed) {
          try {
            map.invalidateSize();
          } catch (error) {
            console.log('Map resize error:', error);
          }
        }
      };

      // 약간의 지연 후 크기 조정
      setTimeout(resizeMap, 100);
      
    } catch (error) {
      console.error('Map initialization error:', error);
      cleanupMap();
    }
  }, [latitude, longitude, storeName, address, cleanupMap]);

  useEffect(() => {
    // 컴포넌트 마운트 시 맵 초기화
    if (typeof window !== 'undefined' && window.L) {
      initializeMap();
    } else if (typeof window !== 'undefined') {
      // Leaflet 로드 이벤트 리스너 추가
      const handleLeafletLoaded = () => {
        initializeMap();
      };
      
      window.addEventListener('leafletLoaded', handleLeafletLoaded);
      
      return () => {
        window.removeEventListener('leafletLoaded', handleLeafletLoaded);
      };
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanupMap();
    };
  }, [initializeMap, cleanupMap]);

  // props가 변경될 때만 맵 재초기화
  useEffect(() => {
    if (isInitializedRef.current && mapInstanceRef.current) {
      cleanupMap();
      // 다음 렌더링 사이클에서 재초기화
      const timer = setTimeout(() => {
        initializeMap();
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [latitude, longitude, storeName, address, initializeMap, cleanupMap]);

  // Leaflet CSS 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      // integrity 체크 제거하여 로딩 문제 해결
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Leaflet JS 로드
    if (typeof window !== 'undefined' && !window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      // integrity 체크 제거하여 로딩 문제 해결
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
