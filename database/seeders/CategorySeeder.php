<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('categories')->truncate();

        $categories = ['식비', '교통비', '숙박비', '입장료', '카페·디저트', '기념품', '선물', '기타'];

        foreach ($categories as $category) {
            DB::table('categories')->insert([
                'name'       => $category,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
