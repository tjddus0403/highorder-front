"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

export default function NavigationBar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userNickname, setUserNickname] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 앱 시작 시 로그인 상태 초기화 (로그아웃 상태로 시작)
    const initializeApp = () => {
      // localStorage에서 로그인 정보 제거
      localStorage.removeItem('token');
      localStorage.removeItem('userNickname');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      
      // 로그아웃 상태로 설정
      setIsLoggedIn(false);
      setUserNickname("");
    };

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

    // 앱 시작 시 초기화
    initializeApp();

    // storage 이벤트 리스너 추가 (다른 탭에서의 변경 감지)
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    // 같은 탭에서의 localStorage 변경 감지를 위한 커스텀 이벤트 리스너
    const handleCustomStorageChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageChange', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange);
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
    
    // 로그아웃 상태 강제 업데이트를 위한 커스텀 이벤트 발생
    window.dispatchEvent(new Event('localStorageChange'));
    
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
                className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
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
