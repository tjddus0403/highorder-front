"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function MyRestaurantMapTab({ orders, reviews, stamps, stores }) {
  const [visitedStores, setVisitedStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const router = useRouter();

  // 방문한 가게들을 정리하는 함수
  const processVisitedStores = useCallback(() => {
    const storeMap = new Map();
    
    // 주문 내역에서 가게 정보 수집
    orders.forEach(order => {
      if (order.storeInfo) {
        const storeId = order.storeInfo.id;
        if (!storeMap.has(storeId)) {
          storeMap.set(storeId, {
            id: storeId,
            name: order.storeInfo.name,
            description: order.storeInfo.description,
            visitCount: 0,
            totalSpent: 0,
            lastVisit: null,
            reviews: [],
            stamps: 0,
            coordinates: null,
            address: null,
            phone: null
          });
        }
        
        const store = storeMap.get(storeId);
        store.visitCount += 1;
        store.totalSpent += order.totalPrice || 0;
        
        const orderDate = new Date(order.orderedAt);
        if (!store.lastVisit || orderDate > store.lastVisit) {
          store.lastVisit = orderDate;
        }
      }
    });
    
    // 리뷰 정보 추가
    reviews.forEach(review => {
      const order = orders.find(o => 
        o.items.some(item => item.orderItemId === review.orderItemId)
      );
      if (order && order.storeInfo) {
        const storeId = order.storeInfo.id;
        if (storeMap.has(storeId)) {
          const store = storeMap.get(storeId);
          store.reviews.push({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            menuName: review.menuName,
            date: review.createdAt
          });
        }
      }
    });
    
    // 스탬프 정보 추가
    stamps.forEach(stamp => {
      if (stores[stamp.storeId]) {
        const storeId = stamp.storeId;
        if (storeMap.has(storeId)) {
          const store = storeMap.get(storeId);
          store.stamps = stamp.count || 0;
        }
      }
    });
    
    return Array.from(storeMap.values());
  }, [orders, reviews, stamps, stores]);

  // 가게들의 실제 좌표 정보 가져오기
  const fetchStoreCoordinates = useCallback(async (storesList) => {
    if (storesList.length === 0) return storesList;
    
    const storesWithCoordinates = await Promise.all(
      storesList.map(async (store) => {
        try {
          const response = await fetch(`http://localhost:8080/api/stores/${store.id}`);
          if (response.ok) {
            const storeData = await response.json();
            return {
              ...store,
              coordinates: {
                lat: storeData.latitude,
                lng: storeData.longitude
              },
              address: storeData.address,
              phone: storeData.phone
            };
          }
        } catch (error) {
          console.error(`가게 ${store.id} 좌표 정보 가져오기 실패:`, error);
        }
        return store;
      })
    );
    
    return storesWithCoordinates;
  }, []);

  // 방문한 가게 정보 처리
  useEffect(() => {
    const processStores = async () => {
      const processedStores = processVisitedStores();
      const storesWithCoordinates = await fetchStoreCoordinates(processedStores);
      setVisitedStores(storesWithCoordinates);
    };
    
    processStores();
  }, [processVisitedStores, fetchStoreCoordinates]);

  // 지도 초기화 함수
  const initializeMap = useCallback(() => {
    if (typeof window === 'undefined' || !window.L || !mapRef.current || visitedStores.length === 0) {
      return;
    }

    try {
      const L = window.L;
      
      // 기존 지도가 있다면 제거
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.log('Map cleanup error:', error);
        }
        mapInstanceRef.current = null;
      }

      // 맵 컨테이너가 이미 사용 중인지 확인
      if (mapRef.current._leaflet_id) {
        return;
      }

      // 한국 전체가 보이는 좌표와 줌 레벨 설정
      const map = L.map(mapRef.current).setView([36.5, 127.5], 7);
      mapInstanceRef.current = map;

      // OpenStreetMap 타일 레이어 추가
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // 커스텀 핀 이미지 아이콘 생성
      const customIcon = L.icon({
        iconUrl: '/red_pin.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      // 방문한 가게들을 지도에 마커로 표시
      visitedStores.forEach((store) => {
        if (store.coordinates && store.coordinates.lat && store.coordinates.lng) {
          const marker = L.marker([store.coordinates.lat, store.coordinates.lng], { 
            icon: customIcon 
          }).addTo(map);
          
          // 마커 클릭 시 팝업 표시
          const popupContent = `
            <div class="text-center p-2">
              <h3 class="font-bold text-lg mb-2">${store.name}</h3>
              <p class="text-sm text-gray-600 mb-2">${store.description || '설명 없음'}</p>
              <p class="text-sm text-gray-500 mb-2">${store.address || '주소 정보 없음'}</p>
              <div class="text-xs text-gray-400">
                <div>방문: ${store.visitCount}회</div>
                <div>리뷰: ${store.reviews.length}개</div>
                <div>스탬프: ${store.stamps}개</div>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupContent);
        }
      });

      // 지도 크기 조정
      setTimeout(() => {
        if (map && !map._removed) {
          try {
            map.invalidateSize();
          } catch (error) {
            console.log('Map resize error:', error);
          }
        }
      }, 100);

    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }, [visitedStores]);

  // Leaflet CSS와 JS 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.querySelector('link[href*="leaflet.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    if (typeof window !== 'undefined' && !window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => {
        setMapLoaded(true);
      };
      document.head.appendChild(script);
    } else if (typeof window !== 'undefined' && window.L) {
      setMapLoaded(true);
    }
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (mapLoaded && visitedStores.length > 0) {
      initializeMap();
    }
  }, [mapLoaded, visitedStores.length, initializeMap]);

  // 컴포넌트 언마운트 시 지도 정리
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.log('Map cleanup error:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleStoreClick = (store) => {
    setSelectedStore(store);
  };

  const handleGoToStore = (storeId) => {
    router.push(`/store?storeId=${storeId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '방문 기록 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  };

  const getAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
    }
    
    return stars;
  };

  return (
    <div className="space-y-6">
      {/* 탭 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🗺️ 내 맛집지도
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          방문한 가게들을 지도에서 한눈에 확인하고 관리하세요
        </p>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">🏪</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">방문 가게</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {visitedStores.length}곳
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 방문 횟수</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {visitedStores.reduce((sum, store) => sum + store.visitCount, 0)}회
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 리뷰</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {visitedStores.reduce((sum, store) => sum + store.reviews.length, 0)}개
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">🏷️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 스탬프</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {visitedStores.reduce((sum, store) => sum + store.stamps, 0)}개
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 지도 보기 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {visitedStores.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              아직 방문한 가게가 없습니다
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              첫 주문을 해보세요!
            </p>
            <button
              onClick={() => router.push('/store')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              🏪 가게 둘러보기
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                🗺️ 방문한 가게 지도
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                현재 {visitedStores.length}곳의 가게를 방문했습니다.
              </p>
            </div>
            
            {/* 실제 지도 */}
            <div 
              ref={mapRef} 
              className="w-full h-96 rounded-lg border border-gray-200"
              style={{ zIndex: 1 }}
            />
            
            {/* 가게 목록 미리보기 */}
            <div className="mt-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                방문한 가게 목록
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {visitedStores.slice(0, 6).map((store) => (
                  <div
                    key={store.id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                    onClick={() => handleStoreClick(store)}
                  >
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      {store.name}
                    </h5>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <div>방문: {store.visitCount}회</div>
                      <div>리뷰: {store.reviews.length}개</div>
                      <div>스탬프: {store.stamps}개</div>
                    </div>
                  </div>
                ))}
              </div>
              {visitedStores.length > 6 && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  외 {visitedStores.length - 6}곳의 가게가 더 있습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 가게 상세 정보 모달 */}
      {selectedStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedStore.name}
                </h3>
                <button
                  onClick={() => setSelectedStore(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">방문 횟수</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedStore.visitCount}회</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">총 지출</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedStore.totalSpent)}원</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">가게 설명</p>
                  <p className="text-gray-900 dark:text-white">{selectedStore.description || '가게 설명이 없습니다.'}</p>
                </div>
                
                {selectedStore.reviews.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">리뷰 ({selectedStore.reviews.length}개)</p>
                    <div className="space-y-3">
                      {selectedStore.reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="border-l-4 border-blue-500 pl-3">
                          <div className="flex items-center space-x-2 mb-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {review.menuName}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 dark:text-white">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedStore(null);
                      handleGoToStore(selectedStore.id);
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    🏪 가게로 이동
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStore(null);
                      router.push('/mypage?tab=reviews');
                    }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    📝 리뷰 보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
