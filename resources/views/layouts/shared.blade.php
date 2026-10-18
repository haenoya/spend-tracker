<!doctype html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="referrer" content="no-referrer">
    <meta name="robots" content="noindex, nofollow">
    <title>@yield('title', '함께쓴 | 여행 정산')</title>
    <link rel="stylesheet" href="/assets/css/shared.css">
    @yield('head')
</head>
<body>
    <header class="site-header"><a class="brand" href="/"><span class="brand-symbol">↗</span> 함께쓴<span class="brand-note">여행 정산</span></a><a href="/" class="nav-link">새 여행 만들기 ↗</a></header>
    <main>@yield('content')</main>
    <footer>여행은 함께, 정산은 가볍게. <span>함께쓴 · Spend Tracker</span></footer>
    <div id="notice" class="notice" role="status" aria-live="polite" hidden></div>
    @yield('scripts')
</body>
</html>
