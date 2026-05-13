<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>여행 정산 서비스</title>
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="{{ asset('assets/css/style.css') }}" rel="stylesheet">
</head>

<body>

    <div class="d-flex">
        <!-- 사이드바 -->
        <nav id="sidebar" class="bg-dark text-white p-3">
            <h5 class="mb-4">✈️ 여행 정산</h5>
            <ul class="nav flex-column">
                <li class="nav-item"><a href="#" class="nav-link text-white">대시보드</a></li>
                <li class="nav-item"><a href="#" class="nav-link text-white">지출 내역</a></li>
                <li class="nav-item"><a href="#" class="nav-link text-white" id="categoryModalBtn">카테고리 관리</a>
                </li>
            </ul>
        </nav>

        <!-- 메인 콘텐츠 -->
        <main id="main-content" class="flex-grow-1 p-4">

            <!-- 로딩 스피너 -->
            <div id="loadingSpinner" class="text-center my-3" style="display:none;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">로딩 중...</span>
                </div>
            </div>

            <button id="sidebarToggle" class="btn btn-sm btn-outline-secondary mb-3">☰ 메뉴</button>

            <!-- 요약 카드 -->
            <div class="row mb-4">
                <div class="col-6">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-subtitle text-muted">총 지출 (원화 환산)</h6>
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

            <!-- 차트 영역 -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">카테고리별 지출 비중</h6>
                            <canvas id="donutChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">날짜별 누적 지출</h6>
                            <canvas id="lineChart"></canvas>
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
                                <input type="text" id="item" class="form-control" placeholder="항목명 (최대 20자)"
                                    maxlength="20">
                                <small class="text-muted"><span id="charCount">0</span>/20</small>
                                <small id="aiSuggestion" class="text-success fw-bold" style="display:none;"></small>
                                <div class="invalid-feedback">항목명을 입력해주세요.</div>
                            </div>
                            <div class="col-md-2">
                                <select id="currency" class="form-select">
                                    <option value="KRW">KRW 원화</option>
                                    <option value="JPY">JPY 엔화</option>
                                    <option value="USD">USD 달러</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <input type="number" id="amount" class="form-control" placeholder="금액">
                                <small id="amountKrw" class="text-muted" style="display:none;"></small>
                                <div class="invalid-feedback">금액을 입력해주세요.</div>
                            </div>
                            <div class="col-md-1">
                                <select id="payer" class="form-select">
                                    <option value="나">나</option>
                                    <option value="동생">동생</option>
                                </select>
                            </div>
                            <div class="col-md-1">
                                <select id="category" class="form-select"></select>
                            </div>
                            <div class="col-md-1">
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
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <input type="text" id="searchInput" class="form-control" placeholder="🔍 항목명 검색">
                        </div>
                        <div class="col-md-3">
                            <select id="categoryFilter" class="form-select">
                                <option value="">전체 카테고리</option>
                            </select>
                        </div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>날짜</th>
                                <th>항목</th>
                                <th>금액</th>
                                <th>원화</th>
                                <th>카테고리</th>
                                <th>결제자</th>
                                <th>삭제</th>
                            </tr>
                        </thead>
                        <tbody id="expenseList">
                            <!-- jQuery로 동적 추가 -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 수정 모달 -->
            <div class="modal fade" id="editModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">지출 수정</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <input type="hidden" id="editId">
                            <div class="mb-3">
                                <label class="form-label">날짜</label>
                                <input type="date" id="editDate" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">항목명</label>
                                <input type="text" id="editItem" class="form-control" maxlength="20">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">통화</label>
                                <select id="editCurrency" class="form-select">
                                    <option value="KRW">KRW 원화</option>
                                    <option value="JPY">JPY 엔화</option>
                                    <option value="USD">USD 달러</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">금액</label>
                                <input type="number" id="editAmount" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">결제자</label>
                                <select id="editPayer" class="form-select">
                                    <option value="나">나</option>
                                    <option value="동생">동생</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">카테고리</label>
                                <select id="editCategory" class="form-select"></select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                            <button type="button" id="editSaveBtn" class="btn btn-primary">저장</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 카테고리 관리 모달 -->
            <div class="modal fade" id="categoryModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">카테고리 관리</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="input-group mb-3">
                                <input type="text" id="newCategory" class="form-control" placeholder="새 카테고리 입력">
                                <button id="addCategoryBtn" class="btn btn-primary">추가</button>
                            </div>
                            <ul id="categoryList" class="list-group"></ul>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <!-- SweetAlert2 -->
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Custom JS -->
    <script src="{{ asset('assets/js/app.js') }}"></script>
</body>

</html>
