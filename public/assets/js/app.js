$(function () {
    // AI 카테고리 추천 키워드 매핑
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

    // 페이지 로드 시 지출 목록 불러오기
    function loadExpenses() {
        $.ajax({
            url: "/api/expenses",
            method: "GET",
            beforeSend: function () {
                $("#loadingSpinner").show();
                $("#expenseList").empty();
            },
            success: function (data) {
                $("#expenseList").empty();
                var total = 0;
                var categoryCount = {};

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

                    total += Number(expense.amount);
                    categoryCount[expense.category] =
                        (categoryCount[expense.category] || 0) +
                        Number(expense.amount);
                });

                // 총지출 갱신
                $("#totalAmount").text(total.toLocaleString() + "원");

                // 최다 카테고리 갱신
                var topCategory = Object.keys(categoryCount).reduce(
                    (a, b) => (categoryCount[a] > categoryCount[b] ? a : b),
                    "-",
                );
                $("#topCategory").text(topCategory);

                // 차트 렌더링
                renderCharts(data);
            },
            error: function () {
                $("#expenseList").html(
                    '<tr><td colspan="5" class="text-center text-danger">데이터를 불러오지 못했습니다.</td></tr>',
                );
            },
            complete: function () {
                $("#loadingSpinner").hide();
            },
        });
    }

    loadExpenses();

    // 카테고리 Select 동적 로딩
    function loadCategoryOptions() {
        $.ajax({
            url: "/api/categories",
            method: "GET",
            success: function (data) {
                $("#category, #editCategory, #categoryFilter").empty();

                // 카테고리 필터에만 전체 옵션 추가
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

    loadCategoryOptions();

    // 1. 사이드바 접기/펴기
    $("#sidebarToggle").on("click", function () {
        $("#sidebar").toggleClass("collapsed");
    });

    // 2. 글자 수 카운트
    $("#item").on("input", function () {
        $("#charCount").text($(this).val().length);
    });

    // AI 카테고리 자동 추천
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

    // 3. 금액 숫자 외 입력 방지
    $("#amount").on("input", function () {
        $(this).val(
            $(this)
                .val()
                .replace(/[^0-9]/g, ""),
        );
    });

    // 4. 폼 submit → Ajax POST
    $("#spendForm").on("submit", function (e) {
        e.preventDefault();

        var date = $("#date").val();
        var item = $("#item").val();
        var amount = $("#amount").val();
        var category = $("#category").val();

        // 유효성 검사
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

        // Ajax POST로 DB에 저장
        $.ajax({
            url: "/api/expenses",
            method: "POST",
            data: {
                date: date,
                item: item,
                amount: amount,
                category: category,
                _token: $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                // 테이블에 행 추가
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

                // 성공 알림
                Swal.fire({
                    icon: "success",
                    title: "등록 완료!",
                    text: "지출이 등록되었습니다.",
                    timer: 1500,
                    showConfirmButton: false,
                });

                // 총지출 갱신
                calcTotal();

                // 폼 초기화
                $("#spendForm")[0].reset();
                $("#charCount").text(0);
            },
            error: function () {
                Swal.fire({
                    icon: "error",
                    title: "오류 발생",
                    text: "등록에 실패했습니다. 다시 시도해주세요.",
                });
            },
        });
    });

    // 5. 행 삭제 (이벤트 위임 + Ajax DELETE)
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
                    headers: {
                        "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr(
                            "content",
                        ),
                    },
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

    // 5-1. 행 클릭 시 수정 모달 열기
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

    // 5-2. 수정 저장 버튼 클릭
    $("#editSaveBtn").on("click", function () {
        console.log("edit id:", $("#editId").val());
        var id = $("#editId").val();

        $.ajax({
            url: "/api/expenses/" + id,
            method: "PATCH",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
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

    // 6. 총지출 계산
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

    // 7. 차트 렌더링
    var donutChartInstance = null;
    var lineChartInstance = null;

    function renderCharts(data) {
        // 도넛 차트 데이터
        var categoryCount = {};
        var dateAmount = {};

        $.each(data, function (i, expense) {
            // 카테고리별 합산
            categoryCount[expense.category] =
                (categoryCount[expense.category] || 0) + Number(expense.amount);

            // 날짜별 합산
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

    // 7. 실시간 검색
    $("#searchInput").on("keyup", function () {
        var keyword = $(this).val().toLowerCase();
        $("#expenseList tr").each(function () {
            var item = $(this).find("td:eq(1)").text().toLowerCase();
            if (item.includes(keyword)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    // 8. 카테고리 필터
    $("#categoryFilter").on("change", function () {
        var selected = $(this).val();
        $("#expenseList tr").each(function () {
            var category = $(this).find("td:eq(3)").text();
            if (selected === "" || category === selected) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    // 9. 카테고리 관리 모달 열기
    $("#categoryModalBtn").on("click", function (e) {
        e.preventDefault();
        loadCategories();
        $("#categoryModal").modal("show");
    });

    // 10. 카테고리 목록 불러오기
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

    // 엔터로 카테고리 추가
    $("#newCategory").on("keyup", function (e) {
        if (e.key === "Enter") {
            $("#addCategoryBtn").click();
        }
    });

    // 11. 카테고리 추가
    $("#addCategoryBtn").on("click", function () {
        var name = $("#newCategory").val().trim();
        if (!name) return;

        $.ajax({
            url: "/api/categories",
            method: "POST",
            data: {
                name: name,
                _token: $('meta[name="csrf-token"]').attr("content"),
            },
            success: function (response) {
                $("#newCategory").val("");
                loadCategories();
                // Select 옵션에도 추가
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

    // 12. 카테고리 삭제
    $(document).on("click", ".deleteCategoryBtn", function () {
        var id = $(this).data("id");
        $.ajax({
            url: "/api/categories/" + id,
            method: "DELETE",
            headers: {
                "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content"),
            },
            success: function () {
                loadCategories();
            },
        });
    });
});
