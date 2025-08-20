"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function MenuDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const menuId = searchParams.get('menuId');
  const [store, setStore] = useState(null);
  const [menu, setMenu] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);

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
    if (menuId) {
      fetchMenu();
    }
    // localStorage에서 장바구니 아이템 불러오기
    loadCartItems();
  }, [menuId]);

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

  const saveCartItems = (items) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('장바구니 저장 실패:', error);
    }
  };

  const addToCart = (menuItem, qty) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === menuItem.id);
    
    if (existingItemIndex >= 0) {
      // 이미 있는 메뉴라면 수량만 증가
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += qty;
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
    } else {
      // 새로운 메뉴라면 추가
      const newItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        description: menuItem.description,
        image_uri: menuItem.imageUri, // image 대신 imageUri 사용
        category: menuItem.category,
        storeId: menuItem.storeId,
        storeName: store?.name || '알 수 없는 가게',
        quantity: qty
      };
      const updatedItems = [...cartItems, newItem];
      setCartItems(updatedItems);
      saveCartItems(updatedItems);
    }
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      
      // 메뉴 정보 가져오기
      const menuResponse = await fetch(`http://localhost:8080/api/menus/${menuId}`);
      if (!menuResponse.ok) {
        throw new Error(`메뉴 정보를 불러올 수 없습니다.`);
      }
      const menuData = await menuResponse.json();
      console.log('백엔드에서 받은 메뉴 데이터:', menuData); // 디버깅용 로그
      
      // 메뉴 데이터에 카테고리 추가 (이모지 제거, imageUri 사용)
      let category = "기타";
      
      // 메뉴 이름에 따라 카테고리 설정
      if (menuData.name.includes("김밥")) {
        category = "김밥류";
      } else if (menuData.name.includes("라면")) {
        category = "면류";
      } else if (menuData.name.includes("떡볶이")) {
        category = "분식류";
      } else if (menuData.name.includes("순대")) {
        category = "분식류";
      } else if (menuData.name.includes("밥") || menuData.name.includes("덮밥")) {
        category = "밥류";
      } else if (menuData.name.includes("국") || menuData.name.includes("탕")) {
        category = "국류";
      } else if (menuData.name.includes("양꼬치")) {
        category = "양꼬치";
      } else if (menuData.name.includes("양고기")) {
        category = "양고기";
      } else if (menuData.name.includes("샤브샤브")) {
        category = "샤브샤브";
      } else if (menuData.name.includes("훠궈")) {
        category = "훠궈";
      }
      
      const menuWithCategory = {
        ...menuData,
        category: category
      };
      
      setMenu(menuWithCategory);
      
      // 메뉴의 storeId를 사용하여 가게 정보 가져오기
      if (menuData.storeId) {
        const storeResponse = await fetch(`http://localhost:8080/api/stores/${menuData.storeId}`);
        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          console.log('백엔드에서 받은 가게 정보:', storeData); // 디버깅용 로그
          setStore(storeData);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (menu) {
      addToCart(menu, quantity);
      alert(`${menu.name} ${quantity}개가 장바구니에 추가되었습니다!`);
      // 장바구니에 추가 후 수량을 1로 리셋
      setQuantity(1);
      
      // NavigationBar의 장바구니 아이콘 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const handleOrderNow = () => {
    // 바로 주문하는 로직
    console.log('바로 주문:', { menu, quantity });
    // TODO: 실제 주문 API 호출
    alert(`${menu.name} ${quantity}개를 주문하겠습니다!`);
  };

  if (!menuId) {
    return (
      <div className="font-sans min-h-screen p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-4">
              메뉴 정보가 없습니다
            </h2>
            <p className="text-yellow-600 dark:text-yellow-300 mb-6">
              올바른 경로로 접속해주세요.
            </p>
            <button 
              onClick={() => router.push('/store')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              가게로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="font-sans min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">메뉴 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-sans min-h-screen p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              오류가 발생했습니다
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={fetchMenu}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                다시 시도
              </button>
              <button 
                onClick={() => router.push('/store')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                가게로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!store || !menu) {
    return (
      <div className="font-sans min-h-screen p-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              정보를 찾을 수 없습니다
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              가게 또는 메뉴 정보가 존재하지 않습니다.
            </p>
            <button 
              onClick={() => router.push('/store')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              가게로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ←
              </button>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg">
                {store.logoUri ? (
                  <img
                    src={getFullImageUrl(store.logoUri)}
                    alt={`${store.name} 로고`}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      console.error('가게 로고 로드 실패:', store.logoUri, '-> 완전한 URL:', getFullImageUrl(store.logoUri));
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      console.log('가게 로고 로드 성공:', store.logoUri, '-> 완전한 URL:', getFullImageUrl(store.logoUri));
                    }}
                  />
                ) : null}
                <div 
                  className="w-12 h-12 flex items-center justify-center text-2xl" 
                  style={{ display: store.logoUri ? 'none' : 'flex' }}
                >
                  🏪
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                <p className="text-sm text-gray-600">{store.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Detail Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Menu Image */}
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
            {menu.imageUri ? (
              <img
                src={getFullImageUrl(menu.imageUri)}
                alt={menu.name}
                className="w-full h-64 object-cover"
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
              className="w-full h-64 flex items-center justify-center text-8xl" 
              style={{ display: menu.imageUri ? 'none' : 'flex' }}
            >
              🍽️
            </div>
          </div>
          
          {/* Menu Info */}
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {menu.category}
              </span>
              <span className="text-2xl font-bold text-red-600">
                ₩{menu.price.toLocaleString()}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{menu.name}</h1>
            <p className="text-lg text-gray-600 mb-8">{menu.description}</p>
            
            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg">
              <span className="text-lg font-medium text-gray-900">수량</span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  -
                </button>
                <span className="text-xl font-bold text-gray-900 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Total Price */}
            <div className="flex items-center justify-between mb-8 p-4 bg-blue-50 rounded-lg">
              <span className="text-lg font-medium text-gray-900">총 금액</span>
              <span className="text-2xl font-bold text-blue-600">
                ₩{(menu.price * quantity).toLocaleString()}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200"
              >
                장바구니에 추가
              </button>
              <button
                onClick={handleOrderNow}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200"
              >
                바로 주문하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
