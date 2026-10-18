<?php

namespace Tests\Unit;

use App\Services\SettlementService;
use PHPUnit\Framework\TestCase;

class SettlementTest extends TestCase
{
    public function test_example_and_odd_won_are_exact(): void
    {
        $service = new SettlementService;
        $p = [['id' => 1, 'name' => '현호'], ['id' => 2, 'name' => '민수'], ['id' => 3, 'name' => '지영']];
        $r = $service->calculate($p, [['payer_id' => 1, 'amount_krw' => 200000], ['payer_id' => 2, 'amount_krw' => 100000]]);
        $this->assertSame([['from' => 3, 'to' => 1, 'amount' => 100000]], $r['transfers']);
        $r = $service->calculate($p, [['payer_id' => 3, 'amount_krw' => 100]]);
        $this->assertSame([34, 33, 33], array_column($r['members'], 'share'));
        $this->assertSame(0, array_sum(array_column($r['members'], 'balance')));
    }

    public function test_transfers_clear_every_balance_for_two_to_twenty_people(): void
    {
        $service = new SettlementService;
        for ($n = 2; $n <= 20; $n++) {
            $people = $expenses = [];
            for ($i = 1; $i <= $n; $i++) {
                $people[] = ['id' => $i, 'name' => 'p'.$i];
                $expenses[] = ['payer_id' => $i, 'amount_krw' => ($i * 7919 * $n) % 100003];
            }
            $r = $service->calculate($people, $expenses);
            $balances = array_column($r['members'], 'balance', 'id');
            foreach ($r['transfers'] as $t) {
                $this->assertGreaterThan(0, $t['amount']);
                $balances[$t['from']] += $t['amount'];
                $balances[$t['to']] -= $t['amount'];
            }
            $this->assertSame(array_fill(0, $n, 0), array_values($balances));
            $this->assertSame($r['total'], array_sum(array_column($r['members'], 'share')));
            $this->assertLessThanOrEqual($n - 1, count($r['transfers']));
        }
        $this->assertSame(['total' => 0, 'members' => [], 'transfers' => []], $service->calculate([], []));
    }
}
