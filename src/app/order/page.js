"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function OrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const storeId = searchParams.get('storeId');
  const orderItemsParam = searchParams.get('orderItems');
  const [orderItems, setOrderItems] = useState([]);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderItemsParam) {
      try {
        const items = JSON.parse(decodeURIComponent(orderItemsParam));
        setOrderItems(items);
        if (items.length > 0) {
          setStoreName(items[0].storeName);
        }
        setLoading(false);
      } catch (error) {
        console.error('주문 아이템 파싱 실패:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [orderItemsParam]);

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleOrder = async () => {
    if (orderItems.length === 0) {
      alert('주문할 메뉴가 없습니다.');
      return;
    }

    try {
      // 주문 데이터 준비
      const orderData = {
        customerId: parseInt(localStorage.getItem('userId')) || 2, // localStorage에서 사용자 ID 가져오기
        storeId: parseInt(storeId),
        items: orderItems.map(item => ({
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
      localStorage.removeItem('cart');
      
      // NavigationBar의 장바구니 아이콘 업데이트를 위한 이벤트 발생
      window.dispatchEvent(new Event('cartUpdated'));
      
      alert('주문이 완료되었습니다!');
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
          <p className="text-lg text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!orderItems || orderItems.length === 0) {
    return (
      <div className="font-sans min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">주문할 메뉴가 없습니다</h2>
          <p className="text-gray-600 mb-8">장바구니에 메뉴를 담아주세요.</p>
          <button
            onClick={() => router.push('/store')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            가게로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mt-16">
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
                <h1 className="text-3xl font-bold text-gray-900">📋 주문하기</h1>
                <p className="text-sm text-gray-600">{storeName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 p-6 border-b border-gray-200">주문 메뉴</h2>
            {orderItems.map((item) => (
              <div key={item.id} className="border-b border-gray-200 last:border-b-0 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₩{item.price.toLocaleString()} × {item.quantity}
                    </p>
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
                <span>{orderItems.reduce((total, item) => total + item.quantity, 0)}개</span>
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
                주문 완료하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
