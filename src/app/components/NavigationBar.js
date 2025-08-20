"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function NavigationBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userNickname, setUserNickname] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 로컬 스토리지에서 로그인 상태 확인
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const nickname = localStorage.getItem('userNickname');
      
      if (token && nickname) {
        setIsLoggedIn(true);
        setUserNickname(nickname);
      } else {
        setIsLoggedIn(false);
        setUserNickname("");
      }
    };

    // 장바구니 아이템 개수 확인
    const updateCartCount = () => {
      try {
        const cart = localStorage.getItem('cart');
        if (cart) {
          const cartItems = JSON.parse(cart);
          const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
          setCartItemCount(totalItems);
        } else {
          setCartItemCount(0);
        }
      } catch (error) {
        console.error('장바구니 개수 업데이트 실패:', error);
        setCartItemCount(0);
      }
    };

    // 초기 상태 확인
    checkLoginStatus();
    updateCartCount();

    // storage 이벤트 리스너 추가
    const handleStorageChange = () => {
      checkLoginStatus();
      updateCartCount();
    };

    // 장바구니 업데이트 이벤트 리스너 추가
    const handleCartUpdate = () => {
      updateCartCount();
    };

    // 주기적으로 장바구니 개수 확인 (1초마다)
    const intervalId = setInterval(updateCartCount, 1000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(intervalId);
    };
  }, []);

  const handleLogout = () => {
    // 로그아웃 처리
    localStorage.removeItem('token');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserNickname("");
    setShowUserMenu(false);
    
    // 로그아웃 상태 강제 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new Event('storage'));
    
    // 홈페이지로 이동
    router.push('/');
  };

  const handleLogin = () => {
    router.push('/login');
  };



  const handleHome = () => {
    router.push('/');
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center cursor-pointer" onClick={handleHome}>
            <Image
              src="/logo.png"
              alt="하이오더 로고"
              width={160}
              height={70}
              className="w-40 h-[70px] object-contain"
            />
          </div>



          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <button
              onClick={() => router.push('/cart')}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
              {/* Cart Item Count Badge */}
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
            
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {userNickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block">{userNickname}</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400">로그인됨</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userNickname}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/mypage');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      마이페이지
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </div>


    </nav>
  );
}
