"use client";

export default function OrdersTab({ orders, onReviewClick, hasReview }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatOrderTime = (dateString) => {
    if (!dateString) return '시각 정보 없음';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '시각 정보 없음';
    
    return date.toLocaleString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 가게별로 주문을 그룹화
  const ordersByStore = {};
  orders.forEach(order => {
    const storeId = order.storeId;
    if (!ordersByStore[storeId]) {
      ordersByStore[storeId] = {
        storeInfo: order.storeInfo,
        orders: []
      };
    }
    ordersByStore[storeId].orders.push(order);
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          📋 주문 내역 ({orders.length}건)
        </h3>
        
        {orders.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(ordersByStore).map(([storeId, storeData]) => {
              // 해당 가게의 주문들을 날짜별로 그룹화
              const ordersByDate = {};
              storeData.orders.forEach(order => {
                // 주문 날짜 추출 (orderedAt 필드 사용)
                const orderDate = order.orderedAt || order.createdAt || order.orderDate || new Date().toISOString();
                const dateKey = new Date(orderDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
                
                if (!ordersByDate[dateKey]) {
                  ordersByDate[dateKey] = {
                    date: orderDate,
                    dateKey: dateKey,
                    orders: []
                  };
                }
                ordersByDate[dateKey].orders.push(order);
              });

              // 각 날짜 그룹 내에서 주문들을 시간 순서대로 정렬 (orderedAt 기준)
              Object.keys(ordersByDate).forEach(dateKey => {
                ordersByDate[dateKey].orders.sort((a, b) => {
                  const timeA = new Date(a.orderedAt || a.createdAt || a.orderDate || 0);
                  const timeB = new Date(b.orderedAt || b.createdAt || b.orderDate || 0);
                  return timeA - timeB; // 오전 → 오후 순서
                });
              });

              // 날짜별로 정렬 (최신 날짜가 위로)
              const sortedDates = Object.keys(ordersByDate).sort((a, b) => {
                return new Date(ordersByDate[b].date) - new Date(ordersByDate[a].date);
              });

              return (
                <div key={storeId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  {/* 가게 정보 헤더 */}
                  <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-6">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      🏪 {storeData.storeInfo.name}
                    </h4>
                    {storeData.storeInfo.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {storeData.storeInfo.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      총 {storeData.orders.length}건의 주문
                    </p>
                  </div>
                  
                  {/* 날짜별로 그룹화된 주문들 */}
                  <div className="space-y-6">
                    {sortedDates.map((dateKey) => {
                      const dateData = ordersByDate[dateKey];
                      const totalPriceForDate = dateData.orders.reduce((sum, order) => sum + order.totalPrice, 0);
                      const totalItemsForDate = dateData.orders.reduce((sum, order) => sum + order.items.length, 0);
                      
                      return (
                        <div key={dateKey} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          {/* 날짜 헤더 */}
                          <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-200 dark:border-blue-700">
                            <h5 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                              📅 {dateKey}
                            </h5>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                ₩{formatPrice(totalPriceForDate)}
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                총 {totalItemsForDate}개 메뉴
                              </p>
                            </div>
                          </div>
                          
                          {/* 해당 날짜의 주문들 */}
                          <div className="space-y-3">
                            {dateData.orders.map((order) => (
                              <div key={order.orderId} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                                <div className="flex justify-between items-center mb-2">
                                  <h6 className="text-md font-semibold text-gray-900 dark:text-white">
                                    🕐 {formatOrderTime(order.orderedAt || order.createdAt || order.orderDate)}
                                  </h6>
                                  <div className="text-right">
                                    <p className="text-md font-bold text-green-600 dark:text-green-400">
                                      ₩{formatPrice(order.totalPrice)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {order.items.length}개 메뉴
                                    </p>
                                  </div>
                                </div>
                                
                                {/* 주문한 메뉴들 */}
                                <div className="space-y-1">
                                  {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                          {item.menuName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          수량: {item.quantity}개
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                          ₩{formatPrice(item.price)}
                                        </span>
                                        {/* 리뷰 작성 버튼 */}
                                        <button
                                          onClick={() => onReviewClick(order.orderId, item.orderItemId, item.menuName)}
                                          disabled={hasReview(item.orderItemId)}
                                          className={`px-2 py-1 text-xs rounded-md transition-colors duration-200 ${
                                            hasReview(item.orderItemId)
                                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                              : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                                          }`}
                                        >
                                          {hasReview(item.orderItemId) ? '리뷰 완료' : '리뷰 작성'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">아직 주문 내역이 없습니다.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">첫 주문을 시작해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
