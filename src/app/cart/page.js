"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
    loadCartItems();
  }, []);

  const loadCartItems = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
      setLoading(false);
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
      setLoading(false);
    }
  };

  const saveCartItems = (items) => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('장바구니 저장 실패:', error);
    }
  };

  const updateQuantity = (itemId, change) => {
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        if (newQuantity >= 1 && newQuantity <= 99) {
          return { ...item, quantity: newQuantity };
        }
      }
      return item;
    }).filter(item => item.quantity > 0); // 수량이 0 이하인 아이템 제거

    setCartItems(updatedItems);
    saveCartItems(updatedItems);
  };

  const removeItem = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    saveCartItems(updatedItems);
  };

  const clearCart = () => {
    if (confirm('장바구니를 비우시겠습니까?')) {
      setCartItems([]);
      saveCartItems([]);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    try {
      // 주문 데이터 준비
      const orderData = {
        customerId: parseInt(localStorage.getItem('userId')) || 2, // localStorage에서 사용자 ID 가져오기
        storeId: cartItems[0].storeId, // 첫 번째 아이템의 가게 ID 사용
        items: cartItems.map(item => ({
          menuId: item.id,
          quantity: item.quantity
        }))
      };

      // 백엔드 서버로 주문 요청
      const response = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('주문 처리에 실패했습니다.');
      }

      const result = await response.json();
      console.log('주문 완료:', result);

      // 주문 성공 시 장바구니 비우기
      alert('주문이 완료되었습니다!');
      setCartItems([]);
      saveCartItems([]);
      router.push('/');
      
    } catch (error) {
      console.error('주문 실패:', error);
      alert(`주문 처리 중 오류가 발생했습니다: ${error.message}`);
    }
  };



  if (loading) {
    return (
      <div className="font-sans min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">장바구니를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ←
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">장바구니</h1>
                <p className="text-sm text-gray-600">담긴 메뉴: {cartItems.length}개</p>
              </div>
            </div>
            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
              >
                장바구니 비우기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">장바구니가 비어있습니다</h2>
            <p className="text-gray-600 mb-8">맛있는 메뉴를 담아보세요!</p>
            <button
              onClick={() => router.push('/store')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              가게 둘러보기
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-lg shadow-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="border-b border-gray-200 last:border-b-0 p-6">
                  <div className="flex items-center space-x-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image_uri ? (
                        <img
                          src={getFullImageUrl(item.image_uri)}
                          alt={item.name}
                          className="w-20 h-20 object-cover"
                          onError={(e) => {
                            console.error('장바구니 메뉴 이미지 로드 실패:', item.image_uri, '-> 완전한 URL:', getFullImageUrl(item.image_uri));
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            console.log('장바구니 메뉴 이미지 로드 성공:', item.image_uri, '-> 완전한 URL:', getFullImageUrl(item.image_uri));
                          }}
                        />
                      ) : null}
                      <div 
                        className="w-20 h-20 flex items-center justify-center text-3xl" 
                        style={{ display: item.image_uri ? 'none' : 'flex' }}
                      >
                        🍽️
                      </div>
                    </div>
                    
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      <p className="text-sm text-gray-500">가게: {item.storeName}</p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-gray-900 min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Price and Remove */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600 mb-2">
                        ₩{(item.price * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mb-2">
                        ₩{item.price.toLocaleString()} × {item.quantity}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">주문 요약</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>총 메뉴 수</span>
                  <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}개</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>총 금액</span>
                  <span className="text-lg font-bold text-red-600">₩{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/store')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  더 담기
                </button>
                <button
                  onClick={handleOrder}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
                >
                  주문하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
