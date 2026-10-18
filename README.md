# ✈️ 여행 정산 서비스

> 실제 기타큐슈 여행에서 사용한 2인 여행 지출 정산 웹 서비스

🔗 **서비스 주소:** https://spend.haenoya.com
(개인 지출 데이터가 있어 기본 인증으로 보호하고 있습니다. 열람 계정은 요청 시 제공합니다.)

<br>

## 📌 프로젝트 개요

친구/가족과 여행 시 발생하는 지출을 기록하고, 누가 얼마를 더 냈는지 자동으로 계산해주는 정산 서비스입니다.  
다중 통화(KRW/JPY/USD) 지원 및 실시간 환율 자동 환산 기능을 통해 해외여행 정산을 간편하게 처리합니다.

<br>

## 🚀 주요 기능

| 기능                 | 설명                                                     |
| -------------------- | -------------------------------------------------------- |
| 지출 등록/수정/삭제  | jQuery Ajax로 페이지 새로고침 없이 실시간 CRUD 처리      |
| 다중 통화 지원       | KRW / JPY / USD 선택 후 실시간 환율 API로 원화 자동 환산 |
| 자동 정산 계산       | 각자 지출 합산 후 차액의 절반을 정산 금액으로 자동 계산  |
| 카테고리 자동 추천   | 항목명 입력 시 미리 정한 키워드와 비교해 카테고리 자동 선택 |
| 실시간 검색          | keyup 이벤트로 지출 내역 즉시 필터링                     |
| 시각화 대시보드      | 결제자별 바 차트 + 카테고리별 도넛 차트 (데스크탑)       |
| 반응형 UI            | 데스크탑은 테이블, 모바일은 카드 피드 형태로 분기        |
| 사용자 정의 카테고리 | DB 기반 카테고리 추가/수정/삭제, Select 옵션 동적 렌더링 |

<br>

## 🛠 기술 스택

### Backend

- **Language:** PHP 8.1
- **Framework:** Laravel 10.x
    - FormRequest로 유효성 검사 로직을 Controller에서 분리 (단일 책임 원칙)
    - RESTful API 설계 (GET / POST / PATCH / DELETE)
- **Database:** MySQL

### Frontend

- **HTML5 / CSS3**
- **JavaScript / jQuery 3.7**
    - `$.ajax`를 활용한 비동기 통신으로 SPA에 준하는 UX 구현
    - 이벤트 위임 패턴으로 동적 생성 요소의 이벤트 처리
    - `fadeOut().remove()` 등 jQuery 애니메이션으로 인터랙션 강화
- **Bootstrap 5:** 반응형 레이아웃, Modal, Spinner 컴포넌트 활용
- **Chart.js:** 결제자별 바 차트, 카테고리별 도넛 차트
- **SweetAlert2:** 등록/삭제/수정 알림 UI

### External API

- **ExchangeRate API:** 실시간 환율 정보 조회 (JPY, USD → KRW 환산)

### Infra

- **AWS EC2** (Rocky Linux 9)
- **Apache 2.4** + **MySQL**
- **Let's Encrypt** (HTTPS)

<br>

## 🌐 배포

AWS EC2에 서버를 직접 구성해 배포하고, 개인 도메인으로 운영하고 있습니다.

| 항목     | 구성                                                                 |
| -------- | -------------------------------------------------------------------- |
| 서버     | AWS EC2 (Rocky Linux 9), 탄력적 IP                                   |
| 웹 서버  | Apache 2.4, Laravel `public` 폴더를 웹 루트로 지정                  |
| DB       | MySQL (서버 로컬, 앱 전용 계정 분리)                                 |
| 도메인   | `spend.haenoya.com` A 레코드 → 탄력적 IP                            |
| HTTPS    | Let's Encrypt 인증서(certbot), HTTP 요청은 HTTPS로 자동 이동         |
| 접근 제어 | Apache 기본 인증 + SSH는 지정 IP만 허용                             |
| 보안 설정 | SELinux 유지: 쓰기 폴더(`storage`, `bootstrap/cache`)와 DB·외부 환율 API 접속만 허용 |

<br>

## 📁 프로젝트 구조

```
spend-tracker/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── ExpenseController.php      # 지출 CRUD + 정산 계산 API
│   │   │   ├── CategoryController.php     # 카테고리 CRUD API
│   │   │   └── ExchangeRateController.php # 환율 API 연동
│   │   └── Requests/
│   │       ├── StoreExpenseRequest.php    # 등록 유효성 검사
│   │       └── UpdateExpenseRequest.php   # 수정 유효성 검사
├── database/
│   ├── migrations/
│   │   ├── create_expenses_table.php      # id, date, item, amount, currency, amount_krw, payer, category
│   │   └── create_categories_table.php
│   └── seeders/
│       ├── ExpenseSeeder.php
│       └── CategorySeeder.php
├── public/
│   └── assets/
│       ├── css/style.css
│       └── js/app.js                      # jQuery 인터랙션 메인 파일
└── resources/
    └── views/
        └── welcome.blade.php              # 메인 화면 (단일 페이지)
```

<br>

## ⚙️ 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/haenoya/spend-tracker.git
cd spend-tracker

# 2. 의존성 설치
composer install

# 3. 환경 설정
cp .env.example .env
php artisan key:generate

# 4. .env 파일에서 DB 및 환율 API 키 설정
DB_DATABASE=spend_tracker
DB_USERNAME=root
DB_PASSWORD=
EXCHANGE_API_KEY=your_api_key_here

# 5. DB 생성 후 마이그레이션 및 시더 실행
php artisan migrate
php artisan db:seed

# 6. 서버 실행
php artisan serve
```

<br>

## 🔥 트러블슈팅

### 1. 동적 생성 요소에 이벤트가 적용되지 않는 문제

**문제:** Ajax로 테이블에 추가한 행의 삭제 버튼에 `.on('click')` 이벤트가 동작하지 않음  
**원인:** jQuery는 이벤트 바인딩 시점에 존재하는 요소에만 이벤트를 등록함  
**해결:** 이벤트 위임 패턴으로 상위 요소인 `document`에 이벤트를 위임

```javascript
// ❌ 동적 요소에 직접 바인딩 — 작동 안 함
$('.deleteBtn').on('click', function() { ... });

// ✅ 이벤트 위임 — 동적 요소에도 작동
$(document).on('click', '.deleteBtn', function() { ... });
```

### 2. Laravel Ajax PATCH 요청 실패

**문제:** jQuery Ajax로 PATCH 요청 시 `MethodNotAllowedHttpException` 발생  
**원인:** `contentType`을 `application/json`으로 설정하지 않아 Laravel이 요청 본문을 파싱하지 못함  
**해결:** `contentType: 'application/json'` + `data: JSON.stringify({...})` 로 전송

```javascript
$.ajax({
    method: "PATCH",
    headers: { "X-CSRF-TOKEN": CSRF_TOKEN },
    contentType: "application/json",
    data: JSON.stringify({ date, item, amount, category }),
});
```

### 3. CSRF 토큰 Ajax 처리

**문제:** Laravel의 CSRF 보호로 인해 POST/DELETE/PATCH Ajax 요청이 419 오류 반환  
**해결:** `<meta name="csrf-token">` 태그에서 토큰을 읽어 요청 헤더 또는 데이터에 포함

```javascript
var CSRF_TOKEN = $('meta[name="csrf-token"]').attr('content');

// POST: data에 포함
data: { _token: CSRF_TOKEN }

// DELETE/PATCH: 헤더에 포함
headers: { 'X-CSRF-TOKEN': CSRF_TOKEN }
```

### 4. RESTful 라우트 순서 충돌

**문제:** `/api/expenses/settlement` 가 `/api/expenses/{id}` 로 인식되어 404 발생  
**원인:** Laravel 라우터는 위에서 아래로 매칭하므로 `{id}` 라우트가 먼저 오면 `settlement` 를 id로 처리  
**해결:** `settlement` 라우트를 `{id}` 라우트보다 위에 선언

```php
Route::get('/expenses/settlement', [ExpenseController::class, 'settlement']); // 먼저!
Route::get('/expenses/{id}', [ExpenseController::class, 'show']);
Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy']);
```

### 5. 실시간 환율 API 연동

**문제:** JPY 금액 입력 시 원화 환산이 필요하나 프론트엔드에 API 키 노출 불가  
**해결:** Laravel 백엔드에서 환율 API 호출 후 클라이언트에 rate 값만 반환

```
jQuery → GET /api/exchange-rate/JPY → Laravel → ExchangeRate API → rate 반환
```

### 6. 외화 지출이 환율 없이 저장되는 문제

**문제:** 실제 여행 데이터에서 `1,320 JPY`가 `1,320원`으로 저장된 행을 발견
**원인:** 원화 환산액을 브라우저에서 계산해 보내고 있었음. 환율 응답이 오기 전에 등록하거나 환율 조회가 실패하면 기본값(환율 1)으로 계산됐고, 등록 폼과 수정 창이 같은 환율 변수를 같이 써서 서로의 값을 덮어쓸 수도 있었음
**해결:**
- 원화 환산을 서버(`ExchangeRateService`)로 옮기고, 클라이언트가 보낸 환산액은 받지 않음
- 환율 조회에 실패하면 저장하지 않고 오류를 반환 (환율은 1시간 캐시)
- 이미 잘못 저장된 행은 `php artisan expenses:fix-krw` 로 같은 통화 정상 행의 평균 환율로 복구 (`--dry-run`으로 먼저 확인)
- 등록·수정·실패·복구 시나리오를 기능 테스트로 검증 (`php artisan test`)

<br>

## 📄 라이선스

MIT License
