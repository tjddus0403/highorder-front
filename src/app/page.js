"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 로그인 상태 확인
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const nickname = localStorage.getItem('userNickname');
      
      if (token && nickname) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // storage 이벤트 리스너 추가
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  return (
    <div className="font-sans min-h-screen flex flex-col" style={{ 
      backgroundImage: 'url(/mvbackground.gif)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            {/* CTA Buttons */}
            <div className="flex justify-center items-center mt-48">
              <button
                onClick={() => {
                  if (isLoggedIn) {
                    router.push('/store');
                  } else {
                    router.push('/login');
                  }
                }}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer"
              >
                {isLoggedIn ? '🏪 가게 입장하기' : '🔐 로그인 후 입장'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0.1">
                      <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-0.5">
                <Image
                  src="/logo.png"
                  alt="하이오더 로고"
                  width={96}
                  height={96}
                  className="w-24 h-24 object-contain"
                />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  포 커스토머
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">
                더 나은 음식 경험을 위한 선택
              </p>
              <div className="flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>© 2025 하이오더</span>
              </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
