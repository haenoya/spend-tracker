$(function () {
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
});
