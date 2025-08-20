"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProfileTab from "../components/mypage/ProfileTab";
import OrdersTab from "../components/mypage/OrdersTab";
import ReviewsTab from "../components/mypage/ReviewsTab";
import StampsTab from "../components/mypage/StampsTab";
import CouponsTab from "../components/mypage/CouponsTab";
import ReviewModal from "../components/mypage/ReviewModal";
import StampDeleteModal from "../components/mypage/StampDeleteModal";

export default function MyPage() {
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [stamps, setStamps] = useState([]);
  const [stores, setStores] = useState({}); // 가게 정보를 저장할 객체
  const [couponStores, setCouponStores] = useState({}); // 쿠폰 관련 가게 정보를 저장할 객체
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    orderId: null,
    orderItemId: null,
    menuName: '',
    rating: 5,
    comment: ''
  });
  const [showStampDeleteModal, setShowStampDeleteModal] = useState(false);
  const [stampToDelete, setStampToDelete] = useState(null);
  const [stampDeleteLoading, setStampDeleteLoading] = useState(false);
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
      const userResponse = await fetch(`http://localhost:8080/api/customers/${userId}`);
      
      if (!userResponse.ok) {
        throw new Error('사용자 정보를 불러올 수 없습니다.');
      }
      
      const userData = await userResponse.json();
      setUserData(userData);

      // 주문 내역 가져오기
      const ordersResponse = await fetch(`http://localhost:8080/api/orders/customer/${userId}`);
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        console.log('가져온 주문 데이터:', ordersData);
        
        // 첫 번째 주문 객체의 모든 필드 확인
        if (ordersData.length > 0) {
          console.log('첫 번째 주문 객체의 모든 필드:', Object.keys(ordersData[0]));
          console.log('첫 번째 주문 객체 전체:', ordersData[0]);
        }
        
        // 가게별로 주문을 그룹화하기 위해 가게 정보와 메뉴 정보도 함께 가져오기
        const ordersWithStoreInfo = [];
        const storeInfoMap = {}; // 가게 정보를 캐싱할 객체
        const menuInfoMap = {}; // 메뉴 정보를 캐싱할 객체
        
        for (const order of ordersData) {
          try {
            // 가게 정보가 이미 캐싱되어 있으면 사용, 없으면 API 호출
            if (!storeInfoMap[order.storeId]) {
              const storeResponse = await fetch(`http://localhost:8080/api/stores/${order.storeId}`);
              if (storeResponse.ok) {
                const storeData = await storeResponse.json();
                storeInfoMap[order.storeId] = storeData;
              } else {
                // 가게 정보를 가져올 수 없는 경우 기본값 사용
                storeInfoMap[order.storeId] = {
                  id: order.storeId,
                  name: `가게 #${order.storeId}`,
                  description: '가게 정보를 불러올 수 없습니다.'
                };
              }
            }
            
            // 주문 아이템들의 메뉴 정보 가져오기
            const itemsWithMenuInfo = [];
            for (const item of order.items) {
              try {
                // 메뉴 정보가 이미 캐싱되어 있으면 사용, 없으면 API 호출
                if (!menuInfoMap[item.menuId]) {
                  const menuResponse = await fetch(`http://localhost:8080/api/menus/${item.menuId}`);
                  if (menuResponse.ok) {
                    const menuData = await menuResponse.json();
                    menuInfoMap[item.menuId] = menuData;
                  } else {
                    // 메뉴 정보를 가져올 수 없는 경우 기본값 사용
                    menuInfoMap[item.menuId] = {
                      id: item.menuId,
                      name: `메뉴 #${item.menuId}`,
                      description: '메뉴 정보를 불러올 수 없습니다.'
                    };
                  }
                }
                
                // 아이템에 메뉴 정보 추가
                itemsWithMenuInfo.push({
                  ...item,
                  menuName: menuInfoMap[item.menuId].name,
                  menuDescription: menuInfoMap[item.menuId].description
                });
              } catch (err) {
                console.error(`Error fetching menu info for menu ${item.menuId}:`, err);
                // 에러 발생 시 기본값 사용
                itemsWithMenuInfo.push({
                  ...item,
                  menuName: `메뉴 #${item.menuId}`,
                  menuDescription: '메뉴 정보를 불러올 수 없습니다.'
                });
              }
            }
            
            // 주문 데이터에 가게 정보와 메뉴 정보가 추가된 아이템들 추가
            ordersWithStoreInfo.push({
              ...order,
              storeInfo: storeInfoMap[order.storeId],
              items: itemsWithMenuInfo
            });
          } catch (err) {
            console.error(`Error fetching store info for order ${order.orderId}:`, err);
            // 에러 발생 시 기본값 사용
            ordersWithStoreInfo.push({
              ...order,
              storeInfo: {
                id: order.storeId,
                name: `가게 #${order.storeId}`,
                description: '가게 정보를 불러올 수 없습니다.'
              }
            });
          }
        }
        
        console.log('가게 정보가 추가된 주문 데이터:', ordersWithStoreInfo);
        setOrders(ordersWithStoreInfo);
      } else {
        console.error('주문 내역을 가져올 수 없습니다:', ordersResponse.status);
      }

      // 리뷰 내역 가져오기
      const reviewsResponse = await fetch(`http://localhost:8080/api/reviews/customer/${userId}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        
        // 각 리뷰에 대해 메뉴 정보와 수량 정보 가져오기
        const reviewsWithMenuInfo = [];
        for (const review of reviewsData) {
          try {
            // orderItemId를 사용해서 주문 아이템 정보 가져오기 (수량 포함)
            const orderItemResponse = await fetch(`http://localhost:8080/api/orders/items/${review.orderItemId}`);
            if (orderItemResponse.ok) {
              const orderItemData = await orderItemResponse.json();
              
              // 주문 아이템의 menuId를 사용해서 메뉴 정보 가져오기
              const menuResponse = await fetch(`http://localhost:8080/api/menus/${orderItemData.menuId}`);
              if (menuResponse.ok) {
                const menuData = await menuResponse.json();
                reviewsWithMenuInfo.push({
                  ...review,
                  menuName: menuData.name,
                  menuDescription: menuData.description,
                  menuPrice: menuData.price,
                  quantity: orderItemData.quantity
                });
              } else {
                // 메뉴 정보를 가져올 수 없는 경우
                reviewsWithMenuInfo.push({
                  ...review,
                  menuName: `메뉴 #${orderItemData.menuId}`,
                  menuDescription: '메뉴 정보를 불러올 수 없습니다.',
                  menuPrice: 0,
                  quantity: orderItemData.quantity
                });
              }
            } else {
              // 주문 아이템 정보를 가져올 수 없는 경우
              reviewsWithMenuInfo.push({
                ...review,
                menuName: `메뉴 #${review.orderItemId}`,
                menuDescription: '메뉴 정보를 불러올 수 없습니다.',
                menuPrice: 0,
                quantity: 0
              });
            }
          } catch (err) {
            console.error(`Error fetching data for review ${review.id}:`, err);
            // 에러 발생 시 기본값 사용
            reviewsWithMenuInfo.push({
              ...review,
              menuName: `메뉴 #${review.orderItemId}`,
              menuDescription: '메뉴 정보를 불러올 수 없습니다.',
              menuPrice: 0,
              quantity: 0
            });
          }
        }
        
        setReviews(reviewsWithMenuInfo);
      }

      // 쿠폰 정보 가져오기
      const couponsResponse = await fetch(`http://localhost:8080/api/stamps/coupons/${userId}`);
      if (couponsResponse.ok) {
        const couponsData = await couponsResponse.json();
        
        // 쿠폰이 있는 가게들의 정보도 함께 가져오기
        const couponsWithStoreInfo = [];
        const storesForCoupons = {};
        
        for (const coupon of couponsData) {
          try {
            const storeResponse = await fetch(`http://localhost:8080/api/stores/${coupon.storeId}`);
            if (storeResponse.ok) {
              const storeData = await storeResponse.json();
              const storeName = storeData.name || `가게 #${coupon.storeId}`;
              const storeDescription = storeData.description || '가게 정보를 불러올 수 없습니다.';
              
              // 가게 정보를 별도로 저장
              storesForCoupons[coupon.storeId] = {
                name: storeName,
                description: storeDescription
              };
              
              couponsWithStoreInfo.push({
                ...coupon,
                storeName: storeName,
                storeDescription: storeDescription
              });
            } else {
              // 가게 정보를 가져올 수 없는 경우 기본값 사용
              const storeName = `가게 #${coupon.storeId}`;
              const storeDescription = '가게 정보를 불러올 수 없습니다.';
              
              storesForCoupons[coupon.storeId] = {
                name: storeName,
                description: storeDescription
              };
              
              couponsWithStoreInfo.push({
                ...coupon,
                storeName: storeName,
                storeDescription: storeDescription
              });
            }
          } catch (err) {
            console.error(`Error fetching store for coupon ${coupon.id}:`, err);
            // 에러 발생 시 기본값 사용
            const storeName = `가게 #${coupon.storeId}`;
            const storeDescription = '가게 정보를 불러올 수 없습니다.';
            
            storesForCoupons[coupon.storeId] = {
              name: storeName,
              description: storeDescription
            };
            
            couponsWithStoreInfo.push({
              ...coupon,
              storeName: storeName,
              storeDescription: storeDescription
            });
          }
        }
        
        setCoupons(couponsWithStoreInfo);
        setCouponStores(storesForCoupons);
      }

      // 스탬프 정보 가져오기
      const stampsResponse = await fetch(`http://localhost:8080/api/stamps/list/${userId}`);
      if (stampsResponse.ok) {
        const stampsData = await stampsResponse.json();
        console.log('가져온 스탬프 데이터:', stampsData);
        console.log('첫 번째 스탬프 객체 구조:', stampsData[0]);
        setStamps(stampsData);
        
        // 스탬프가 있는 가게들의 정보 가져오기
        const storesData = {};
        for (const stamp of stampsData) {
          try {
            const storeResponse = await fetch(`http://localhost:8080/api/stores/${stamp.storeId}`);
            if (storeResponse.ok) {
              const storeData = await storeResponse.json();
              storesData[stamp.storeId] = storeData;
            }
          } catch (err) {
            console.error(`Error fetching store ${stamp.storeId}:`, err);
          }
        }
        setStores(storesData);
      }
      
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
    
    // 로그아웃 상태 강제 업데이트를 위한 커스텀 이벤트 발생
    window.dispatchEvent(new Event('localStorageChange'));
    
    // 홈페이지로 이동
    router.push('/');
  };

  const handleEditProfile = (updatedUser) => {
    setUserData(updatedUser);
  };

  // 쿠폰 사용 처리 (백엔드에서 상태 업데이트)
  const handleUseCoupon = async (couponId) => {
    if (!confirm('이 쿠폰을 사용하시겠습니까?')) {
      return;
    }

    try {
      // 백엔드에 쿠폰 사용 상태 업데이트 요청
      const response = await fetch(`http://localhost:8080/api/stamps/coupons/${couponId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          used: true
        })
      });

      if (!response.ok) {
        throw new Error('쿠폰 상태 업데이트에 실패했습니다.');
      }

      // 성공 시 프론트엔드 상태도 업데이트
      setCoupons(prevCoupons => 
        prevCoupons.map(coupon => 
          coupon.id === couponId 
            ? { ...coupon, used: true }
            : coupon
        )
      );

      alert('쿠폰이 성공적으로 사용되었습니다!');
      
    } catch (error) {
      console.error('쿠폰 사용 실패:', error);
      alert(`쿠폰 사용 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 스탬프 삭제 확인 모달 열기
  const handleStampDeleteClick = (stamp) => {
    console.log('스탬프 삭제 버튼 클릭됨:', stamp);
    console.log('현재 showStampDeleteModal 상태:', showStampDeleteModal);
    setStampToDelete(stamp);
    setShowStampDeleteModal(true);
    console.log('모달 상태를 true로 설정했습니다');
  };

  // 스탬프 삭제 처리
  const handleDeleteStamp = async () => {
    if (!stampToDelete) return;

    try {
      setStampDeleteLoading(true);
      
      const response = await fetch(`http://localhost:8080/api/stamps/${stampToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('스탬프 삭제에 실패했습니다.');
      }

      // 성공 시 프론트엔드 상태도 업데이트
      setStamps(prevStamps => 
        prevStamps.filter(stamp => stamp.id !== stampToDelete.id)
      );

      // 모달 닫기
      setShowStampDeleteModal(false);
      setStampToDelete(null);
      
      alert('스탬프가 성공적으로 삭제되었습니다!');
      
    } catch (error) {
      console.error('스탬프 삭제 실패:', error);
      alert(`스탬프 삭제 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setStampDeleteLoading(false);
    }
  };

  // 쿠폰 삭제 처리
  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('정말로 이 쿠폰을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/stamps/coupons/${couponId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('쿠폰 삭제에 실패했습니다.');
      }

      // 백엔드에서 최신 쿠폰 상태를 다시 받아옴
      const userId = localStorage.getItem('userId');
      const couponsResponse = await fetch(`http://localhost:8080/api/stamps/coupons/${userId}`);
      if (couponsResponse.ok) {
        const updatedCoupons = await couponsResponse.json();
        setCoupons(updatedCoupons);
      }

      alert('쿠폰이 성공적으로 삭제되었습니다!');
      
    } catch (error) {
      console.error('쿠폰 삭제 실패:', error);
      alert(`쿠폰 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 리뷰 작성/수정 모달 열기
  const handleReviewClick = (orderId, orderItemId, menuName) => {
    setReviewForm({
      orderId: orderId,
      orderItemId: orderItemId,
      menuName: menuName,
      rating: 5,
      comment: ''
    });
    setShowReviewModal(true);
  };

  // 리뷰 제출
  const handleReviewSubmit = async (formData) => {
    try {
      const userId = localStorage.getItem('userId');
      
      // 리뷰가 이미 있는지 확인
      const existingReview = reviews.find(r => r.orderItemId === reviewForm.orderItemId);
      
      let response;
      if (existingReview) {
        // 기존 리뷰 수정 - PUT 요청
        const updateData = {
          rating: formData.rating,
          comment: formData.comment
        };
        
        response = await fetch(`http://localhost:8080/api/reviews/${existingReview.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        });
      } else {
        // 새 리뷰 작성 - POST 요청
        const createData = {
          customerId: userId,
          orderItemId: reviewForm.orderItemId,
          rating: formData.rating,
          comment: formData.comment
        };
        
        response = await fetch(`http://localhost:8080/api/reviews`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData)
        });
      }

      if (!response.ok) {
        throw new Error('리뷰 저장에 실패했습니다.');
      }

      // 성공 시 리뷰 목록 새로고침
      await checkAuthAndLoadUserData();
      
      // 성공 메시지
      alert(existingReview ? '리뷰가 성공적으로 수정되었습니다!' : '리뷰가 성공적으로 작성되었습니다!');
      
    } catch (error) {
      console.error('리뷰 저장 실패:', error);
      alert(`리뷰 저장 중 오류가 발생했습니다: ${error.message}`);
      throw error;
    }
  };

  // 특정 주문 아이템에 리뷰가 있는지 확인
  const hasReview = (orderItemId) => {
    return reviews.some(review => review.orderItemId === orderItemId);
  };

  // 리뷰 수정 모달 열기
  const handleReviewEdit = (review) => {
    console.log('리뷰 수정 모달 열기:', review);
    console.log('기존 별점:', review.rating);
    
    setReviewForm({
      orderId: null,
      orderItemId: review.orderItemId,
      menuName: review.menuName,
      rating: review.rating,
      comment: review.comment
    });
    
    setShowReviewModal(true);
  };

  // 리뷰 삭제
  const handleReviewDelete = async (reviewId) => {
    if (!confirm('정말로 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('리뷰 삭제에 실패했습니다.');
      }

      // 성공 시 리뷰 목록 새로고침
      await checkAuthAndLoadUserData();
      
      alert('리뷰가 성공적으로 삭제되었습니다!');
      
    } catch (error) {
      console.error('리뷰 삭제 실패:', error);
      alert(`리뷰 삭제 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'profile', name: '프로필', icon: '👤' },
    { id: 'orders', name: '주문내역', icon: '📋' },
    { id: 'reviews', name: '리뷰', icon: '⭐' },
    { id: 'stamps', name: '스탬프', icon: '🏷️' },
    { id: 'coupons', name: '쿠폰', icon: '🎫' }
  ];

  if (loading) {
    return (
      <div className="font-sans bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="font-sans bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-20">
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
      <div className="font-sans bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">사용자 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans bg-gray-50 dark:bg-gray-900">
      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        reviewForm={reviewForm}
        onSubmit={handleReviewSubmit}
        isEdit={reviews.find(r => r.orderItemId === reviewForm.orderItemId) ? true : false}
      />

      {/* Stamp Delete Confirmation Modal */}
      <StampDeleteModal
        isOpen={showStampDeleteModal}
        onClose={() => {
          setShowStampDeleteModal(false);
          setStampToDelete(null);
        }}
        stampToDelete={stampToDelete}
        stores={stores}
        onDelete={handleDeleteStamp}
        loading={stampDeleteLoading}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            👤 마이페이지
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            회원 정보를 확인하고 관리하세요
          </p>
          
          {/* 가게로 돌아가기 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/store')}
              className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🏪 가게로 돌아가기
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'profile' && (
            <ProfileTab
              userData={userData}
              orders={orders}
              reviews={reviews}
              coupons={coupons}
              onEditProfile={handleEditProfile}
              onLogout={handleLogout}
            />
          )}
          {activeTab === 'orders' && (
            <OrdersTab
              orders={orders}
              onReviewClick={handleReviewClick}
              hasReview={hasReview}
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab
              reviews={reviews}
              orders={orders}
              onReviewEdit={handleReviewEdit}
              onReviewDelete={handleReviewDelete}
            />
          )}
          {activeTab === 'stamps' && (
            <StampsTab
              stamps={stamps}
              stores={stores}
              onStampDeleteClick={handleStampDeleteClick}
            />
          )}
          {activeTab === 'coupons' && (
            <CouponsTab
              coupons={coupons}
              couponStores={couponStores}
              onUseCoupon={handleUseCoupon}
              onDeleteCoupon={handleDeleteCoupon}
            />
          )}
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
