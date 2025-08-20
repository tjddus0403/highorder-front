"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    password: '',
    nickname: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [showStampDeleteModal, setShowStampDeleteModal] = useState(false);
  const [stampToDelete, setStampToDelete] = useState(null);
  const [stampDeleteLoading, setStampDeleteLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    orderId: null,
    orderItemId: null,
    menuName: '',
    rating: 5,
    comment: ''
  });
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
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
      
      // 사용자 데이터 업데이트
      setUserData(updatedUser);
      
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
    setSelectedRating(5);
    setForceUpdate(0);
    setShowReviewModal(true);
  };

  // 리뷰 제출
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.comment.trim()) {
      alert('리뷰 내용을 입력해주세요.');
      return;
    }

    try {
      setReviewLoading(true);
      
      const userId = localStorage.getItem('userId');
      
      // 리뷰가 이미 있는지 확인
      const existingReview = reviews.find(r => r.orderItemId === reviewForm.orderItemId);
      
      let response;
      if (existingReview) {
        // 기존 리뷰 수정 - PUT 요청
        const updateData = {
          rating: selectedRating,
          comment: reviewForm.comment
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
          rating: selectedRating,
          comment: reviewForm.comment
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
      
      // 모달 닫기
      setShowReviewModal(false);
      setReviewForm({
        orderId: null,
        orderItemId: null,
        menuName: '',
        rating: 5,
        comment: ''
      });
      setSelectedRating(5);
      setForceUpdate(0);
      
      alert(existingReview ? '리뷰가 성공적으로 수정되었습니다!' : '리뷰가 성공적으로 작성되었습니다!');
      
    } catch (error) {
      console.error('리뷰 저장 실패:', error);
      alert(`리뷰 저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setReviewLoading(false);
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
    
    // 기존 별점으로 초기화
    const existingRating = review.rating || 5;
    console.log('설정할 별점:', existingRating);
    setSelectedRating(existingRating);
    setForceUpdate(0);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

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

  const renderProfileTab = () => (
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
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          🚪 로그아웃
        </button>
      </div>
    </div>
  );

  const renderOrdersTab = () => {
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
                                            onClick={() => handleReviewClick(order.orderId, item.orderItemId, item.menuName)}
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
  };

  const renderReviewsTab = () => {
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
                                              onClick={() => handleReviewEdit(review)}
                                              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors duration-200"
                                            >
                                              수정
                                            </button>
                                            <button
                                              onClick={() => handleReviewDelete(review.id)}
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
  };

  const renderStampsTab = () => (
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
                    onClick={() => handleStampDeleteClick(stamp)}
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

  const renderCouponsTab = () => {
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
                                onClick={() => handleUseCoupon(coupon.id)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                              >
                                🎫 쿠폰 사용하기
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteCoupon(coupon.id)}
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
  };

  return (
    <div className="font-sans bg-gray-50 dark:bg-gray-900">
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

      {/* Stamp Delete Confirmation Modal */}
      {showStampDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                스탬프 삭제 확인
              </h3>
              
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  <strong>{stampToDelete && stores[stampToDelete.storeId] ? stores[stampToDelete.storeId].name : `가게 #${stampToDelete?.storeId}`}</strong>의 
                  모든 스탬프를 삭제하시겠습니까?
                </p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>⚠️ 주의사항:</strong>
                  </p>
                  <ul className="text-sm text-red-600 dark:text-red-400 mt-2 space-y-1">
                    <li>• 해당 가게에 적립된 모든 스탬프가 삭제됩니다</li>
                    <li>• 삭제된 스탬프는 복구할 수 없습니다</li>
                    <li>• 현재 {stampToDelete?.count || 0}개 스탬프가 사라집니다</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStampDeleteModal(false);
                    setStampToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStamp}
                  disabled={stampDeleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  {stampDeleteLoading ? '삭제 중...' : '삭제하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ✍️ {reviews.find(r => r.orderItemId === reviewForm.orderItemId) ? '리뷰 수정' : '리뷰 작성'}
              </h3>
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  메뉴: <span className="font-medium text-gray-900 dark:text-white">{reviewForm.menuName}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  현재 별점: <span className="font-medium text-gray-900 dark:text-white">{selectedRating}점</span>
                </p>
              </div>
              

              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    평점
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = selectedRating >= star;
                      
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            console.log('별점 선택:', star, '현재 selectedRating:', selectedRating);
                            setSelectedRating(star);
                            setForceUpdate(prev => prev + 1);
                            console.log('setSelectedRating 호출 후:', star);
                          }}
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
                    현재 선택된 별점: {selectedRating}점
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    selectedRating 상태값: {JSON.stringify(selectedRating)} | forceUpdate: {forceUpdate}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    리뷰 내용 *
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    placeholder="맛있었나요? 서비스는 어땠나요? 솔직한 후기를 남겨주세요."
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    {reviewLoading ? '저장 중...' : '리뷰 저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'orders' && renderOrdersTab()}
          {activeTab === 'reviews' && renderReviewsTab()}
          {activeTab === 'stamps' && renderStampsTab()}
          {activeTab === 'coupons' && renderCouponsTab()}
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
