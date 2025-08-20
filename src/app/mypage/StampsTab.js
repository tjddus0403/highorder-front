"use client";

export default function StampsTab({ stamps, stores, onStampDeleteClick }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          🏷️ 스탬프 현황
        </h3>
        
        {stamps.length > 0 ? (
          <div className="space-y-8">
            {stamps.map((stamp) => {
              const store = stores[stamp.storeId];
              return (
                <div key={stamp.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 relative">
                  {/* 삭제 버튼 (우측 상단) */}
                  <button
                    onClick={() => onStampDeleteClick(stamp)}
                    className="absolute top-3 right-3 w-8 h-8 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors duration-200 z-10"
                    title="스탬프 삭제"
                  >
                    ✕
                  </button>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {store ? store.name : `가게 #${stamp.storeId}`}
                      </h4>
                      {store && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {store.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right pr-12">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stamp.count}/10
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stamp.count >= 10 ? '쿠폰 발급 완료!' : `${10 - stamp.count}개 더 모으면 쿠폰!`}
                      </p>
                    </div>
                  </div>
                  
                  {/* 스탬프 시각화 */}
                  <div className="grid grid-cols-10 gap-2 mb-4">
                    {Array.from({ length: 10 }, (_, index) => (
                      <div
                        key={index}
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                          index < stamp.count
                            ? 'bg-blue-500 border-blue-600 text-white shadow-lg transform scale-110'
                            : 'bg-gray-100 border-gray-300 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                        }`}
                      >
                        {index < stamp.count ? '✓' : index + 1}
                      </div>
                    ))}
                  </div>
                  
                  {/* 진행률 바 */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(stamp.count / 10) * 100}%` }}
                    ></div>
                  </div>
                  
                  {/* 상태 메시지 */}
                  <div className={`text-center p-3 rounded-lg ${
                    stamp.count >= 10 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  }`}>
                    <p className={`font-medium ${
                      stamp.count >= 10 
                        ? 'text-green-800 dark:text-green-200' 
                        : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {stamp.count >= 10 
                        ? '🎉 축하합니다! 쿠폰이 발급되었습니다!' 
                        : `💪 ${10 - stamp.count}개 더 모으면 쿠폰을 받을 수 있어요!`
                      }
                    </p>
                  </div>
                  
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏷️</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">아직 스탬프가 없습니다.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">가게 방문으로 스탬프를 모아보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
