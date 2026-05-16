<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>여행 정산 서비스</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="{{ asset('assets/css/style.css') }}" rel="stylesheet">
</head>

<body>

    <header class="mobile-only d-flex justify-content-between align-items-center p-3 bg-white border-bottom sticky-top">
        <button id="sidebarToggle" class="btn btn-light">☰</button>
        <h5 class="m-0 fw-bold">✈️ 여행 정산</h5>
        <div style="width:40px;"></div>
    </header>

    <div class="d-flex">
        <nav id="sidebar" class="text-white p-3 shadow">
            <h4 class="text-center my-4 fw-bold desktop-only">✈️ 여행 정산</h4>
            <ul class="nav flex-column mt-4">
                <li class="nav-item"><a href="#" class="nav-link active">📊 대시보드</a></li>
                <li class="nav-item"><a href="#" class="nav-link">📜 지출 내역</a></li>
                <li class="nav-item"><a href="#" class="nav-link" id="categoryModalBtn">⚙️ 카테고리 관리</a></li>
            </ul>
        </nav>

        <main class="flex-grow-1 p-3 p-md-4">

            <!-- 정산 카드 -->
            <div class="row g-3 mb-4">
                <div class="col-12 col-md-8">
                    <div class="card h-100 bg-primary text-white">
                        <div class="card-body d-flex flex-column justify-content-center p-4">
                            <h6 class="opacity-75 mb-1">우리 여행 총 지출</h6>
                            <h2 class="fw-bold mb-3" id="grandTotal">0원</h2>
                            <div class="d-flex gap-3 border-top pt-3 border-white border-opacity-25">
                                <div><small class="opacity-75">나:</small> <span id="myTotal">0원</span></div>
                                <div><small class="opacity-75">동생:</small> <span id="siblingTotal">0원</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card h-100 border-0 shadow-sm" style="background: #fffbe6;">
                        <div class="card-body d-flex flex-column align-items-center justify-content-center text-center">
                            <h6 class="text-warning fw-bold mb-2">💰 정산 알림</h6>
                            <div id="settlementResult" class="h5 fw-bold text-dark">-</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 차트 영역 (데스크탑만) -->
            <div class="row g-3 mb-4 desktop-only">
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title fw-bold mb-3">💳 결제자별 지출</h6>
                            <canvas id="payerChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <h6 class="card-title fw-bold mb-3">🗂 카테고리별 지출</h6>
                            <canvas id="categoryChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 지출 등록 폼 -->
            <div class="card mb-4 border-0 shadow-sm">
                <div class="card-body p-4">
                    <h5 class="card-title mb-4">✏️ 새 지출 등록</h5>
                    <form id="spendForm">
                        <div class="row g-3">
                            <div class="col-6 col-md-2">
                                <label class="form-label small fw-bold">날짜</label>
                                <input type="date" id="date" class="form-control border-0 bg-light">
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label small fw-bold">결제자</label>
                                <select id="payer" class="form-select border-0 bg-light">
                                    <option value="나">나</option>
                                    <option value="동생">동생</option>
                                </select>
                            </div>
                            <div class="col-12 col-md-3">
                                <label class="form-label small fw-bold">지출 내용</label>
                                <input type="text" id="item" class="form-control border-0 bg-light"
                                    placeholder="예: 이치란 라멘">
                                <small class="text-muted">
                                    <span id="charCount">0</span>/20
                                    <span id="aiSuggestion" class="text-success fw-bold ms-2"
                                        style="display:none;"></span>
                                </small>
                            </div>
                            <div class="col-4 col-md-1">
                                <label class="form-label small fw-bold">통화</label>
                                <select id="currency" class="form-select border-0 bg-light text-center">
                                    <option value="KRW">₩</option>
                                    <option value="JPY">¥</option>
                                    <option value="USD">$</option>
                                </select>
                            </div>
                            <div class="col-8 col-md-2">
                                <label class="form-label small fw-bold">금액</label>
                                <input type="number" id="amount" class="form-control border-0 bg-light"
                                    placeholder="0">
                                <small id="amountKrw" class="text-muted" style="display:none;"></small>
                            </div>
                            <div class="col-6 col-md-2">
                                <label class="form-label small fw-bold">카테고리</label>
                                <select id="category" class="form-select border-0 bg-light">
                                </select>
                            </div>
                            <div class="col-6 col-md-2 d-grid align-items-end">
                                <button type="submit" class="btn btn-primary fw-bold py-2">등록</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 지출 내역 테이블 -->
            <div class="card border-0 shadow-sm">
                <div class="card-body p-0">
                    <div class="p-4 d-flex justify-content-between align-items-center border-bottom">
                        <h5 class="card-title m-0">📜 지출 내역</h5>
                        <div class="d-flex gap-2">
                            <input type="text" id="searchInput"
                                class="form-control form-control-sm border-0 bg-light" placeholder="검색">
                        </div>
                    </div>

                    <div id="loadingSpinner" class="text-center my-3" style="display:none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">로딩 중...</span>
                        </div>
                    </div>

                    <div class="desktop-only p-2">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th>날짜</th>
                                    <th>항목</th>
                                    <th>카테고리</th>
                                    <th>금액</th>
                                    <th>원화환산</th>
                                    <th>결제자</th>
                                    <th class="text-end">관리</th>
                                </tr>
                            </thead>
                            <tbody id="expenseListDesktop">
                            </tbody>
                        </table>
                    </div>

                    <div class="mobile-only" id="expenseListMobile">
                    </div>
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
                                <label class="form-label">결제자</label>
                                <select id="editPayer" class="form-select">
                                    <option value="나">나</option>
                                    <option value="동생">동생</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">지출 내용</label>
                                <input type="text" id="editItem" class="form-control" maxlength="20">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">카테고리</label>
                                <select id="editCategory" class="form-select">
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">통화</label>
                                <select id="editCurrency" class="form-select">
                                    <option value="KRW">₩ KRW</option>
                                    <option value="JPY">¥ JPY</option>
                                    <option value="USD">$ USD</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">금액</label>
                                <input type="number" id="editAmount" class="form-control">
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

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="{{ asset('assets/js/app.js') }}"></script>
</body>

</html>
