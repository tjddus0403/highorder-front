"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StoreMap from "../components/StoreMap";

// 가게 ID (QR 코드에서 가져온 값)
const STORE_ID = 1;

export default function StorePage() {
  const [storeInfo, setStoreInfo] = useState(null);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [cartItems, setCartItems] = useState([]);
  const router = useRouter();

  // 이미지 URI를 백엔드 서버의 전체 URL로 변환하는 헬퍼 함수
  const getFullImageUrl = (imageUri) => {
    if (!imageUri) return null;
    
    // 이미 완전한 URL인 경우 (http:// 또는 https://로 시작)
    if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
      return imageUri;
    }
    
    // 상대 경로인 경우 백엔드 서버 URL을 붙임
    if (imageUri.startsWith('/')) {
      return `http://localhost:8080${imageUri}`;
    }
    
    // 파일명만 있는 경우도 백엔드 서버 URL을 붙임
    return `http://localhost:8080/${imageUri}`;
  };

  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8080/api/stores/${STORE_ID}`);
        
        if (!response.ok) {
          throw new Error('가게 정보를 가져올 수 없습니다.');
        }
        
        const storeData = await response.json();
        setStoreInfo(storeData);
      } catch (error) {
        console.error('가게 정보 조회 실패:', error);
        // API 조회 실패 시 null로 설정
        setStoreInfo(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchMenus = async () => {
      try {
        const menuResponse = await fetch(`http://localhost:8080/api/stores/${STORE_ID}/menus`);
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          console.log('백엔드에서 받은 메뉴 데이터:', menuData); // 디버깅용 로그
          
          setMenus(menuData);
        }
      } catch (error) {
        console.error('메뉴 정보 조회 실패:', error);
        // API 조회 실패 시 빈 배열로 설정
        setMenus([]);
      }
    };

    const loadCartItems = () => {
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('장바구니 로드 실패:', error);
      }
    };

    fetchStoreInfo();
    fetchMenus();
    loadCartItems();
  }, []);

  const addToCart = (menuItem) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // 이미 있는 메뉴라면 수량만 증가
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
    } else {
      // 새로운 메뉴라면 추가
      const newItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        description: menuItem.description,
        image_uri: menuItem.imageUri, // 백엔드의 imageUri 필드 사용
        storeId: menuItem.storeId,
        storeName: storeInfo?.name || '알 수 없는 가게',
        quantity: 1
      };
      const updatedItems = [...cartItems, newItem];
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
    }

    // NavigationBar의 장바구니 아이콘 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const saveCartItems = (items) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('장바구니 저장 실패:', error);
    }
  };

  const updateQuantity = (menuId, change) => {
    const updatedItems = cartItems.map(item => {
      if (item.id === menuId) {
        const newQuantity = item.quantity + change;
        if (newQuantity >= 0 && newQuantity <= 99) {
          return { ...item, quantity: newQuantity };
        }
      }
      return item;
    }).filter(item => item.quantity > 0); // 수량이 0 이하인 아이템 제거

    setCartItems(updatedItems);
    saveCartItems(updatedItems);
    
    // NavigationBar의 장바구니 아이콘 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getCartItemQuantity = (menuId) => {
    const item = cartItems.find(item => item.id === menuId);
    return item ? item.quantity : 0;
  };

  const handleOrder = () => {
    if (cartItems.length === 0) {
      alert("장바구니가 비어있습니다.");
      return;
    }
    // 장바구니 페이지로 이동
    router.push('/cart');
  };

  if (loading) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">가게 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">가게 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
              {storeInfo.logoUri ? (
                <img
                  src={getFullImageUrl(storeInfo.logoUri)}
                  alt={`${storeInfo.name} 로고`}
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    console.error('가게 로고 로드 실패:', storeInfo.logoUri, '-> 완전한 URL:', getFullImageUrl(storeInfo.logoUri));
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    console.log('가게 로고 로드 성공:', storeInfo.logoUri, '-> 완전한 URL:', getFullImageUrl(storeInfo.logoUri));
                  }}
                />
              ) : null}
              <div 
                className="w-20 h-20 flex items-center justify-center text-4xl" 
                style={{ display: storeInfo.logoUri ? 'none' : 'flex' }}
              >
                🏪
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{storeInfo.name}</h1>
              <p className="text-lg text-gray-600">{storeInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'menu'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🍽️ 메뉴 주문
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'info'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ℹ️ 가게 정보
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {activeTab === 'menu' ? (
          <div className="space-y-6">
            {/* Menu Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">메뉴 목록</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menus.map((menu) => (
                  <div key={menu.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => router.push(`/menu?menuId=${menu.id}`)}>
                    <div className="w-full h-48 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {menu.imageUri ? (
                        <img
                          src={getFullImageUrl(menu.imageUri)}
                          alt={menu.name}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            console.error('메뉴 이미지 로드 실패:', menu.imageUri, '-> 완전한 URL:', getFullImageUrl(menu.imageUri));
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            console.log('메뉴 이미지 로드 성공:', menu.imageUri, '-> 완전한 URL:', getFullImageUrl(menu.imageUri));
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-full h-48 flex items-center justify-center" 
                        style={{ display: menu.imageUri ? 'none' : 'flex' }}
                      >
                        <span className="text-4xl">🍽️</span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{menu.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{menu.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-red-600">₩{menu.price.toLocaleString()}</span>
                      {getCartItemQuantity(menu.id) === 0 ? (
                        <button 
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(menu);
                          }}
                        >
                          담기
                        </button>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(menu.id, -1);
                            }}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                          >
                            -
                          </button>
                          <span className="text-lg font-bold text-gray-900 min-w-[2rem] text-center">
                            {getCartItemQuantity(menu.id)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(menu.id, 1);
                            }}
                            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">가게 정보</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-gray-500 w-20">📍 주소</span>
                <span className="text-gray-900">{storeInfo.address}</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-gray-500 w-20">📞 전화</span>
                <span className="text-gray-900">{storeInfo.phone}</span>
              </div>

              {/* 지도 표시 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📍 가게 위치</h3>
                {storeInfo.latitude && storeInfo.longitude ? (
                  <StoreMap 
                    latitude={parseFloat(storeInfo.latitude)}
                    longitude={parseFloat(storeInfo.longitude)}
                    storeName={storeInfo.name}
                    address={storeInfo.address}
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <p className="text-gray-500">위치 정보가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex justify-end items-center">
          <button 
            onClick={handleOrder}
            disabled={cartItems.length === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              cartItems.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-teal-500 hover:bg-teal-600 text-white'
            }`}
          >
            주문하기 ({cartItems.reduce((total, item) => total + item.quantity, 0)})
          </button>
        </div>
      </div>
    </div>
  );
}
