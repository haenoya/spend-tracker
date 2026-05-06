$(function () {
    // 페이지 로드 시 지출 목록 불러오기
    function loadExpenses() {
        $.ajax({
            url: "/api/expenses",
            method: "GET",
            beforeSend: function () {
                $("#expenseList").html(
                    '<tr><td colspan="5" class="text-center">로딩 중... ⏳</td></tr>',
                );
            },
            success: function (data) {
                $("#expenseList").empty();
                var total = 0;
                var categoryCount = {};

                $.each(data, function (i, expense) {
                    var row = `
                    <tr>
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
            },
            error: function () {
                $("#expenseList").html(
                    '<tr><td colspan="5" class="text-center text-danger">데이터를 불러오지 못했습니다.</td></tr>',
                );
            },
        });
    }

    loadExpenses();

    // 1. 사이드바 접기/펴기
    $("#sidebarToggle").on("click", function () {
        $("#sidebar").toggleClass("collapsed");
    });

    // 2. 글자 수 카운트
    $("#item").on("input", function () {
        $("#charCount").text($(this).val().length);
    });

    // 3. 금액 숫자 외 입력 방지
    $("#amount").on("input", function () {
        $(this).val(
            $(this)
                .val()
                .replace(/[^0-9]/g, ""),
        );
    });

    // 4. 폼 submit
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

        // 테이블에 행 추가
        var newRow = `
            <tr>
                <td>${date}</td>
                <td>${item}</td>
                <td>${Number(amount).toLocaleString()}원</td>
                <td>${category}</td>
                <td><button class="btn btn-sm btn-danger deleteBtn">삭제</button></td>
            </tr>
        `;
        $("#expenseList").append(newRow);

        // 성공 알림
        $("#successAlert").fadeIn().delay(1500).fadeOut();

        // 총지출 갱신
        calcTotal();

        // 폼 초기화
        $("#spendForm")[0].reset();
        $("#charCount").text(0);

        console.log({ date, item, amount, category });
    });

    // 5. 행 삭제 (이벤트 위임)
    $(document).on("click", ".deleteBtn", function () {
        $(this)
            .closest("tr")
            .fadeOut(300, function () {
                $(this).remove();
                calcTotal();
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
});
