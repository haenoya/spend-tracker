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

    <header
        class="mobile-only d-flex justify-content-between align-items-center p-3 bg-white border-bottom sticky-top shadow-sm">
        <button id="sidebarToggleMobile" class="btn btn-light rounded-3">☰</button>
        <h5 class="m-0 fw-bold text-dark">✈️ 여행 정산</h5>
        <div style="width:40px;"></div>
    </header>

    <div class="d-flex">
        <nav id="sidebar" class="text-white p-3 shadow">
            <div class="d-flex justify-content-between align-items-center px-2 my-4 desktop-only">
                <h4 class="m-0 fw-bold">✈️ 여행 정산</h4>
                <button id="sidebarToggleDesktop" class="btn btn-sm btn-link text-white text-decoration-none">◂</button>
            </div>
            <ul class="nav flex-column mt-2">
                <li class="nav-item"><a href="#" class="nav-link active">📊 대시보드</a></li>
                <li class="nav-item"><a href="#" class="nav-link">📜 지출 내역</a></li>
                <li class="nav-item"><a href="#" class="nav-link" id="categoryModalBtn">⚙️ 카테고리 관리</a></li>
            </ul>
        </nav>

        <main class="flex-grow-1 p-3 p-md-4" style="max-width: 1400px; margin: 0 auto; width: 100%;">

            <div class="row g-3 mb-4">
                <div class="col-12 col-md-8">
                    <div class="card h-100 bg-primary text-white border-0 shadow">
                        <div class="card-body d-flex flex-column justify-content-center p-4">
                            <h6 class="opacity-75 mb-2 fw-medium">우리 여행 총 지출</h6>
                            <h1 class="fw-bold mb-3" id="grandTotal">0원</h1>
                            <div class="d-flex gap-4 border-top pt-3 border-white border-opacity-25 fs-5">
                                <div><small class="opacity-75 fs-6">나:</small> <span id="myTotal"
                                        class="fw-bold">0원</span></div>
                                <div><small class="opacity-75 fs-6">동생:</small> <span id="siblingTotal"
                                        class="fw-bold">0원</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card h-100 border-0 shadow-sm"
                        style="background: #fffbeb; border-left: 5px solid #f59e0b !important;">
                        <div class="card-body d-flex flex-column align-items-start justify-content-center p-4">
                            <h6 class="text-warning fw-bold mb-2">💰 최종 정산 알림</h6>
                            <div id="settlementResult" class="h4 fw-bold text-dark m-0">-</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-12 col-md-6">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <h6 class="card-title fw-bold mb-3">💳 결제자별 지출 비율</h6>
                            <div style="position: relative; height:240px;">
                                <canvas id="payerChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body p-4">
                            <h6 class="card-title fw-bold mb-3">🗂 카테고리별 정산 분석</h6>
                            <div style="position: relative; height:240px;">
                                <canvas id="categoryChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card mb-4 border-0 shadow-sm">
                <div class="card-body p-4">
                    <h5 class="card-title mb-4">✏️ 새 지출 등록</h5>
                    <form id="spendForm">
                        <div class="row g-3 align-items-end">
                            <div class="col-6 col-md-2">
                                <label class="form-label small fw-bold text-muted mb-1">날짜</label>
                                <input type="date" id="date" class="form-control bg-light border-0">
                            </div>

                            <div class="col-6 col-md-2">
                                <label class="form-label small fw-bold text-muted mb-1">결제자</label>
                                <select id="payer" class="form-select bg-light border-0">
                                    <option value="나">나</option>
                                    <option value="동생">동생</option>
                                </select>
                            </div>

                            <div class="col-12 col-md-3">
                                <div class="d-flex justify-content-between align-items-center mb-1">
                                    <label class="form-label small fw-bold text-muted m-0">지출 내용</label>
                                    <small class="text-muted" style="font-size:0.75rem;"><span
                                            id="charCount">0</span>/20</small>
                                </div>
                                <input type="text" id="item" class="form-control bg-light border-0"
                                    placeholder="예: 이치란 라멘">
                            </div>

                            <div class="col-4 col-md-1">
                                <label class="form-label small fw-bold text-muted mb-1">통화</label>
                                <select id="currency" class="form-select bg-light border-0 text-center">
                                    <option value="KRW">₩</option>
                                    <option value="JPY">¥</option>
                                    <option value="USD">$</option>
                                </select>
                            </div>

                            <div class="col-8 col-md-2">
                                <label class="form-label small fw-bold text-muted mb-1">금액</label>
                                <input type="number" id="amount" class="form-control bg-light border-0"
                                    placeholder="0">
                            </div>

                            <div class="col-12 col-md-2">
                                <label class="form-label small fw-bold text-muted mb-1">카테고리</label>
                                <select id="category" class="form-select bg-light border-0"></select>
                            </div>

                            <div class="col-12 col-md-12 d-grid mt-3 mt-md-4">
                                <button type="submit" class="btn btn-primary fw-bold py-2.5 rounded-3 shadow-sm"
                                    style="font-size: 1rem;">
                                    💸 등록하기
                                </button>
                            </div>
                        </div>

                        <div class="d-flex gap-3 mt-2 px-1">
                            <small id="aiSuggestion" class="text-primary fw-bold"
                                style="display:none; font-size:0.8rem;"></small>
                            <small id="amountKrw" class="text-success fw-bold"
                                style="display:none; font-size:0.8rem;"></small>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-body p-0">
                    <div class="p-4 d-flex justify-content-between align-items-center border-bottom">
                        <h5 class="card-title m-0">📜 상세 지출 내역</h5>
                        <div>
                            <input type="text" id="searchInput"
                                class="form-control form-control-sm bg-light border-0 py-2 px-3"
                                placeholder="🔍 항목명 검색">
                        </div>
                    </div>

                    <div id="loadingSpinner" class="text-center my-4" style="display:none;">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">로딩 중...</span>
                        </div>
                    </div>

                    <div class="desktop-only p-3">
                        <table class="table table-hover align-middle mb-0">
                            <thead>
                                <tr class="text-muted" style="font-size: 0.875rem;">
                                    <th>날짜</th>
                                    <th>항목명</th>
                                    <th>카테고리</th>
                                    <th>금액</th>
                                    <th>원화 환산</th>
                                    <th>결제자</th>
                                    <th class="text-end"></th>
                                </tr>
                            </thead>
                            <tbody id="expenseListDesktop" class="border-top-0">
                            </tbody>
                        </table>
                    </div>

                    <div class="mobile-only" id="expenseListMobile">
                    </div>
                </div>
            </div>

            <div class="modal fade" id="editModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">✏️ 지출 내역 수정</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-4">
                            <input type="hidden" id="editId">
                            <div class="row g-3">
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-muted">날짜</label>
                                    <input type="date" id="editDate" class="form-control">
                                </div>
                                <div class="col-6">
                                    <label class="form-label small fw-bold text-muted">결제자</label>
                                    <select id="editPayer" class="form-select">
                                        <option value="나">나</option>
                                        <option value="동생">동생</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-muted">지출 내용</label>
                                    <input type="text" id="editItem" class="form-control" maxlength="20">
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-muted">카테고리</label>
                                    <select id="editCategory" class="form-select"></select>
                                </div>
                                <div class="col-4">
                                    <label class="form-label small fw-bold text-muted">통화</label>
                                    <select id="editCurrency" class="form-select">
                                        <option value="KRW">₩ KRW</option>
                                        <option value="JPY">¥ JPY</option>
                                        <option value="USD">$ USD</option>
                                    </select>
                                </div>
                                <div class="col-8">
                                    <label class="form-label small fw-bold text-muted">금액</label>
                                    <input type="number" id="editAmount" class="form-control">
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-light rounded-3 fw-bold"
                                data-bs-dismiss="modal">취소</button>
                            <button type="button" id="editSaveBtn"
                                class="btn btn-primary rounded-3 fw-bold px-4">저장하기</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal fade" id="categoryModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 420px;">
                    <div class="modal-content border-0">
                        <div class="modal-header px-4 pt-4 border-0">
                            <h5 class="modal-title fw-bold text-dark fs-5">⚙️ 카테고리 편집</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body px-4 pb-4 pt-2">
                            <div class="d-flex gap-2 mb-3">
                                <input type="text" id="newCategory"
                                    class="form-control bg-light border-0 py-2.5 px-3" style="font-size: 0.9rem;"
                                    placeholder="새 카테고리 이름">
                                <button id="addCategoryBtn"
                                    class="btn btn-primary fw-bold px-3 text-nowrap rounded-3">추가</button>
                            </div>

                            <div style="max-height: 320px; overflow-y: auto; border-radius: 16px;">
                                <ul id="categoryList" class="list-unstyled m-0">
                                </ul>
                            </div>
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
