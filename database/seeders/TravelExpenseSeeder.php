<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TravelExpenseSeeder extends Seeder
{
    public function run(): void
    {
        // 기존 데이터 초기화
        DB::table('expenses')->truncate();

        $expenses = [
            ['date' => '2026-05-08', 'item' => '하카타 라멘', 'amount' => 980, 'currency' => 'JPY', 'amount_krw' => 8820, 'category' => '식비', 'payer' => '나'],
            ['date' => '2026-05-08', 'item' => '지하철 1일권', 'amount' => 620, 'currency' => 'JPY', 'amount_krw' => 5580, 'category' => '교통비', 'payer' => '동생'],
            ['date' => '2026-05-08', 'item' => '호텔 체크인', 'amount' => 12000, 'currency' => 'JPY', 'amount_krw' => 108000, 'category' => '숙박비', 'payer' => '나'],
            ['date' => '2026-05-09', 'item' => '모지코 레트로 입장', 'amount' => 500, 'currency' => 'JPY', 'amount_krw' => 4500, 'category' => '입장료', 'payer' => '동생'],
            ['date' => '2026-05-09', 'item' => '편의점 디저트', 'amount' => 450, 'currency' => 'JPY', 'amount_krw' => 4050, 'category' => '카페·디저트', 'payer' => '나'],
            ['date' => '2026-05-09', 'item' => '기타큐슈 마그넷', 'amount' => 800, 'currency' => 'JPY', 'amount_krw' => 7200, 'category' => '기념품', 'payer' => '동생'],
            ['date' => '2026-05-10', 'item' => '우동 점심', 'amount' => 750, 'currency' => 'JPY', 'amount_krw' => 6750, 'category' => '식비', 'payer' => '나'],
            ['date' => '2026-05-10', 'item' => '버스 교통비', 'amount' => 300, 'currency' => 'JPY', 'amount_krw' => 2700, 'category' => '교통비', 'payer' => '동생'],
            ['date' => '2026-05-10', 'item' => '부모님 선물', 'amount' => 3000, 'currency' => 'JPY', 'amount_krw' => 27000, 'category' => '선물', 'payer' => '나'],
            ['date' => '2026-05-10', 'item' => '스타벅스 라떼', 'amount' => 680, 'currency' => 'JPY', 'amount_krw' => 6120, 'category' => '카페·디저트', 'payer' => '동생'],
        ];

        foreach ($expenses as $expense) {
            DB::table('expenses')->insert([
                'date'       => $expense['date'],
                'item'       => $expense['item'],
                'amount'     => $expense['amount'],
                'currency'   => $expense['currency'],
                'amount_krw' => $expense['amount_krw'],
                'category'   => $expense['category'],
                'payer'      => $expense['payer'],
                'memo'       => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
