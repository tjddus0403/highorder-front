"use client";

export default function ReviewsTab({ reviews, orders, onReviewEdit, onReviewDelete }) {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = i <= rating;
      stars.push(
        <svg 
          key={i} 
          className={`w-5 h-5 ${isActive ? "text-yellow-500" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  // 가게별로 리뷰를 그룹화
  const reviewsByStore = {};
  reviews.forEach(review => {
    // 리뷰에서 가게 정보를 찾기 위해 주문 데이터를 확인
    const order = orders.find(o => 
      o.items.some(item => item.orderItemId === review.orderItemId)
    );
    
    if (order) {
      const storeId = order.storeId;
      if (!reviewsByStore[storeId]) {
        reviewsByStore[storeId] = {
          storeInfo: order.storeInfo,
          reviews: []
        };
      }
      reviewsByStore[storeId].reviews.push({
        ...review,
        storeInfo: order.storeInfo,
        orderData: order // 주문 데이터 추가
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          ⭐ 내 리뷰 ({reviews.length}건)
        </h3>
        
        {reviews.length > 0 ? (
          <div className="space-y-8">
            {Object.entries(reviewsByStore).map(([storeId, storeData]) => {
              // 해당 가게의 리뷰들을 날짜별로 그룹화
              const reviewsByDate = {};
              storeData.reviews.forEach(review => {
                // 주문 날짜를 기준으로 그룹화 (orderedAt 사용)
                const orderDate = review.orderData.orderedAt || review.orderData.createdAt || review.orderData.orderDate || new Date().toISOString();
                const dateKey = new Date(orderDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
                
                if (!reviewsByDate[dateKey]) {
                  reviewsByDate[dateKey] = {
                    date: orderDate,
                    dateKey: dateKey,
                    reviews: []
                  };
                }
                reviewsByDate[dateKey].reviews.push(review);
              });

              // 각 날짜 그룹 내에서 리뷰들을 시간 순서대로 정렬 (orderedAt 기준)
              Object.keys(reviewsByDate).forEach(dateKey => {
                reviewsByDate[dateKey].reviews.sort((a, b) => {
                  const timeA = new Date(a.orderData.orderedAt || a.orderData.createdAt || a.orderData.orderDate || 0);
                  const timeB = new Date(b.orderData.orderedAt || b.orderData.createdAt || b.orderData.orderDate || 0);
                  return timeA - timeB; // 오전 → 오후 순서
                });
              });

              // 날짜별로 정렬 (최신 날짜가 위로)
              const sortedDates = Object.keys(reviewsByDate).sort((a, b) => {
                return new Date(reviewsByDate[b].date) - new Date(reviewsByDate[a].date);
              });

              return (
                <div key={storeId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  {/* 가게 정보 헤더 */}
                  <div className="border-b border-gray-200 dark:border-gray-600 pb-4 mb-6">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      🏪 {storeData.storeInfo.name}
                    </h4>
                    {storeData.storeInfo.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {storeData.storeInfo.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      총 {storeData.reviews.length}개의 리뷰
                    </p>
                  </div>
                  
                  {/* 날짜별로 그룹화된 리뷰들 */}
                  <div className="space-y-6">
                    {sortedDates.map((dateKey) => {
                      const dateData = reviewsByDate[dateKey];
                      
                      // 같은 날짜 내에서 시간별로 리뷰를 그룹화 (1시간 단위)
                      const reviewsByTime = {};
                      dateData.reviews.forEach(review => {
                        const orderTime = new Date(review.orderData.orderedAt || review.orderData.createdAt || review.orderData.orderDate);
                        const timeKey = orderTime.toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        });
                        
                        if (!reviewsByTime[timeKey]) {
                          reviewsByTime[timeKey] = {
                            time: orderTime,
                            timeKey: timeKey,
                            reviews: []
                          };
                        }
                        reviewsByTime[timeKey].reviews.push(review);
                      });

                      // 시간별로 정렬 (오전 → 오후 순서)
                      const sortedTimes = Object.keys(reviewsByTime).sort((a, b) => {
                        return new Date(reviewsByTime[a].time) - new Date(reviewsByTime[b].time);
                      });

                      return (
                        <div key={dateKey} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          {/* 날짜 헤더 */}
                          <div className="border-b border-blue-200 dark:border-blue-700 pb-3 mb-4">
                            <h5 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                              📅 {dateKey}
                            </h5>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {dateData.reviews.length}개의 리뷰
                            </p>
                          </div>
                          
                          {/* 시간별로 그룹화된 리뷰들 */}
                          <div className="space-y-4">
                            {sortedTimes.map((timeKey) => {
                              const timeData = reviewsByTime[timeKey];
                              const totalRating = timeData.reviews.reduce((sum, review) => sum + review.rating, 0);
                              const avgRating = Math.round(totalRating / timeData.reviews.length);
                              
                              return (
                                <div key={timeKey} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                  {/* 시간 헤더 */}
                                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-green-200 dark:border-green-700">
                                    <h6 className="text-md font-bold text-green-800 dark:text-green-200">
                                      🕐 {timeKey}
                                    </h6>
                                    <div className="text-right">
                                      <div className="flex items-center">
                                        {renderStars(avgRating)}
                                      </div>
                                      <p className="text-xs text-green-600 dark:text-green-400">
                                        평균 {avgRating}점
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* 해당 시간의 리뷰들 */}
                                  <div className="space-y-2">
                                    {timeData.reviews.map((review) => (
                                      <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-green-100 dark:border-green-800">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center">
                                            <div className="flex mr-2">
                                              {renderStars(review.rating)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                              {review.menuName}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {review.quantity}개
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
                                        
                                        {/* 리뷰 액션 버튼들 */}
                                        <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                          <button
                                            onClick={() => onReviewEdit(review)}
                                            className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
                                          >
                                            수정
                                          </button>
                                          <button
                                            onClick={() => onReviewDelete(review.id)}
                                            className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors duration-200"
                                          >
                                            삭제
                                          </button>
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">아직 작성한 리뷰가 없습니다.</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">주문 후 맛있는 리뷰를 남겨보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
