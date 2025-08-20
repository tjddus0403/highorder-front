"use client";

export default function StampDeleteModal({ 
  isOpen, 
  onClose, 
  stampToDelete, 
  stores, 
  onDelete, 
  loading 
}) {
  if (!isOpen || !stampToDelete) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
            스탬프 삭제 확인
          </h3>
          
          <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              <strong>{stores[stampToDelete.storeId] ? stores[stampToDelete.storeId].name : `가게 #${stampToDelete.storeId}`}</strong>의 
              모든 스탬프를 삭제하시겠습니까?
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">
                <strong>⚠️ 주의사항:</strong>
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 mt-2 space-y-1">
                <li>• 해당 가게에 적립된 모든 스탬프가 삭제됩니다</li>
                <li>• 삭제된 스탬프는 복구할 수 없습니다</li>
                <li>• 현재 {stampToDelete.count || 0}개 스탬프가 사라집니다</li>
              </ul>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? '삭제 중...' : '삭제하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
