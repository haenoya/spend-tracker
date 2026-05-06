$(function () {

    // 1. 사이드바 접기/펴기
    $('#sidebarToggle').on('click', function () {
        $('#sidebar').toggleClass('collapsed');
    });

    // 2. 글자 수 카운트
    $('#item').on('input', function () {
        $('#charCount').text($(this).val().length);
    });

    // 3. 폼 submit
    $('#spendForm').on('submit', function (e) {
        e.preventDefault();

        var date = $('#date').val();
        var item = $('#item').val();
        var amount = $('#amount').val();
        var category = $('#category').val();

        // 유효성 검사
        if (!date || !item || amount <= 0) {
            alert('모든 항목을 올바르게 입력해주세요.');
            return;
        }

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
        $('#expenseList').append(newRow);

        // 총지출 갱신
        calcTotal();

        // 폼 초기화
        $('#spendForm')[0].reset();
        $('#charCount').text(0);

        console.log({ date, item, amount, category });
    });

    // 4. 행 삭제 (이벤트 위임)
    $(document).on('click', '.deleteBtn', function () {
        $(this).closest('tr').fadeOut(300, function () {
            $(this).remove();
            calcTotal();
        });
    });

    // 5. 총지출 계산
    function calcTotal() {
        var total = 0;
        $('#expenseList tr').each(function () {
            var amountText = $(this).find('td:eq(2)').text().replace(/[^0-9]/g, '');
            total += Number(amountText);
        });
        $('#totalAmount').text(total.toLocaleString() + '원');
    }

});