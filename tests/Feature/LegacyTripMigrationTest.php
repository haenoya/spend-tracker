<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LegacyTripMigrationTest extends TestCase
{
    public function test_existing_rows_are_preserved_and_link_is_only_issued_by_operator(): void
    {
        $paths = array_filter(glob(database_path('migrations/*.php')), fn ($path) => ! str_contains($path, 'add_shared_trips'));
        Artisan::call('migrate:fresh', ['--path' => array_values($paths), '--realpath' => true, '--force' => true]);
        // A participant who paid nothing must still owe their original half.
        foreach (['나', '나'] as $name) {
            DB::table('expenses')->insert([
                'date' => '2026-05-09', 'item' => '기존 기록', 'amount' => 1320,
                'currency' => 'JPY', 'amount_krw' => 12461, 'payer' => $name, 'category' => '기타',
            ]);
        }
        $migration = require database_path('migrations/2026_10_18_120000_add_shared_trips.php');
        $migration->up();
        $trip = DB::table('trips')->where('is_legacy', true)->first();
        $this->assertNotNull($trip);
        $this->assertDatabaseCount('expenses', 2);
        $this->assertDatabaseCount('participants', 2);
        $this->assertSame(24922, (int) DB::table('expenses')->sum('amount_krw'));
        $this->assertSame(0, DB::table('expenses')->whereNull('trip_id')->count());
        $this->getJson('/api/expenses')->assertNotFound();

        Artisan::call('trips:legacy-link');
        preg_match('~/t/([a-f0-9]{64})~', Artisan::output(), $match);
        $old = '/t/'.$match[1];
        $this->getJson($old.'/data')->assertOk()->assertJsonCount(2, 'expenses');
        Artisan::call('trips:legacy-link');
        $this->getJson($old.'/data')->assertNotFound();
    }
}
