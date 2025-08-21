# Leaflet 지도 설정 가이드

## 개요
가게정보 탭에 Leaflet을 사용한 인터랙티브 지도를 추가했습니다.

## 설치 방법

### 1. 패키지 설치
```bash
npm install leaflet react-leaflet
# 또는
yarn add leaflet react-leaflet
```

### 2. CSS 파일 추가
`src/app/globals.css` 파일에 다음 내용을 추가하세요:

```css
@import 'leaflet/dist/leaflet.css';

/* Leaflet 지도 스타일 오버라이드 */
.leaflet-container {
  z-index: 1;
}

.leaflet-popup-content-wrapper {
  border-radius: 8px;
}

.leaflet-popup-content {
  margin: 8px 12px;
}
```

## 사용 방법

### 1. StoreMap 컴포넌트
- `src/app/components/StoreMap.js`에 위치
- 위도, 경도, 가게명, 주소를 props로 받음
- OpenStreetMap을 사용하여 지도 표시
- 가게 위치에 마커와 팝업 표시

### 2. 가게정보 탭에서 사용
- 가게정보 탭을 클릭하면 지도가 표시됨
- `storeInfo.latitude`와 `storeInfo.longitude`가 있어야 지도 표시
- 위치 정보가 없으면 "위치 정보가 없습니다" 메시지 표시

## 주요 기능

1. **인터랙티브 지도**: 줌, 팬, 클릭 등 모든 Leaflet 기능 지원
2. **가게 마커**: 가게 위치에 커스텀 마커 표시
3. **정보 팝업**: 마커 클릭 시 가게명과 주소 표시
4. **반응형 디자인**: 모바일과 데스크톱 모두 지원
5. **자동 로딩**: Leaflet 라이브러리 자동 로드

## 백엔드 요구사항

가게 정보 API에서 다음 필드가 필요합니다:
- `latitude`: 위도 (숫자)
- `longitude`: 경도 (숫자)
- `address`: 주소 (문자열)

## 문제 해결

### 지도가 표시되지 않는 경우
1. 브라우저 콘솔에서 오류 메시지 확인
2. `storeInfo.latitude`와 `storeInfo.longitude` 값 확인
3. 네트워크 탭에서 Leaflet 리소스 로딩 상태 확인

### 마커가 표시되지 않는 경우
1. 위도/경도 값이 유효한 숫자인지 확인
2. 좌표계가 WGS84 (EPSG:4326)인지 확인

## 추가 커스터마이징

### 마커 스타일 변경
```javascript
// StoreMap.js에서 마커 스타일 수정
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: '🏪',
  iconSize: [30, 30]
});

const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
```

### 지도 타일 변경
```javascript
// 다른 지도 서비스 사용 (예: 카카오맵, 네이버맵)
L.tileLayer('https://mapserver.mapy.cz/z/{z}-{x}-{y}', {
  attribution: '© Mapy.cz'
}).addTo(map);
```
