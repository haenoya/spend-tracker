<?php

namespace App\Http\Controllers;

use App\Services\ExchangeRateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class ExpenseController extends Controller
{
    public function store(Request $request, string $token, ExchangeRateService $exchangeRate)
    {
        $trip = $request->attributes->get('trip');
        $actor = $this->actor($request, $trip->id);
        $data = $this->data($request, $trip->id);
        try {
            $data['amount_krw'] = $this->toKrw($exchangeRate, $data);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        $id = DB::transaction(function () use ($trip, $actor, $data) {
            $id = DB::table('expenses')->insertGetId($data + [
                'trip_id' => $trip->id, 'version' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $this->event($trip->id, $actor, $id, 'create', null, DB::table('expenses')->find($id));

            return $id;
        });

        return response()->json(['id' => $id, 'message' => '등록 완료'], 201);
    }

    public function update(Request $request, string $token, int $expense, ExchangeRateService $exchangeRate)
    {
        $trip = $request->attributes->get('trip');
        $before = DB::table('expenses')->where('trip_id', $trip->id)->find($expense);
        abort_unless($before, 404);
        $actor = $this->actor($request, $trip->id);
        $version = $request->validate(['version' => ['required', 'integer', 'min:1']])['version'];
        abort_unless((int) $before->version === (int) $version, 409, '다른 참여자가 먼저 변경했습니다. 최신 내역을 확인해주세요.');
        $data = $this->data($request, $trip->id);
        try {
            // Editing metadata must not revalue historic foreign spending.
            $data['amount_krw'] = (int) $data['amount'] === (int) $before->amount && $data['currency'] === $before->currency
                ? $before->amount_krw : $this->toKrw($exchangeRate, $data);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        DB::transaction(function () use ($trip, $expense, $version, $data, $before, $actor) {
            $changed = DB::table('expenses')->where('trip_id', $trip->id)->where('id', $expense)->where('version', $version)
                ->update($data + ['version' => $version + 1, 'updated_at' => now()]);
            abort_unless($changed, 409, '다른 참여자가 먼저 변경했습니다. 최신 내역을 확인한 뒤 다시 수정해주세요.');
            $this->event($trip->id, $actor, $expense, 'update', $before, DB::table('expenses')->find($expense));
        });

        return response()->json(['message' => '수정 완료']);
    }

    public function destroy(Request $request, string $token, int $expense)
    {
        $trip = $request->attributes->get('trip');
        $before = DB::table('expenses')->where('trip_id', $trip->id)->find($expense);
        abort_unless($before, 404);
        $actor = $this->actor($request, $trip->id);
        $version = $request->validate(['version' => ['required', 'integer', 'min:1']])['version'];
        DB::transaction(function () use ($trip, $expense, $version, $before, $actor) {
            $changed = DB::table('expenses')->where('trip_id', $trip->id)->where('id', $expense)->where('version', $version)->delete();
            abort_unless($changed, 409, '다른 참여자가 먼저 변경했습니다. 최신 내역을 확인해주세요.');
            $this->event($trip->id, $actor, $expense, 'delete', $before, null);
        });

        return response()->json(['message' => '삭제 완료']);
    }

    private function actor(Request $request, int $trip): int
    {
        $id = (int) $request->session()->get('trip.'.$trip, 0);
        abort_unless(DB::table('participants')->where('trip_id', $trip)->where('id', $id)->exists(), 403, '먼저 참여자 이름을 선택해주세요.');

        return $id;
    }

    private function data(Request $request, int $trip): array
    {
        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'item' => ['required', 'string', 'max:20'],
            'amount' => ['required', 'integer', 'min:1', 'max:10000000'],
            'currency' => ['required', Rule::in(['KRW', 'JPY', 'USD'])],
            'payer_id' => ['required', 'integer', Rule::exists('participants', 'id')->where('trip_id', $trip)],
            'category' => ['required', 'string', Rule::in(['식비', '교통', '숙박', '쇼핑', '관광', '선물', '기타'])],
            'memo' => ['nullable', 'string', 'max:1000'],
        ]);
        $data['payer'] = DB::table('participants')->where('trip_id', $trip)->where('id', $data['payer_id'])->value('name');
        $data['memo'] = $data['memo'] ?? null;

        return $data;
    }

    private function toKrw(ExchangeRateService $exchangeRate, array $data): int
    {
        $krw = $exchangeRate->toKrw((int) $data['amount'], $data['currency']);
        if ($krw < 1 || $krw > 4294967295) {
            throw ValidationException::withMessages(['amount' => '원화 환산액은 1원 이상 42억 9,496만 7,295원 이하여야 합니다.']);
        }

        return $krw;
    }

    private function event(int $trip, int $actor, int $expense, string $action, ?object $before, ?object $after): void
    {
        DB::table('expense_events')->insert([
            'trip_id' => $trip, 'actor_id' => $actor, 'expense_id' => $expense, 'action' => $action,
            'before' => $before ? json_encode($before, JSON_THROW_ON_ERROR) : null,
            'after' => $after ? json_encode($after, JSON_THROW_ON_ERROR) : null,
            'created_at' => now(),
        ]);
    }
}
