<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExpenseKrwTest extends TestCase
{
    use RefreshDatabase;

    private string $endpoint;

    private int $payer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->endpoint = $this->postJson('/trips', ['name' => '환율 검증', 'participants' => ['나', '동생']])->assertCreated()->json('path');
        $this->payer = DB::table('participants')->orderBy('id')->value('id');
        $this->postJson($this->endpoint.'/identity', ['participant_id' => $this->payer])->assertOk();
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'date' => '2026-05-09', 'item' => '다이소', 'amount' => 1320,
            'category' => '기타', 'currency' => 'JPY', 'payer_id' => $this->payer, 'version' => 1,
        ], $override);
    }

    public function test_서버가_환율로_원화를_계산하고_클라이언트_값은_무시한다(): void
    {
        Http::fake(['*' => Http::response(['conversion_rate' => 9.44, 'time_last_update_utc' => 'x'])]);

        $this->postJson($this->endpoint.'/expenses', $this->payload(['amount_krw' => 1320]))->assertCreated();

        $this->assertSame(12461, (int) DB::table('expenses')->value('amount_krw'));
    }

    public function test_원화는_그대로_저장한다(): void
    {
        Http::fake();
        $this->postJson($this->endpoint.'/expenses', $this->payload(['currency' => 'KRW', 'amount' => 800]))->assertCreated();
        $this->assertSame(800, (int) DB::table('expenses')->value('amount_krw'));
        Http::assertNothingSent();
    }

    public function test_환율_조회_실패시_저장하지_않는다(): void
    {
        Http::fake(['*' => Http::response([], 500)]);
        $this->postJson($this->endpoint.'/expenses', $this->payload())->assertStatus(503);
        $this->assertSame(0, DB::table('expenses')->count());
    }

    public function test_수정시에도_서버에서_다시_계산한다(): void
    {
        Http::fake(['*' => Http::response(['conversion_rate' => 9.44, 'time_last_update_utc' => 'x'])]);
        $this->postJson($this->endpoint.'/expenses', $this->payload(['currency' => 'KRW']));
        $id = DB::table('expenses')->value('id');

        $this->patchJson($this->endpoint."/expenses/{$id}", $this->payload(['amount' => 945]))->assertOk();
        $this->assertSame(8921, (int) DB::table('expenses')->value('amount_krw'));
    }

    public function test_복구_명령은_같은_통화_정상행_평균환율로_고친다(): void
    {
        DB::table('expenses')->insert([
            ['date' => '2026-05-09', 'item' => '다이소', 'amount' => 1320, 'currency' => 'JPY', 'amount_krw' => 1320, 'category' => '기타', 'payer' => '나'],
            ['date' => '2026-05-09', 'item' => '칼디', 'amount' => 945, 'currency' => 'JPY', 'amount_krw' => 8921, 'category' => '선물', 'payer' => '나'],
            ['date' => '2026-05-08', 'item' => '숙박세', 'amount' => 800, 'currency' => 'KRW', 'amount_krw' => 800, 'category' => '숙박', 'payer' => '동생'],
        ]);

        $this->artisan('expenses:fix-krw --dry-run')->assertSuccessful();
        $this->assertSame(1320, (int) DB::table('expenses')->where('item', '다이소')->value('amount_krw'));

        $this->artisan('expenses:fix-krw')->assertSuccessful();
        $this->assertSame((int) round(1320 * 8921 / 945), (int) DB::table('expenses')->where('item', '다이소')->value('amount_krw'));
        $this->assertSame(800, (int) DB::table('expenses')->where('item', '숙박세')->value('amount_krw'));
    }
}
