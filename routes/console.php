<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// 원화 환산액이 외화 금액 그대로 저장된 행(환율 1로 계산된 행) 복구
// 같은 통화의 정상 행 평균 환율로 다시 계산 — 여행 당시 환율에 가깝게 맞추기 위함
Artisan::command('expenses:fix-krw {--dry-run}', function () {
    $broken = DB::table('expenses')
        ->where('currency', '!=', 'KRW')
        ->whereColumn('amount_krw', 'amount')
        ->get();

    foreach ($broken as $expense) {
        $rate = DB::table('expenses')
            ->where('currency', $expense->currency)
            ->whereColumn('amount_krw', '!=', 'amount')
            ->avg(DB::raw('amount_krw * 1.0 / amount'));

        if (! $rate) {
            $this->warn("#{$expense->id} {$expense->item}: 참고할 정상 행이 없어 건너뜀");

            continue;
        }

        $amountKrw = (int) round($expense->amount * $rate);
        $this->line("#{$expense->id} {$expense->date} {$expense->item}: {$expense->amount} {$expense->currency} → {$amountKrw}원 (기존 {$expense->amount_krw}원)");

        if (! $this->option('dry-run')) {
            DB::table('expenses')->where('id', $expense->id)->update(['amount_krw' => $amountKrw, 'updated_at' => now()]);
        }
    }

    $this->info($broken->count().'건 '.($this->option('dry-run') ? '확인 (변경 없음)' : '복구 완료'));
})->purpose('환율 없이 저장된 외화 지출의 원화 환산액 복구');
