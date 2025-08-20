"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadUserData();
  }, []);

  const checkAuthAndLoadUserData = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      // 로그인되지 않은 경우 로그인 페이지로 이동
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 백엔드에서 최신 사용자 정보 가져오기
      const response = await fetch(`http://localhost:8080/api/customers/${userId}`);
      
      if (!response.ok) {
        throw new Error('사용자 정보를 불러올 수 없습니다.');
      }
      
      const data = await response.json();
      setUserData(data);
      
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('사용자 정보를 불러오는데 실패했습니다.');
      
      // 로컬 스토리지의 정보로 폴백
      const fallbackData = {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        nickname: localStorage.getItem('userNickname')
      };
      
      if (fallbackData.id && fallbackData.name) {
        setUserData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // 로그아웃 처리
    localStorage.removeItem('token');
    localStorage.removeItem('userNickname');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    
    // 로그아웃 상태 강제 업데이트를 위한 이벤트 발생
    window.dispatchEvent(new Event('storage'));
    
    // 홈페이지로 이동
    router.push('/');
  };

  const handleEditProfile = () => {
    // 프로필 편집 페이지로 이동 (아직 구현되지 않음)
    console.log("프로필 편집 페이지로 이동");
    // router.push("/mypage/edit");
  };

  if (loading) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
              오류가 발생했습니다
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
            <button 
              onClick={checkAuthAndLoadUserData}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">사용자 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            👤 마이페이지
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            회원 정보를 확인하고 관리하세요
          </p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {userData.nickname ? userData.nickname.charAt(0).toUpperCase() : userData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center">
              {userData.nickname || userData.name}
            </h2>
            <p className="text-blue-100 text-center">
              {userData.email}
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  기본 정보
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">사용자 ID</span>
                    <span className="font-medium text-gray-900 dark:text-white">{userData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">이름</span>
                    <span className="font-medium text-gray-900 dark:text-white">{userData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">닉네임</span>
                    <span className="font-medium text-gray-900 dark:text-white">{userData.nickname || '설정되지 않음'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">이메일</span>
                    <span className="font-medium text-gray-900 dark:text-white">{userData.email}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  계정 정보
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">가입일</span>
                    <span className="font-medium text-gray-900 dark:text-white">2024년 1월</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">마지막 로그인</span>
                    <span className="font-medium text-gray-900 dark:text-white">방금 전</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">계정 상태</span>
                    <span className="font-medium text-green-600 dark:text-green-400">활성</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleEditProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            ✏️ 프로필 편집
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            🚪 로그아웃
          </button>
        </div>

        {/* User Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Visited Stores */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              🏪 방문한 가게
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">김밥천국</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">2024.01.15 방문</p>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">족발의달인</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">2024.01.10 방문</p>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
              </div>
            </div>
            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
              전체 보기 →
            </button>
          </div>

          {/* Reviews */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              ⭐ 내 리뷰
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-500">⭐⭐⭐⭐⭐</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">김밥천국</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">김밥이 정말 맛있어요!</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-yellow-500">⭐⭐⭐⭐</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">족발의달인</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">족발이 쫄깃하고 맛있습니다</p>
              </div>
            </div>
            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
              전체 보기 →
            </button>
          </div>

          {/* Order History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              📋 주문 내역
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">김밥 + 라면</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">2024.01.15</p>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm">₩7,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">족발 1마리</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">2024.01.10</p>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm">₩25,000</span>
              </div>
            </div>
            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
              전체 보기 →
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            문의사항이 있으시면 고객센터로 연락해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
