"use client";

import { useState } from "react";

export default function ProfileTab({ userData, orders, reviews, coupons, onEditProfile, onLogout }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    password: '',
    nickname: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  const handleEditProfile = () => {
    setEditForm({
      password: '',
      nickname: userData?.nickname || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    if (!editForm.password.trim() || !editForm.nickname.trim()) {
      alert('비밀번호와 닉네임을 모두 입력해주세요.');
      return;
    }

    try {
      setEditLoading(true);
      
      const userId = localStorage.getItem('userId');
      const response = await fetch(`http://localhost:8080/api/customers/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: editForm.password,
          nickname: editForm.nickname
        })
      });

      if (!response.ok) {
        throw new Error('회원정보 수정에 실패했습니다.');
      }

      const updatedUser = await response.json();
      
      // 로컬 스토리지 업데이트
      localStorage.setItem('userNickname', updatedUser.nickname);
      
      // 부모 컴포넌트에 업데이트된 사용자 데이터 전달
      onEditProfile(updatedUser);
      
      // 모달 닫기
      setShowEditModal(false);
      
      // 성공 메시지
      alert('회원정보가 성공적으로 수정되었습니다!');
      
    } catch (error) {
      console.error('회원정보 수정 실패:', error);
      alert(`회원정보 수정 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* User Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
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
                통계 정보
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 주문 수</span>
                  <span className="font-medium text-gray-900 dark:text-white">{orders.length}건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 리뷰 수</span>
                  <span className="font-medium text-gray-900 dark:text-white">{reviews.length}건</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">보유 쿠폰</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{coupons.filter(c => !c.used).length}개</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleEditProfile}
          className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          ✏️ 프로필 편집
        </button>
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          🚪 로그아웃
        </button>
      </div>

      {/* Profile Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ✏️ 프로필 편집
              </h3>
              
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    현재 이름
                  </label>
                  <input
                    type="text"
                    value={userData?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    이름은 변경할 수 없습니다
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    새 비밀번호 *
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    placeholder="새 비밀번호를 입력하세요"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    닉네임 *
                  </label>
                  <input
                    type="text"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                    placeholder="닉네임을 입력하세요"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {editLoading ? '수정 중...' : '수정하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
