/**
 * 개인 지출 관리 시스템 - app.js
 * jQuery를 활용한 프론트엔드 인터랙션 및 Laravel RESTful API 연동
 */

$(function () {
    /* =========================================================
     * 상수 및 설정
     * ========================================================= */

    // CSRF 토큰 (Laravel Ajax 요청 시 필수)
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
        ],
        통신비: [
            "통신",
            "핸드폰",
            "휴대폰",
            "인터넷",
            "넷플릭스",
            "유튜브프리미엄",
            "구독",
            "애플",
            "아이클라우드",
        ],
        기타: [],
    };

    // Chart.js 인스턴스 (재렌더링 시 기존 차트 destroy 필요)
    var donutChartInstance = null;
    var lineChartInstance = null;

    /* =========================================================
     * 데이터 로딩 함수
     * ========================================================= */

    /**
     * 지출 목록 불러오기
     * GET /api/expenses → 테이블 렌더링 + 요약 카드 + 차트 갱신
     */
    function loadExpenses() {
        $.ajax({
            url: "/api/expenses",
            method: "GET",
            beforeSend: function () {
                // 로딩 스피너 표시
                $("#loadingSpinner").show();
                $("#expenseList").empty();
            },
            success: function (data) {
                renderTable(data);
                calcSummary(data);
                renderCharts(data);
            },
            error: function () {
                $("#expenseList").html(
                    '<tr><td colspan="5" class="text-center text-danger">데이터를 불러오지 못했습니다.</td></tr>',
                );
            },
            complete: function () {
                // 성공/실패 관계없이 스피너 숨김
                $("#loadingSpinner").hide();
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
     * GET /api/categories → 모달 내 리스트 렌더링
     */
    function loadCategories() {
        $.ajax({
            url: "/api/categories",
            method: "GET",
            success: function (data) {
                $("#categoryList").empty();
                $.each(data, function (i, category) {
                    var item = `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${category.name}
                            <button class="btn btn-sm btn-danger deleteCategoryBtn" data-id="${category.id}">삭제</button>
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
     * 지출 내역 테이블 렌더링
     * data-id 속성으로 수정/삭제 시 해당 행 식별
     */
    function renderTable(data) {
        $("#expenseList").empty();
        $.each(data, function (i, expense) {
            var row = `
                <tr data-id="${expense.id}">
                    <td>${expense.date}</td>
                    <td>${expense.item}</td>
                    <td>${Number(expense.amount).toLocaleString()}원</td>
                    <td>${expense.category}</td>
                    <td><button class="btn btn-sm btn-danger deleteBtn" data-id="${expense.id}">삭제</button></td>
                </tr>
            `;
            $("#expenseList").append(row);
        });
    }

    /**
     * 요약 카드 갱신
     * 총지출액 합산 + 카테고리별 금액 비교로 최다 지출 카테고리 산출
     */
    function calcSummary(data) {
        var total = 0;
        var categoryCount = {};

        $.each(data, function (i, expense) {
            total += Number(expense.amount);
            categoryCount[expense.category] =
                (categoryCount[expense.category] || 0) + Number(expense.amount);
        });

        $("#totalAmount").text(total.toLocaleString() + "원");

        var topCategory = Object.keys(categoryCount).reduce(
            (a, b) => (categoryCount[a] > categoryCount[b] ? a : b),
            "-",
        );
        $("#topCategory").text(topCategory);
    }

    /**
     * 테이블 행 추가 후 총지출 재계산
     * 등록/삭제 시 DOM 기반으로 합산 (API 재호출 없이 즉시 반영)
     */
    function calcTotal() {
        var total = 0;
        $("#expenseList tr").each(function () {
            var amountText = $(this)
                .find("td:eq(2)")
                .text()
                .replace(/[^0-9]/g, "");
            total += Number(amountText);
        });
        $("#totalAmount").text(total.toLocaleString() + "원");
    }

    /**
     * Chart.js 차트 렌더링
     * 도넛: 카테고리별 지출 비중 / 꺾은선: 날짜별 누적 지출
     * 재호출 시 기존 인스턴스 destroy 후 재생성 (메모리 누수 방지)
     */
    function renderCharts(data) {
        var categoryCount = {};
        var dateAmount = {};

        $.each(data, function (i, expense) {
            categoryCount[expense.category] =
                (categoryCount[expense.category] || 0) + Number(expense.amount);
            dateAmount[expense.date] =
                (dateAmount[expense.date] || 0) + Number(expense.amount);
        });

        var categoryLabels = Object.keys(categoryCount);
        var categoryData = Object.values(categoryCount);
        var dateLabels = Object.keys(dateAmount).sort();
        var dateData = dateLabels.map((d) => dateAmount[d]);

        // 도넛 차트
        if (donutChartInstance) donutChartInstance.destroy();
        donutChartInstance = new Chart(document.getElementById("donutChart"), {
            type: "doughnut",
            data: {
                labels: categoryLabels,
                datasets: [
                    {
                        data: categoryData,
                        backgroundColor: [
                            "#FF6384",
                            "#36A2EB",
                            "#FFCE56",
                            "#4BC0C0",
                        ],
                    },
                ],
            },
        });

        // 꺾은선 차트
        if (lineChartInstance) lineChartInstance.destroy();
        lineChartInstance = new Chart(document.getElementById("lineChart"), {
            type: "line",
            data: {
                labels: dateLabels,
                datasets: [
                    {
                        label: "일별 지출",
                        data: dateData,
                        borderColor: "#36A2EB",
                        tension: 0.3,
                        fill: false,
                    },
                ],
            },
        });
    }

    /* =========================================================
     * 이벤트 바인딩
     * ========================================================= */

    function bindEvents() {
        // 사이드바 접기/펴기
        // toggleClass로 CSS transition 활용 — jQuery UI 없이 순수 jQuery로 구현
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

        // 금액 숫자 외 입력 방지
        $("#amount").on("input", function () {
            $(this).val(
                $(this)
                    .val()
                    .replace(/[^0-9]/g, ""),
            );
        });

        // 지출 등록 폼 submit
        // e.preventDefault()로 새로고침 방지 → jQuery 유효성 검사 → Ajax POST
        $("#spendForm").on("submit", function (e) {
            e.preventDefault();

            var date = $("#date").val();
            var item = $("#item").val();
            var amount = $("#amount").val();
            var category = $("#category").val();

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
                data: { date, item, amount, category, _token: CSRF_TOKEN },
                success: function (response) {
                    var newRow = `
                        <tr data-id="${response.id}">
                            <td>${date}</td>
                            <td>${item}</td>
                            <td>${Number(amount).toLocaleString()}원</td>
                            <td>${category}</td>
                            <td><button class="btn btn-sm btn-danger deleteBtn" data-id="${response.id}">삭제</button></td>
                        </tr>
                    `;
                    $("#expenseList").prepend(newRow);
                    Swal.fire({
                        icon: "success",
                        title: "등록 완료!",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    calcTotal();
                    $("#spendForm")[0].reset();
                    $("#charCount").text(0);
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
            var row = $(this).closest("tr");

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
                            row.fadeOut(300, function () {
                                $(this).remove();
                                calcTotal();
                                Swal.fire({
                                    icon: "success",
                                    title: "삭제 완료!",
                                    timer: 1000,
                                    showConfirmButton: false,
                                });
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
        // data-* 속성에서 값 읽어 모달 인풋에 자동 주입
        $(document).on("click", "tbody tr", function (e) {
            if ($(e.target).hasClass("deleteBtn")) return;

            var id = $(this).data("id");
            var date = $(this).find("td:eq(0)").text();
            var item = $(this).find("td:eq(1)").text();
            var amount = $(this)
                .find("td:eq(2)")
                .text()
                .replace(/[^0-9]/g, "");
            var category = $(this).find("td:eq(3)").text();

            $("#editId").val(id);
            $("#editDate").val(date);
            $("#editItem").val(item);
            $("#editAmount").val(amount);
            $("#editCategory").val(category);
            $("#editModal").modal("show");
        });

        // 수정 저장
        // Ajax PATCH → Laravel update() → 성공 시 모달 닫고 목록 새로고침
        $("#editSaveBtn").on("click", function () {
            var id = $("#editId").val();

            $.ajax({
                url: "/api/expenses/" + id,
                method: "PATCH",
                headers: { "X-CSRF-TOKEN": CSRF_TOKEN },
                contentType: "application/json",
                data: JSON.stringify({
                    date: $("#editDate").val(),
                    item: $("#editItem").val(),
                    amount: $("#editAmount").val(),
                    category: $("#editCategory").val(),
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

        // 실시간 검색
        // keyup 이벤트로 항목명 컬럼 텍스트 포함 여부 확인 → show/hide
        $("#searchInput").on("keyup", function () {
            var keyword = $(this).val().toLowerCase();
            $("#expenseList tr").each(function () {
                var item = $(this).find("td:eq(1)").text().toLowerCase();
                $(this).toggle(item.includes(keyword));
            });
        });

        // 카테고리 필터
        $("#categoryFilter").on("change", function () {
            var selected = $(this).val();
            $("#expenseList tr").each(function () {
                var category = $(this).find("td:eq(3)").text();
                $(this).toggle(selected === "" || category === selected);
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
    }

    /* =========================================================
     * 초기화
     * ========================================================= */
    loadExpenses();
    loadCategoryOptions();
    bindEvents();
});
