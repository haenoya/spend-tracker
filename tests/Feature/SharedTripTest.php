<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SharedTripTest extends TestCase
{
    use RefreshDatabase;

    private function trip(array $names = ['현호', '민수', '지영']): array
    {
        $path = $this->postJson('/trips', ['name' => '후쿠오카', 'participants' => $names])->assertCreated()->json('path');
        $people = $this->getJson($path.'/data')->assertOk()->json('participants');

        return [$path, $people];
    }

    private function expense(int $payer, array $extra = []): array
    {
        return $extra + ['date' => '2026-10-18', 'item' => '라멘', 'amount' => 300, 'currency' => 'KRW', 'category' => '식비', 'payer_id' => $payer, 'version' => 1];
    }

    public function test_shared_workflow_records_selected_actor_and_settles_three_people(): void
    {
        [$path, $p] = $this->trip();
        $this->postJson($path.'/expenses', $this->expense($p[0]['id']))->assertForbidden();
        $this->postJson($path.'/identity', ['participant_id' => $p[1]['id']])->assertOk();
        $id = $this->postJson($path.'/expenses', $this->expense($p[0]['id']))->assertCreated()->json('id');
        $data = $this->getJson($path.'/data')->assertOk()->assertHeader('Cache-Control', 'no-store, private')->json();
        $this->assertSame(300, $data['settlement']['total']);
        $this->assertCount(2, $data['settlement']['transfers']);
        $this->assertSame($p[1]['id'], $data['events'][0]['actor_id']);
        $this->assertSame(100, $data['settlement']['members'][2]['share']);

        $this->patchJson($path.'/expenses/'.$id, $this->expense($p[0]['id'], ['amount' => 600, 'memo' => '둘이 기록']))->assertOk();
        $this->assertDatabaseHas('expenses', ['id' => $id, 'version' => 2, 'amount_krw' => 600]);
        $this->deleteJson($path.'/expenses/'.$id, ['version' => 2])->assertOk();
        $data = $this->getJson($path.'/data')->json();
        $this->assertSame(0, $data['settlement']['total']);
        $this->assertSame(600, $data['events'][0]['before']['amount_krw']);
        $this->assertSame('delete', $data['events'][0]['action']);
        $this->assertCount(3, $data['events']);
    }

    public function test_trip_boundaries_apply_to_identity_payer_expenses_and_logs(): void
    {
        [$a, $pa] = $this->trip();
        [$b, $pb] = $this->trip(['가', '나']);
        $this->postJson($a.'/identity', ['participant_id' => $pa[0]['id']])->assertOk();
        $id = $this->postJson($a.'/expenses', $this->expense($pa[0]['id']))->assertCreated()->json('id');
        $this->postJson($b.'/identity', ['participant_id' => $pa[0]['id']])->assertUnprocessable();
        $this->postJson($b.'/expenses', $this->expense($pb[0]['id']))->assertForbidden();
        $this->postJson($b.'/identity', ['participant_id' => $pb[0]['id']])->assertOk();
        $this->postJson($b.'/expenses', $this->expense($pa[0]['id']))->assertUnprocessable();
        $this->patchJson($b.'/expenses/'.$id, $this->expense($pb[0]['id']))->assertNotFound();
        $this->deleteJson($b.'/expenses/'.$id, ['version' => 1])->assertNotFound();
        $data = $this->getJson($b.'/data')->json();
        $this->assertSame([], $data['expenses']);
        $this->assertSame([], $data['events']);
        foreach (['/api/expenses', '/api/expenses/settlement', '/api/categories', $a.'bad/data'] as $path) {
            $this->getJson($path)->assertNotFound();
        }
        $this->postJson('/api/expenses', $this->expense($pa[0]['id']))->assertNotFound();
    }

    public function test_stale_edits_and_deletions_do_not_overwrite_or_log_changes(): void
    {
        [$path, $p] = $this->trip();
        $this->postJson($path.'/identity', ['participant_id' => $p[0]['id']]);
        $id = $this->postJson($path.'/expenses', $this->expense($p[0]['id']))->json('id');
        $url = $path.'/expenses/'.$id;
        $this->patchJson($url, $this->expense($p[0]['id'], ['amount' => 600]))->assertOk();
        $this->patchJson($url, $this->expense($p[0]['id'], ['amount' => 900]))->assertStatus(409);
        $this->deleteJson($url, ['version' => 1])->assertStatus(409);
        $this->assertDatabaseHas('expenses', ['id' => $id, 'amount_krw' => 600, 'version' => 2]);
        $this->assertDatabaseCount('expense_events', 2);
    }

    public function test_names_and_payload_are_validated_and_only_hash_is_stored(): void
    {
        $this->postJson('/trips', ['name' => 'test', 'participants' => ['A', 'a']])->assertUnprocessable();
        $this->postJson('/trips', ['name' => 'test', 'participants' => ['혼자']])->assertUnprocessable();
        $this->postJson('/trips', ['name' => 'test', 'participants' => array_map(fn ($n) => 'p'.$n, range(1, 21))])->assertUnprocessable();
        [$path, $p] = $this->trip();
        $this->assertDatabaseHas('trips', ['token_hash' => hash('sha256', basename($path))]);
        $this->assertStringNotContainsString('token_hash', $this->getJson($path.'/data')->getContent());
        $this->postJson($path.'/identity', ['participant_id' => $p[0]['id']]);
        foreach ([['currency' => 'EUR'], ['amount' => 1.5], ['item' => str_repeat('a', 21)], ['memo' => str_repeat('a', 1001)]] as $extra) {
            $this->postJson($path.'/expenses', $this->expense($p[0]['id'], $extra))->assertUnprocessable();
        }
        $this->assertDatabaseCount('expense_events', 0);
    }

    public function test_metadata_edit_keeps_original_conversion_and_network_failure_saves_nothing(): void
    {
        [$path, $p] = $this->trip();
        $this->postJson($path.'/identity', ['participant_id' => $p[0]['id']]);
        Http::fake(['*' => Http::response(['conversion_rate' => 9.44])]);
        $payload = $this->expense($p[0]['id'], ['amount' => 1320, 'currency' => 'JPY']);
        $id = $this->postJson($path.'/expenses', $payload)->assertCreated()->json('id');
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('timeout'));
        $this->patchJson($path.'/expenses/'.$id, ['memo' => '기억'] + $payload)->assertOk();
        $this->assertDatabaseHas('expenses', ['id' => $id, 'amount_krw' => 12461]);
        $this->postJson($path.'/expenses', $this->expense($p[1]['id'], ['currency' => 'USD']))->assertStatus(503);
        $this->assertDatabaseCount('expenses', 1);
        $this->assertDatabaseCount('expense_events', 2);
    }

    public function test_demo_contains_only_sample_data_and_creates_a_separate_trip_each_time(): void
    {
        $paths = [];
        foreach (range(1, 2) as $i) {
            $path = $this->postJson('/trips', ['name' => '체험', 'participants' => ['현호', '민수', '지영'], 'demo' => true])->assertCreated()->json('path');
            $paths[] = $path;
            $this->get($path)->assertOk()->assertSee('체험');
            $this->getJson($path.'/data')->assertJsonPath('settlement.total', 300000)->assertJsonCount(2, 'expenses');
        }
        $this->assertNotSame($paths[0], $paths[1]);
    }

    public function test_write_endpoints_require_csrf_outside_testing_bypass(): void
    {
        [$path, $p] = $this->trip();
        $this->app['env'] = 'local';
        $this->postJson('/trips', ['name' => 'CSRF', 'participants' => ['가', '나']])->assertStatus(419);
        $this->postJson($path.'/identity', ['participant_id' => $p[0]['id']])->assertStatus(419);
        $this->postJson($path.'/expenses', $this->expense($p[0]['id']))->assertStatus(419);
    }
}
