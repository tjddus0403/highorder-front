"use client";

export default function CouponsTab({ coupons, couponStores, onUseCoupon, onDeleteCoupon }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // 가게별로 쿠폰 그룹화 (storeId 기준)
  const couponsByStoreId = {};
  coupons.forEach(coupon => {
    if (!couponsByStoreId[coupon.storeId]) {
      couponsByStoreId[coupon.storeId] = [];
    }
    couponsByStoreId[coupon.storeId].push(coupon);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          🎫 보유 쿠폰 ({coupons.filter(c => !c.used).length}개)
        </h3>
        
        {coupons.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(couponsByStoreId).map(([storeId, storeCoupons]) => {
              const availableCount = storeCoupons.filter(c => !c.used).length;
              const usedCount = storeCoupons.filter(c => c.used).length;
              const storeInfo = couponStores[storeId];
              
              return (
                <div key={storeId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {storeInfo?.name || `가게 #${storeId}`}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        총 {storeCoupons.length}개 쿠폰 보유
                      </p>
                      {storeInfo?.description && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {storeInfo.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {availableCount}개
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        사용 가능한 쿠폰
                      </p>
                    </div>
                  </div>
                  
                  {/* 쿠폰 목록 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {storeCoupons.map((coupon) => (
                      <div key={coupon.id} className={`border-2 rounded-lg p-4 transition-all duration-300 ${
                        coupon.used 
                          ? 'border-gray-300 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 opacity-75' 
                          : 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-600 shadow-md hover:shadow-lg'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            coupon.used 
                              ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300' 
                              : 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-200'
                          }`}>
                            {coupon.used ? '사용됨' : '사용가능'}
                          </span>
                        </div>
                        <p className={`text-sm ${
                          coupon.used ? 'text-gray-400 dark:text-gray-500' : 'text-green-600 dark:text-green-300'
                        }`}>
                          발급일: {formatDate(coupon.issuedAt)}
                        </p>
                        {!coupon.used && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            💡 방문 시 사용 가능합니다
                          </p>
                        )}
                        
                        {/* 버튼 영역 */}
                        <div className="mt-3 flex justify-end">
                          {!coupon.used ? (
                            <button
                              onClick={() => onUseCoupon(coupon.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                            >
                              🎫 쿠폰 사용하기
                            </button>
                          ) : (
                            <button
                              onClick={() => onDeleteCoupon(coupon.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                            >
                              ❌ 쿠폰 삭제하기
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 가게별 요약 정보 */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        사용 가능: <span className="font-semibold text-green-600 dark:text-green-400">{availableCount}개</span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        사용 완료: <span className="text-semibold text-gray-500 dark:text-gray-400">{usedCount}개</span>
                      </span>
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">보유한 쿠폰이 없습니다.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">가게 방문으로 쿠폰을 획득해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
