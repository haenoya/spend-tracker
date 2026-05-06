<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>개인 지출 관리 시스템</title>
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="{{ asset('assets/css/style.css') }}" rel="stylesheet">
</head>
<body>

<div class="d-flex">
    <!-- 사이드바 -->
    <nav id="sidebar" class="bg-dark text-white p-3">
        <h5 class="mb-4">💰 지출 관리</h5>
        <ul class="nav flex-column">
            <li class="nav-item"><a href="#" class="nav-link text-white">대시보드</a></li>
            <li class="nav-item"><a href="#" class="nav-link text-white">지출 내역</a></li>
        </ul>
    </nav>

    <!-- 메인 콘텐츠 -->
    <main id="main-content" class="flex-grow-1 p-4">
        <button id="sidebarToggle" class="btn btn-sm btn-outline-secondary mb-3">☰ 메뉴</button>

        <!-- 성공 알림 -->
        <div id="successAlert" class="alert alert-success" style="display:none;">
            ✅ 지출이 등록되었습니다!
        </div>

        <!-- 요약 카드 -->
        <div class="row mb-4">
            <div class="col-6">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle text-muted">이번 달 총지출</h6>
                        <h3 id="totalAmount" class="mt-2">0원</h3>
                    </div>
                </div>
            </div>
            <div class="col-6">
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-subtitle text-muted">최다 지출 카테고리</h6>
                        <h3 id="topCategory" class="mt-2">-</h3>
                    </div>
                </div>
            </div>
        </div>

        <!-- 지출 입력 폼 -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title">지출 등록</h5>
                <form id="spendForm">
                    <div class="row g-2">
                        <div class="col-md-2">
                            <input type="date" id="date" class="form-control">
                            <div class="invalid-feedback">날짜를 입력해주세요.</div>
                        </div>
                        <div class="col-md-3">
                            <input type="text" id="item" class="form-control" placeholder="항목명 (최대 20자)" maxlength="20">
                            <small class="text-muted"><span id="charCount">0</span>/20</small>
                            <div class="invalid-feedback">항목명을 입력해주세요.</div>
                        </div>
                        <div class="col-md-2">
                            <input type="number" id="amount" class="form-control" placeholder="금액">
                            <div class="invalid-feedback">금액을 입력해주세요.</div>
                        </div>
                        <div class="col-md-2">
                            <select id="category" class="form-select">
                                <option value="식비">식비</option>
                                <option value="교통비">교통비</option>
                                <option value="통신비">통신비</option>
                                <option value="기타">기타</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <button type="submit" class="btn btn-primary w-100">등록</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- 지출 내역 테이블 -->
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">지출 내역</h5>
                <table class="table">
                    <thead>
                        <tr>
                            <th>날짜</th>
                            <th>항목</th>
                            <th>금액</th>
                            <th>카테고리</th>
                            <th>삭제</th>
                        </tr>
                    </thead>
                    <tbody id="expenseList">
                        <!-- jQuery로 동적 추가 -->
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<!-- jQuery -->
<script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
<!-- Custom JS -->
<script src="{{ asset('assets/js/app.js') }}"></script>
</body>
</html>