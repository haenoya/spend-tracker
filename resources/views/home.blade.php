@extends('layouts.shared')
@section('title', '함께쓴 | 여행은 함께, 정산은 가볍게')
@section('content')
<section class="landing">
    <div class="hero-copy">
        <span class="eyebrow"><i></i> 가입 없이, 링크 하나로</span>
        <h1>함께 쓴 여행비,<br>깔끔하게 <em>나누자.</em></h1>
        <p class="hero-description">누가 얼마를 냈는지부터, 누구에게 보내면 되는지까지.<br class="desktop-break"> 여행을 만들고 친구들과 함께 기록하세요.</p>
        <div class="example-panel" aria-label="3명 정산 예시">
            <div class="example-top"><span>우리의 주말 여행</span><span class="pill">3명 · 예시</span></div>
            <div class="example-total"><small>함께 쓴 금액</small><strong>300,000<span>원</span></strong></div>
            <div class="example-faces"><span>현호 <b>20만원</b></span><span>민수 <b>10만원</b></span><span>지영 <b>0원</b></span></div>
            <div class="example-transfer"><span>지영 <b>→</b> 현호</span><strong>100,000원</strong></div>
            <p>한 사람당 10만원씩 부담하면 정산 끝!</p>
        </div>
        <div class="feature-line"><span>01 여행 만들기</span><b>→</b><span>02 링크 공유</span><b>→</b><span>03 함께 정산</span></div>
    </div>
    <section class="card create-card" aria-labelledby="create-heading">
        <span class="eyebrow muted">NEW TRIP</span>
        <h2 id="create-heading">어디로 떠나나요?</h2>
        <p class="subtle">인원과 이름을 정하면 바로 시작할 수 있어요.</p>
        <form id="create-form">
            <label for="trip-name">여행 이름</label>
            <input id="trip-name" name="name" maxlength="80" required placeholder="예: 후쿠오카 3박 4일" autocomplete="off">
            <div class="label-row"><label for="people">함께하는 사람들</label><span id="people-count">이름을 한 줄에 한 명씩</span></div>
            <textarea id="people" name="participants" rows="4" required placeholder="현호&#10;민수&#10;지영" aria-describedby="people-help"></textarea>
            <p class="field-help" id="people-help">2~20명 · 서로 다른 이름을 입력해주세요. 인원은 입력한 이름 수로 정해져요.</p>
            <div class="privacy-note">생성된 링크를 아는 사람은 누구나 내역을 보고 수정할 수 있어요. 이름 선택은 본인 인증이 아니에요.</div>
            <button class="primary full" id="create-submit" type="submit">여행 만들기 <span>↗</span></button>
        </form>
        <div class="demo-row"><span>먼저 둘러보고 싶다면?</span><button id="demo" type="button" class="text-button">예시 여행 체험 →</button></div>
        <p class="field-help">체험할 때마다 나만의 예시 여행이 생성돼요.</p>
    </section>
</section>
<section id="recent-section" class="recent-section" hidden><div class="section-top"><h2>이 브라우저에서 만든 여행</h2><span class="subtle">링크는 이 기기에만 저장돼요</span></div><div id="recent-trips" class="recent-grid"></div></section>
@endsection
@section('scripts')
<script src="/assets/js/shared-home.js" defer></script>
@endsection
