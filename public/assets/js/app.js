/**
 * 여행 정산 서비스 - app.js
 * jQuery를 활용한 프론트엔드 인터랙션 및 Laravel RESTful API 연동
 */

$(function () {
    /* =========================================================
     * 상수 및 설정
     * ========================================================= */

    var CSRF_TOKEN = $('meta[name="csrf-token"]').attr("content");

    // AI 카테고리 추천 키워드 매핑
    // 확장 가능한 구조로 설계 — 실제 AI API 연동으로 교체 가능
    var categoryKeywords = {
        식비: [
            "식당",
            "카페",
            "커피",
            "스벅",
            "스타벅스",
            "맥도날드",
            "버거",
            "치킨",
            "피자",
            "점심",
            "저녁",
            "아침",
            "밥",
            "음식",
            "마트",
            "편의점",
            "쿠팡이츠",
            "배민",
            "배달",
            "라멘",
            "우동",
            "초밥",
        ],
        교통비: [
            "택시",
            "버스",
            "지하철",
            "카카오택시",
            "우버",
            "기차",
            "ktx",
            "고속버스",
            "주유",
            "주차",
            "톨게이트",
            "신칸센",
            "전철",
        ],
        숙박비: ["호텔", "숙소", "게스트하우스", "료칸", "에어비앤비"],
        입장료: ["입장", "티켓", "관람", "박물관", "전시", "테마파크"],
        "카페·디저트": ["카페", "디저트", "케이크", "아이스크림", "소프트"],
        기념품: ["기념품", "마그넷", "엽서", "굿즈"],
        선물: ["선물", "부모님", "친구"],
        기타: [],
    };

    var currentRate = 1;
    var payerChartInstance = null;
    var categoryChartInstance = null;

    /* =========================================================
     * 데이터 로딩 함수
     * ========================================================= */

    /**
     * 지출 목록 불러오기
     * GET /api/expenses → 테이블 렌더링 + 정산 카드 갱신
     */
    function loadExpenses() {
        $.ajax({
            url: "/api/expenses",
            method: "GET",
            beforeSend: function () {
                $("#loadingSpinner").show();
            },
            success: function (data) {
                renderTable(data);
                calcSummary(data);
                loadSettlement();
                renderCharts(data);
            },
            error: function () {
                $("#expenseListDesktop").html(
                    '<tr><td colspan="6" class="text-center text-danger">데이터를 불러오지 못했습니다.</td></tr>',
                );
            },
            complete: function () {
                $("#loadingSpinner").hide();
            },
        });
    }

    /**
     * 정산 현황 불러오기
     * GET /api/expenses/settlement → 정산 카드 갱신
     */
    function loadSettlement() {
        $.ajax({
            url: "/api/expenses/settlement",
            method: "GET",
            success: function (data) {
                $("#myTotal").text(data.me.toLocaleString() + "원");
                $("#siblingTotal").text(data.sibling.toLocaleString() + "원");
                $("#grandTotal").text(data.total.toLocaleString() + "원");
                $("#settlementResult").text(
                    data.who_pays +
                        "이/가 " +
                        data.amount.toLocaleString() +
                        "원 줘야 해요",
                );
            },
            error: function () {
                $("#settlementResult").text("정산 정보를 불러오지 못했습니다.");
            },
        });
    }

    /**
     * 카테고리 Select 옵션 동적 로딩
     * GET /api/categories → 입력 폼, 수정 모달, 필터 드롭다운에 반영
     */
    function loadCategoryOptions() {
        $.ajax({
            url: "/api/categories",
            method: "GET",
            success: function (data) {
                $("#category, #editCategory, #categoryFilter").empty();
                $("#categoryFilter").append(
                    '<option value="">전체 카테고리</option>',
                );
                $.each(data, function (i, category) {
                    var option = `<option value="${category.name}">${category.name}</option>`;
                    $("#category, #editCategory, #categoryFilter").append(
                        option,
                    );
                });
            },
        });
    }

    /**
     * 카테고리 관리 모달용 목록 불러오기
     */
    function loadCategories() {
        $.ajax({
            url: "/api/categories",
            method: "GET",
            success: function (data) {
                $("#categoryList").empty();
                $.each(data, function (i, category) {
                    var item = `
                    <li class="list-group-item d-flex justify-content-between align-items-center gap-2">
                        <input type="text" class="form-control form-control-sm categoryNameInput" 
                            data-id="${category.id}" value="${category.name}">
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary saveCategoryBtn" data-id="${category.id}">저장</button>
                            <button class="btn btn-sm btn-danger deleteCategoryBtn" data-id="${category.id}">삭제</button>
                        </div>
                    </li>
                `;
                    $("#categoryList").append(item);
                });
            },
        });
    }

    /* =========================================================
     * UI 렌더링 함수
     * ========================================================= */

    /**
     * 지출 내역 테이블 렌더링 (데스크탑 + 모바일)
     * 데스크탑 컬럼: 날짜(0) | 항목(1) | 금액(2) | 원화환산(3) | 결제자(4) | 관리(5)
     */
    function renderTable(data) {
        $("#expenseListDesktop").empty();
        $("#expenseListMobile").empty();

        $.each(data, function (i, expense) {
            // 데스크탑 테이블 행
            var row = `
    <tr data-id="${expense.id}">
        <td>${expense.date}</td>
        <td>${expense.item}</td>
        <td>${expense.category}</td>
        <td>${Number(expense.amount).toLocaleString()} ${expense.currency}</td>
        <td>${Number(expense.amount_krw).toLocaleString()}원</td>
        <td>${expense.payer}</td>
        <td class="text-end">
            <button class="btn btn-sm btn-outline-danger deleteBtn" data-id="${expense.id}">삭제</button>
        </td>
    </tr>
`;
            $("#expenseListDesktop").append(row);

            // 모바일 카드
            var card = `
                <div class="p-3 border-bottom mobile-row" data-id="${expense.id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold">${expense.item}</div>
                            <small class="text-muted">${expense.date} · ${expense.payer}</small>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">${Number(expense.amount).toLocaleString()} ${expense.currency}</div>
                            <small class="text-muted">${Number(expense.amount_krw).toLocaleString()}원</small>
                        </div>
                    </div>
                </div>
            `;
            $("#expenseListMobile").append(card);
        });
    }

    /**
     * 요약 카드 갱신 — amount_krw 기준으로 원화 합산
     */
    function calcSummary(data) {
        var total = 0;
        $.each(data, function (i, expense) {
            total += Number(expense.amount_krw);
        });
        $("#totalAmount").text(total.toLocaleString() + "원");
    }

    /**
     * Chart.js 차트 렌더링 (데스크탑만 표시)
     * 결제자별 바 차트 + 카테고리별 도넛 차트
     */
    function renderCharts(data) {
        var payerCount = { 나: 0, 동생: 0 };
        var categoryCount = {};

        $.each(data, function (i, expense) {
            payerCount[expense.payer] =
                (payerCount[expense.payer] || 0) + Number(expense.amount_krw);
            categoryCount[expense.category] =
                (categoryCount[expense.category] || 0) +
                Number(expense.amount_krw);
        });

        // 결제자별 바 차트
        if (payerChartInstance) payerChartInstance.destroy();
        payerChartInstance = new Chart(document.getElementById("payerChart"), {
            type: "bar",
            data: {
                labels: ["나", "동생"],
                datasets: [
                    {
                        label: "지출 금액 (원)",
                        data: [payerCount["나"], payerCount["동생"]],
                        backgroundColor: ["#4e73df", "#1cc88a"],
                        borderRadius: 8,
                    },
                ],
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        ticks: {
                            callback: function (value) {
                                return value.toLocaleString() + "원";
                            },
                        },
                    },
                },
            },
        });

        // 카테고리별 도넛 차트
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(
            document.getElementById("categoryChart"),
            {
                type: "doughnut",
                data: {
                    labels: Object.keys(categoryCount),
                    datasets: [
                        {
                            data: Object.values(categoryCount),
                            backgroundColor: [
                                "#FF6384",
                                "#36A2EB",
                                "#FFCE56",
                                "#4BC0C0",
                                "#9966FF",
                                "#FF9F40",
                                "#C9CBCF",
                            ],
                        },
                    ],
                },
                options: {
                    plugins: {
                        legend: { position: "bottom" },
                    },
                },
            },
        );
    }

    /* =========================================================
     * 이벤트 바인딩
     * ========================================================= */

    function bindEvents() {
        // 사이드바 접기/펴기 — toggleClass로 CSS transition 활용
        $("#sidebarToggle").on("click", function () {
            $("#sidebar").toggleClass("collapsed");
        });

        // 항목명 글자 수 실시간 카운트
        $("#item").on("input", function () {
            $("#charCount").text($(this).val().length);
        });

        // AI 카테고리 자동 추천
        // keyup 이벤트로 입력값과 키워드 매핑 객체 비교 → Select 자동 선택
        $("#item").on("keyup", function () {
            var input = $(this).val().toLowerCase();
            var matched = null;

            $.each(categoryKeywords, function (category, keywords) {
                $.each(keywords, function (i, keyword) {
                    if (input.includes(keyword)) {
                        matched = category;
                        return false;
                    }
                });
                if (matched) return false;
            });

            if (matched) {
                $("#category").val(matched);
                $("#aiSuggestion")
                    .text("AI 추천: " + matched)
                    .fadeIn();
            } else {
                $("#aiSuggestion").fadeOut();
            }
        });

        // 금액 숫자 외 입력 방지 + 원화 환산 실시간 표시
        $("#amount").on("input", function () {
            $(this).val(
                $(this)
                    .val()
                    .replace(/[^0-9]/g, ""),
            );
            var amount = $(this).val();
            if (amount && currentRate !== 1) {
                var krw = Math.round(amount * currentRate);
                $("#amountKrw")
                    .text("≈ " + krw.toLocaleString() + "원")
                    .show();
            } else {
                $("#amountKrw").hide();
            }
        });

        // 통화 변경 시 환율 API 호출
        // GET /api/exchange-rate/{currency} → currentRate 갱신
        $("#currency").on("change", function () {
            var currency = $(this).val();
            if (currency === "KRW") {
                currentRate = 1;
                $("#amountKrw").hide();
                return;
            }
            $.ajax({
                url: "/api/exchange-rate/" + currency,
                method: "GET",
                success: function (data) {
                    currentRate = data.rate;
                    var amount = $("#amount").val();
                    if (amount) {
                        var krw = Math.round(amount * currentRate);
                        $("#amountKrw")
                            .text("≈ " + krw.toLocaleString() + "원")
                            .show();
                    }
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "오류",
                        text: "환율 정보를 가져오지 못했습니다.",
                    });
                },
            });
        });

        // 지출 등록 폼 submit
        // e.preventDefault()로 새로고침 방지 → jQuery 유효성 검사 → Ajax POST
        $("#spendForm").on("submit", function (e) {
            e.preventDefault();

            var date = $("#date").val();
            var item = $("#item").val();
            var amount = $("#amount").val();
            var category = $("#category").val();
            var currency = $("#currency").val();
            var payer = $("#payer").val();
            var amount_krw =
                currentRate === 1
                    ? Number(amount)
                    : Math.round(amount * currentRate);

            // 프론트엔드 1차 유효성 검사 (Bootstrap is-invalid 클래스 활용)
            var isValid = true;
            if (!date) {
                $("#date").addClass("is-invalid");
                isValid = false;
            } else {
                $("#date").removeClass("is-invalid");
            }
            if (!item) {
                $("#item").addClass("is-invalid");
                isValid = false;
            } else {
                $("#item").removeClass("is-invalid");
            }
            if (!amount || Number(amount) <= 0) {
                $("#amount").addClass("is-invalid");
                isValid = false;
            } else {
                $("#amount").removeClass("is-invalid");
            }
            if (!isValid) return;

            // Ajax POST → Laravel store() → DB 저장
            $.ajax({
                url: "/api/expenses",
                method: "POST",
                data: {
                    date,
                    item,
                    amount,
                    category,
                    currency,
                    payer,
                    amount_krw,
                    _token: CSRF_TOKEN,
                },
                success: function (response) {
                    // 데스크탑 테이블에 행 추가
                    var newRow = `
                        <tr data-id="${response.id}">
                            <td>${date}</td>
                            <td>${item}</td>
                            <td>${Number(amount).toLocaleString()} ${currency}</td>
                            <td>${amount_krw.toLocaleString()}원</td>
                            <td>${payer}</td>
                            <td class="text-end">
                                <button class="btn btn-sm btn-outline-danger deleteBtn" data-id="${response.id}">삭제</button>
                            </td>
                        </tr>
                    `;
                    $("#expenseListDesktop").prepend(newRow);

                    // 모바일 카드 추가
                    var newCard = `
                        <div class="p-3 border-bottom mobile-row" data-id="${response.id}">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <div class="fw-bold">${item}</div>
                                    <small class="text-muted">${date} · ${payer}</small>
                                </div>
                                <div class="text-end">
                                    <div class="fw-bold">${Number(amount).toLocaleString()} ${currency}</div>
                                    <small class="text-muted">${amount_krw.toLocaleString()}원</small>
                                </div>
                            </div>
                        </div>
                    `;
                    $("#expenseListMobile").prepend(newCard);

                    Swal.fire({
                        icon: "success",
                        title: "등록 완료!",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    loadSettlement();
                    $("#spendForm")[0].reset();
                    $("#charCount").text(0);
                    $("#amountKrw").hide();
                    currentRate = 1;
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "오류 발생",
                        text: "등록에 실패했습니다.",
                    });
                },
            });
        });

        // 행 삭제 — 이벤트 위임 방식
        // 동적으로 추가된 요소에 직접 .on() 불가 → document에 위임하여 처리
        $(document).on("click", ".deleteBtn", function () {
            var id = $(this).data("id");

            Swal.fire({
                title: "정말 삭제할까요?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "삭제",
                cancelButtonText: "취소",
                confirmButtonColor: "#d33",
            }).then(function (result) {
                if (result.isConfirmed) {
                    $.ajax({
                        url: "/api/expenses/" + id,
                        method: "DELETE",
                        headers: { "X-CSRF-TOKEN": CSRF_TOKEN },
                        success: function () {
                            // data-id로 데스크탑 행 + 모바일 카드 둘 다 삭제
                            $("[data-id='" + id + "']").fadeOut(
                                300,
                                function () {
                                    $(this).remove();
                                    loadSettlement();
                                    Swal.fire({
                                        icon: "success",
                                        title: "삭제 완료!",
                                        timer: 1000,
                                        showConfirmButton: false,
                                    });
                                },
                            );
                        },
                        error: function () {
                            Swal.fire({
                                icon: "error",
                                title: "오류 발생",
                                text: "삭제에 실패했습니다.",
                            });
                        },
                    });
                }
            });
        });

        // 행 클릭 시 수정 모달 열기
        // DB에서 단건 조회(GET /api/expenses/{id})해서 카테고리 포함 모든 필드 채우기
        $(document).on(
            "click",
            "#expenseListDesktop tr, .mobile-row",
            function (e) {
                if ($(e.target).hasClass("deleteBtn")) return;

                var id = $(this).data("id");

                $.ajax({
                    url: "/api/expenses/" + id,
                    method: "GET",
                    success: function (data) {
                        $("#editId").val(data.id);
                        $("#editDate").val(data.date);
                        $("#editItem").val(data.item);
                        $("#editAmount").val(data.amount);
                        $("#editCurrency").val(data.currency);
                        $("#editCategory").val(data.category);
                        $("#editPayer").val(data.payer);

                        if (data.currency !== "KRW") {
                            $.ajax({
                                url: "/api/exchange-rate/" + data.currency,
                                method: "GET",
                                success: function (rateData) {
                                    currentRate = rateData.rate;
                                },
                            });
                        } else {
                            currentRate = 1;
                        }

                        $("#editModal").modal("show");
                    },
                    error: function () {
                        Swal.fire({
                            icon: "error",
                            title: "오류",
                            text: "데이터를 불러오지 못했습니다.",
                        });
                    },
                });
            },
        );

        // 수정 저장 — Ajax PATCH → Laravel update() → 성공 시 모달 닫고 목록 새로고침
        $("#editSaveBtn").on("click", function () {
            var id = $("#editId").val();
            var editCurrency = $("#editCurrency").val();
            var editAmount = $("#editAmount").val();
            var editAmountKrw =
                editCurrency === "KRW"
                    ? Number(editAmount)
                    : Math.round(editAmount * currentRate);

            $.ajax({
                url: "/api/expenses/" + id,
                method: "PATCH",
                headers: { "X-CSRF-TOKEN": CSRF_TOKEN },
                contentType: "application/json",
                data: JSON.stringify({
                    date: $("#editDate").val(),
                    item: $("#editItem").val(),
                    amount: editAmount,
                    currency: editCurrency,
                    category: $("#editCategory").val(),
                    payer: $("#editPayer").val(),
                    amount_krw: editAmountKrw,
                }),
                success: function () {
                    $("#editModal").modal("hide");
                    loadExpenses();
                    Swal.fire({
                        icon: "success",
                        title: "수정 완료!",
                        timer: 1000,
                        showConfirmButton: false,
                    });
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "오류 발생",
                        text: "수정에 실패했습니다.",
                    });
                },
            });
        });

        // 수정 모달 통화 변경 시 환율 적용
        $("#editCurrency").on("change", function () {
            var currency = $(this).val();
            if (currency === "KRW") {
                currentRate = 1;
                return;
            }
            $.ajax({
                url: "/api/exchange-rate/" + currency,
                method: "GET",
                success: function (data) {
                    currentRate = data.rate;
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "오류",
                        text: "환율 정보를 가져오지 못했습니다.",
                    });
                },
            });
        });

        // 실시간 검색 — keyup 이벤트로 항목명 텍스트 포함 여부 확인
        $("#searchInput").on("keyup", function () {
            var keyword = $(this).val().toLowerCase();
            $("#expenseListDesktop tr").each(function () {
                var item = $(this).find("td:eq(1)").text().toLowerCase();
                $(this).toggle(item.includes(keyword));
            });
            $(".mobile-row").each(function () {
                var item = $(this)
                    .find(".fw-bold")
                    .first()
                    .text()
                    .toLowerCase();
                $(this).toggle(item.includes(keyword));
            });
        });

        // 카테고리 관리 모달 열기
        $("#categoryModalBtn").on("click", function (e) {
            e.preventDefault();
            loadCategories();
            $("#categoryModal").modal("show");
        });

        // 엔터로 카테고리 추가
        $("#newCategory").on("keyup", function (e) {
            if (e.key === "Enter") $("#addCategoryBtn").click();
        });

        // 카테고리 추가
        $("#addCategoryBtn").on("click", function () {
            var name = $("#newCategory").val().trim();
            if (!name) return;

            $.ajax({
                url: "/api/categories",
                method: "POST",
                data: { name, _token: CSRF_TOKEN },
                success: function (response) {
                    $("#newCategory").val("");
                    loadCategories();
                    $("#category, #editCategory, #categoryFilter").append(
                        `<option value="${response.name}">${response.name}</option>`,
                    );
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "오류",
                        text: "이미 존재하는 카테고리예요.",
                    });
                },
            });
        });

        // 카테고리 삭제 — 이벤트 위임
        $(document).on("click", ".deleteCategoryBtn", function () {
            var id = $(this).data("id");
            $.ajax({
                url: "/api/categories/" + id,
                method: "DELETE",
                headers: { "X-CSRF-TOKEN": CSRF_TOKEN },
                success: function () {
                    loadCategories();
                },
            });
        });

        // 카테고리 이름 수정
        $(document).on("click", ".saveCategoryBtn", function () {
            var id = $(this).data("id");
            var name = $(".categoryNameInput[data-id='" + id + "']")
                .val()
                .trim();
            if (!name) return;

            $.ajax({
                url: "/api/categories/" + id,
                method: "PATCH",
                headers: { "X-CSRF-TOKEN": CSRF_TOKEN },
                contentType: "application/json",
                data: JSON.stringify({ name: name }),
                success: function () {
                    loadCategories();
                    loadCategoryOptions();
                    Swal.fire({
                        icon: "success",
                        title: "수정 완료!",
                        timer: 1000,
                        showConfirmButton: false,
                    });
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "오류",
                        text: "이미 존재하는 카테고리예요.",
                    });
                },
            });
        });
    }

    /* =========================================================
     * 초기화
     * ========================================================= */
    loadExpenses();
    loadCategoryOptions();
    loadSettlement();
    bindEvents();
});
