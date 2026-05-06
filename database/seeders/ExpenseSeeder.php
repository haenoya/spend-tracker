<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = ['식비', '교통비', '통신비', '기타'];

        for ($i = 1; $i <= 10; $i++) {
            DB::table('expenses')->insert([
                'date' => '2026-05-0' . $i,
                'item' => '테스트 항목 ' . $i,
                'amount' => rand(1000, 50000),
                'category' => $categories[array_rand($categories)],
                'memo' => '테스트 메모 ' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
