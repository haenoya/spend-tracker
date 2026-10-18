<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Services\ExchangeRateService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ExpenseController extends Controller
{
    // 목록 조회
    public function index()
    {
        $expenses = DB::table('expenses')
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json($expenses);
    }

    // 단건 조회
    public function show($id)
    {
        $expense = DB::table('expenses')->where('id', $id)->first();

        return response()->json($expense);
    }

    // 등록 — StoreExpenseRequest로 유효성 검사 분리
    // 원화 환산액은 클라이언트 값을 믿지 않고 서버에서 계산
    public function store(StoreExpenseRequest $request, ExchangeRateService $exchangeRate)
    {
        try {
            $amountKrw = $exchangeRate->toKrw((int) $request->amount, $request->currency);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        $id = DB::table('expenses')->insertGetId([
            'date' => $request->date,
            'item' => $request->item,
            'amount' => $request->amount,
            'category' => $request->category,
            'memo' => $request->memo,
            'payer' => $request->payer,
            'currency' => $request->currency,
            'amount_krw' => $amountKrw,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'message' => '등록 완료'], 201);
    }

    // 수정 — UpdateExpenseRequest로 유효성 검사 분리
    public function update(UpdateExpenseRequest $request, $id, ExchangeRateService $exchangeRate)
    {
        try {
            $amountKrw = $exchangeRate->toKrw((int) $request->amount, $request->currency);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }

        DB::table('expenses')->where('id', $id)->update([
            'date' => $request->date,
            'item' => $request->item,
            'amount' => $request->amount,
            'currency' => $request->currency,
            'category' => $request->category,
            'payer' => $request->payer,
            'amount_krw' => $amountKrw,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => '수정 완료']);
    }

    // 삭제
    public function destroy($id)
    {
        DB::table('expenses')->where('id', $id)->delete();

        return response()->json(['message' => '삭제 완료']);
    }

    // 정산 계산
    public function settlement()
    {
        $expenses = DB::table('expenses')->get();

        $me = 0;
        $sibling = 0;

        foreach ($expenses as $expense) {
            if ($expense->payer === '나') {
                $me += $expense->amount_krw;
            } else {
                $sibling += $expense->amount_krw;
            }
        }

        $total = $me + $sibling;
        $diff = abs($me - $sibling);
        $whoPays = $me > $sibling ? '동생' : '나';
        $amount = round($diff / 2);

        return response()->json([
            'me' => $me,
            'sibling' => $sibling,
            'total' => $total,
            'diff' => $diff,
            'who_pays' => $whoPays,
            'amount' => $amount,
        ]);
    }
}
