@extends('layouts.shared')
@section('title', $trip->name.' | 함께쓴')
@section('content')
<section class="trip-heading"><div><span class="eyebrow muted">OUR TRIP</span><h1>{{ $trip->name }}</h1><p id="trip-subtitle" class="subtle">여행 기록을 불러오는 중…</p></div><button type="button" id="share" class="secondary">↗ 공유 링크 복사</button></section>
<div class="identity-bar"><div><strong>누구로 기록할까요?</strong><span>이름은 본인 인증이 아니며, 링크로 들어온 모두가 수정할 수 있어요.</span></div><label class="sr-only" for="identity">내 이름</label><select id="identity" disabled><option value="">내 이름 선택</option></select></div>
<section class="trip-grid">
    <aside class="card expense-form-card">
        <div class="section-top"><h2 id="form-title">지출 기록하기</h2><span class="pill">전체 균등 분담</span></div>
        <p class="subtle" id="form-hint">이름을 선택한 뒤 지출을 남겨주세요.</p>
        <form id="expense-form">
            <fieldset id="expense-fields" disabled>
                <label for="date">사용한 날짜</label><input id="date" name="date" type="date" required>
                <label for="item">어디에 썼나요?</label><input id="item" name="item" maxlength="20" required placeholder="예: 하카타 라멘">
                <div class="form-two"><div><label for="amount">금액</label><input id="amount" name="amount" type="number" min="1" max="10000000" step="1" required placeholder="0"></div><div><label for="currency">통화</label><select id="currency" name="currency"><option value="KRW">KRW 원</option><option value="JPY">JPY 엔</option><option value="USD">USD 달러</option></select></div></div>
                <p class="field-help">금액은 정수 단위로 입력해요. 외화는 저장 시 환율로 원화 환산되며, 이후 환율이 바뀌어도 저장된 환산액은 유지돼요.</p>
                <div class="form-two"><div><label for="payer">누가 냈나요?</label><select id="payer" name="payer_id" required></select></div><div><label for="category">분류</label><select id="category" name="category"><option>식비</option><option>교통</option><option>숙박</option><option>쇼핑</option><option>관광</option><option>선물</option><option>기타</option></select></div></div>
                <label for="memo">메모 <span class="optional">선택</span></label><textarea id="memo" name="memo" maxlength="1000" rows="2" placeholder="기억해두고 싶은 내용을 적어주세요"></textarea>
                <button type="submit" id="expense-submit" class="primary full">지출 추가하기 +</button>
                <button type="button" id="cancel-edit" class="secondary full" hidden>수정 취소</button>
            </fieldset>
        </form>
    </aside>
    <div class="trip-main">
        <section class="card summary-card">
            <div class="section-top"><div><span class="eyebrow muted">TOTAL SPENT</span><div class="total" id="total">—<span>원</span></div></div><span id="member-count" class="pill">—명</span></div>
            <div class="member-grid" id="members"></div>
            <div class="settlement-section"><div class="section-top"><h2>이렇게 보내면 정산 끝</h2><span class="subtle">원화 기준</span></div><div id="transfers"><p class="subtle">아직 기록된 지출이 없어요.</p></div><p class="field-help">전체 금액을 균등하게 나눠요. 1원 단위의 나머지는 이름을 등록한 순서대로 부담해요. 송금 횟수는 항상 최소임을 보장하지 않아요.</p></div>
        </section>
        <section class="card list-card"><div class="section-top"><h2>함께 쓴 내역 <span id="expense-count" class="count">0</span></h2><button id="refresh" type="button" class="text-button">새로고침 ↻</button></div><p id="sync-status" class="field-help">30초마다 다른 참여자의 기록을 확인해요.</p><div id="expenses" class="expense-list"></div></section>
        <details class="card history-card"><summary>변경 이력 <span>최근 50건</span></summary><p class="field-help">선택한 이름 기준의 기록이며 본인 인증 내역은 아니에요. 수정·삭제 전 내용도 보관돼요.</p><ol id="history" class="history-list"></ol></details>
    </div>
</section>
<dialog id="share-dialog"><h2>여행 공유 링크</h2><p>링크를 아는 사람은 누구나 보고 수정할 수 있어요.</p><label for="share-link">아래 링크를 복사해 보내주세요.</label><input id="share-link" readonly><button id="close-share" class="primary full" type="button">닫기</button></dialog>
@endsection
@section('scripts')
<script src="/assets/js/shared-trip.js" defer></script>
@endsection
