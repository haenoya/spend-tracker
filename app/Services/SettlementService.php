<?php

namespace App\Services;

class SettlementService
{
    /** Integer won only; remainder goes to participants in creation order. */
    public function calculate(array $participants, array $expenses): array
    {
        $paid = array_fill_keys(array_column($participants, 'id'), 0);
        foreach ($expenses as $expense) {
            $paid[$expense['payer_id']] += (int) $expense['amount_krw'];
        }
        $total = array_sum($paid);
        $count = count($participants);
        if ($count === 0) {
            return ['total' => 0, 'members' => [], 'transfers' => []];
        }

        $members = $debtors = $creditors = [];
        foreach ($participants as $i => $person) {
            $share = intdiv($total, $count) + ($i < $total % $count ? 1 : 0);
            $balance = $paid[$person['id']] - $share;
            $members[] = ['id' => $person['id'], 'name' => $person['name'], 'paid' => $paid[$person['id']], 'share' => $share, 'balance' => $balance];
            if ($balance < 0) {
                $debtors[] = ['id' => $person['id'], 'amount' => -$balance];
            } elseif ($balance > 0) {
                $creditors[] = ['id' => $person['id'], 'amount' => $balance];
            }
        }

        $transfers = [];
        while ($debtors && $creditors) {
            usort($debtors, fn ($a, $b) => ($b['amount'] <=> $a['amount']) ?: ($a['id'] <=> $b['id']));
            usort($creditors, fn ($a, $b) => ($b['amount'] <=> $a['amount']) ?: ($a['id'] <=> $b['id']));
            $amount = min($debtors[0]['amount'], $creditors[0]['amount']);
            $transfers[] = ['from' => $debtors[0]['id'], 'to' => $creditors[0]['id'], 'amount' => $amount];
            $debtors[0]['amount'] -= $amount;
            $creditors[0]['amount'] -= $amount;
            if ($debtors[0]['amount'] === 0) {
                array_shift($debtors);
            }
            if ($creditors[0]['amount'] === 0) {
                array_shift($creditors);
            }
        }

        return compact('total', 'members', 'transfers');
    }
}
