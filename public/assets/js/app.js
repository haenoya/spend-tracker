$(function () {
    var CSRF_TOKEN = $('meta[name="csrf-token"]').attr("content");

    // AI 카테고리 추천용 키워드 매핑 테이블
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
            "신칸센",
            "전철",
        ],
        숙박비: ["호텔", "숙소", "게스트하우스", "료칸", "에어비앤비"],
        입장료: ["입장", "티켓", "관람", "박물관", "전시", "테마파크"],
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
                    '<tr><td colspan="7" class="text-center text-danger py-4">데이터를 불러오지 못했습니다.</td></tr>',
                );
            },
            complete: function () {
                $("#loadingSpinner").hide();
            },
        });
    }

    function loadSettlement() {
        $.ajax({
            url: "/api/expenses/settlement",
            method: "GET",
            success: function (data) {
                $("#myTotal").text(data.me.toLocaleString() + "원");
                $("#siblingTotal").text(data.sibling.toLocaleString() + "원");
                $("#grandTotal").text(data.total.toLocaleString() + "원");
                $("#settlementResult").html(
                    `<span class="text-primary fw-bold">${data.who_pays}</span>이/가 <span class="text-danger fw-bold">${data.amount.toLocaleString()}원</span> 보내야 해요`,
                );

                var suffix = data.who_pays === "나" ? "는" : "이";
                $("#settlementResult").html(
                    `<span class="text-primary fw-bold">${data.who_pays}</span>${suffix} <span class="text-danger fw-bold">${data.amount.toLocaleString()}원</span> 보내야 해요`,
                );
            },
            error: function () {
                $("#settlementResult").text("정산 정보를 불러오지 못했습니다.");
            },
        });
    }

    function loadCategoryOptions() {
        $.ajax({
            url: "/api/categories",
            method: "GET",
            success: function (data) {
                $("#category, #editCategory").empty();
                $.each(data, function (i, category) {
                    var option = `<option value="${category.name}">${category.name}</option>`;
                    $("#category, #editCategory").append(option);
                });
            },
        });
    }

    function loadCategories() {
        $.ajax({
            url: "/api/categories",
            method: "GET",
            success: function (data) {
                $("#categoryList").empty();
                $.each(data, function (i, category) {
                    var item = `
                        <li class="category-manage-item d-flex justify-content-between align-items-center gap-2 shadow-sm">
                            <div class="d-flex align-items-center flex-grow-1">
                                <input type="text" class="form-control form-control-sm border-0 bg-transparent fw-bold categoryNameInput p-0"
                                    data-id="${category.id}" value="${category.name}">
                            </div>
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-light saveCategoryBtn text-primary fw-bold" data-id="${category.id}">수정</button>
                                <button class="btn btn-sm btn-link text-danger text-decoration-none deleteCategoryBtn" data-id="${category.id}">✕</button>
                            </div>
                        </li>`;
                    $("#categoryList").append(item);
                });
            },
        });
    }

    /* =========================================================
     * UI 렌더링 함수
     * ========================================================= */

    /**
     * 지출 내역 테이블 렌더링
     * 데스크탑 컬럼: 날짜(0) | 항목(1) | 카테고리(2) | 금액(3) | 원화(4) | 결제자(5) | 삭제(6)
     */
    function renderTable(data) {
        $("#expenseListDesktop").empty();
        $("#expenseListMobile").empty();

        if (data.length === 0) {
            $("#expenseListDesktop").html(
                '<tr><td colspan="7" class="text-center text-muted py-4">등록된 지출 내역이 없습니다.</td></tr>',
            );
            $("#expenseListMobile").html(
                '<div class="text-center text-muted py-4">등록된 지출 내역이 없습니다.</div>',
            );
            return;
        }

        $.each(data, function (i, expense) {
            // 데스크탑 행 — 삭제 버튼 td에 onclick stopPropagation 제거
            var row = `
                <tr data-id="${expense.id}" style="cursor:pointer;">
                    <td class="text-muted" style="font-size:0.875rem;">${expense.date}</td>
                    <td class="fw-bold">${expense.item}</td>
                    <td><span class="badge bg-light text-dark rounded-3 border">${expense.category}</span></td>
                    <td class="fw-bold">${Number(expense.amount).toLocaleString()} ${expense.currency}</td>
                    <td class="text-primary fw-bold">${Number(expense.amount_krw).toLocaleString()}원</td>
                    <td><span class="badge ${expense.payer === "나" ? "bg-primary-subtle text-primary" : "bg-success-subtle text-success"} px-2 py-1">${expense.payer}</span></td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-light text-danger deleteBtn" data-id="${expense.id}">삭제</button>
                    </td>
                </tr>`;
            $("#expenseListDesktop").append(row);

            // 모바일 카드
            var card = `
                <div class="p-3 border-bottom mobile-row" data-id="${expense.id}">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold expense-name">${expense.item}</div>
                            <small class="text-muted">${expense.date} · ${expense.payer} · <span class="text-primary">${expense.category}</span></small>
                        </div>
                        <div class="text-end d-flex flex-column align-items-end">
                            <div class="fw-bold amount-main">${Number(expense.amount).toLocaleString()} ${expense.currency}</div>
                            <small class="text-muted amount-sub">${Number(expense.amount_krw).toLocaleString()}원</small>
                            <button class="btn btn-link text-danger p-0 mt-1 small deleteBtn" data-id="${expense.id}" style="font-size: 0.8rem; text-decoration: none;">삭제</button>
                        </div>
                    </div>
                </div>
            `;
            $("#expenseListMobile").append(card);
        });
    }

    function calcSummary(data) {
        var total = 0;
        $.each(data, function (i, expense) {
            total += Number(expense.amount_krw);
        });
        $("#totalAmount").text(total.toLocaleString() + "원");
    }

    /**
     * Chart.js 차트 렌더링 (데스크탑만 desktop-only 클래스로 숨김)
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

        if (payerChartInstance) payerChartInstance.destroy();
        payerChartInstance = new Chart(document.getElementById("payerChart"), {
            type: "bar",
            data: {
                labels: ["나", "동생"],
                datasets: [
                    {
                        data: [payerCount["나"], payerCount["동생"]],
                        backgroundColor: ["#4e73df", "#1cc88a"],
                        borderRadius: 12,
                        barThickness: 32,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        grid: { display: false },
                        ticks: {
                            callback: function (v) {
                                return v.toLocaleString() + "원";
                            },
                        },
                    },
                    x: { grid: { display: false } },
                },
            },
        });

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
                                "#ff6b6b",
                                "#4dabf7",
                                "#ffd43b",
                                "#20c997",
                                "#94d82d",
                                "#f783ac",
                                "#ee5d5d",
                                "#748ffc",
                            ],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "right",
                            labels: { boxWidth: 12, padding: 12 },
                        },
                    },
                    cutout: "70%",
                },
            },
        );
    }

    /* =========================================================
     * 이벤트 바인딩
     * ========================================================= */

    function bindEvents() {
        // 사이드바 접기/펴기
        $("#sidebarToggleMobile, #sidebarToggleDesktop").on(
            "click",
            function () {
                $("#sidebar").toggleClass("collapsed active");
            },
        );

        // 항목명 글자 수 카운트
        $("#item").on("input", function () {
            $("#charCount").text($(this).val().length);
        });

        // AI 카테고리 자동 추천 — keyup으로 키워드 매핑 비교
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
                    .text("🪄 자동 분류: " + matched)
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
                        $("#amountKrw")
                            .text(
                                "≈ " +
                                    Math.round(
                                        amount * currentRate,
                                    ).toLocaleString() +
                                    "원",
                            )
                            .show();
                    }
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "환율 오류",
                        text: "환율 정보를 가져오지 못했습니다.",
                    });
                },
            });
        });

        // 지출 등록 폼 submit
        // e.preventDefault()로 새로고침 방지 → 유효성 검사 → Ajax POST
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
                success: function () {
                    Swal.fire({
                        icon: "success",
                        title: "지출 기록 완료",
                        timer: 1200,
                        showConfirmButton: false,
                    });
                    loadExpenses();
                    $("#spendForm")[0].reset();
                    $("#charCount").text(0);
                    $("#amountKrw").hide();
                    $("#aiSuggestion").hide();
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
        // 동적으로 추가된 요소에 직접 .on() 불가 → document에 위임
        $(document).on("click", ".deleteBtn", function (e) {
            e.stopPropagation();
            var id = $(this).data("id");

            Swal.fire({
                title: "내역을 삭제하시겠습니까?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "삭제",
                cancelButtonText: "취소",
                confirmButtonColor: "#e74a3b",
            }).then(function (result) {
                if (result.isConfirmed) {
                    $.ajax({
                        url: "/api/expenses/" + id,
                        method: "DELETE",
                        headers: { "X-CSRF-TOKEN": CSRF_TOKEN },
                        success: function () {
                            loadExpenses();
                            Swal.fire({
                                icon: "success",
                                title: "삭제 완료",
                                timer: 1000,
                                showConfirmButton: false,
                            });
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
        // deleteBtn 클릭 시 제외 처리 — e.target 또는 closest로 확인
        $(document).on(
            "click",
            "#expenseListDesktop tr, .mobile-row",
            function (e) {
                if (
                    $(e.target).hasClass("deleteBtn") ||
                    $(e.target).closest(".deleteBtn").length
                )
                    return;

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
                });
            },
        );

        // 수정 저장 — Ajax PATCH → Laravel update() → 성공 시 모달 닫고 목록 새로고침
        $("#editSaveBtn").on("click", function () {
            var id = $("#editId").val();
            var editAmount = $("#editAmount").val();
            var editCurrency = $("#editCurrency").val();
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
                        title: "변경 사항 저장 완료",
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

        // 수정 모달 통화 변경 시 환율 갱신
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
            });
        });

        // 실시간 검색 — keyup 이벤트로 항목명 포함 여부 확인
        $("#searchInput").on("keyup", function () {
            var keyword = $(this).val().toLowerCase();
            $("#expenseListDesktop tr").each(function () {
                var item = $(this).find("td:eq(1)").text().toLowerCase();
                $(this).toggle(item.includes(keyword));
            });
            $(".mobile-row").each(function () {
                var item = $(this).find(".expense-name").text().toLowerCase();
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
                success: function () {
                    $("#newCategory").val("");
                    loadCategories();
                    loadCategoryOptions();
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "중복 오류",
                        text: "이미 존재하는 카테고리입니다.",
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
                    loadCategoryOptions();
                },
            });
        });

        // 카테고리 수정 — 이벤트 위임
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
                        title: "카테고리 수정 완료",
                        timer: 1000,
                        showConfirmButton: false,
                    });
                },
                error: function () {
                    Swal.fire({
                        icon: "error",
                        title: "중복 오류",
                        text: "이미 존재하는 카테고리입니다.",
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
