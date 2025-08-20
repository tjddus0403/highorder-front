"use client";

import { useState, useEffect } from "react";

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  reviewForm, 
  onSubmit, 
  isEdit = false 
}) {
  const [formData, setFormData] = useState({
    comment: '',
    rating: 5
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && reviewForm) {
      setFormData({
        comment: reviewForm.comment || '',
        rating: reviewForm.rating || 5
      });
    }
  }, [isOpen, reviewForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.comment.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('리뷰 저장 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ✍️ {isEdit ? '리뷰 수정' : '리뷰 작성'}
          </h3>
          
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              메뉴: <span className="font-medium text-gray-900 dark:text-white">{reviewForm?.menuName}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              현재 별점: <span className="font-medium text-gray-900 dark:text-white">{formData.rating}점</span>
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                평점
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isSelected = formData.rating >= star;
                  
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className="text-2xl transition-colors duration-200"
                    >
                      <svg 
                        className={`w-6 h-6 transition-colors duration-200 ${
                          isSelected ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                현재 선택된 별점: {formData.rating}점
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                리뷰 내용 *
              </label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                placeholder="맛있었나요? 서비스는 어땠나요? 솔직한 후기를 남겨주세요."
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? '저장 중...' : (isEdit ? '수정하기' : '리뷰 저장')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
