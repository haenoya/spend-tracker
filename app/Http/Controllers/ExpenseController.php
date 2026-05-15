<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;

class ExpenseController extends Controller
{
    // 목록 조회
    public function index()
    {
        $expenses = DB::table('expenses')->orderBy('date', 'desc')->get();
        return response()->json($expenses);
    }

    // 단건 조회
    public function show($id)
    {
        $expense = DB::table('expenses')->where('id', $id)->first();
        return response()->json($expense);
    }

    // 등록 — StoreExpenseRequest로 유효성 검사 분리
    public function store(StoreExpenseRequest $request)
    {
        $id = DB::table('expenses')->insertGetId([
            'date'       => $request->date,
            'item'       => $request->item,
            'amount'     => $request->amount,
            'category'   => $request->category,
            'memo'       => $request->memo,
            'payer'      => $request->payer,
            'currency'   => $request->currency,
            'amount_krw' => $request->amount_krw,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'message' => '등록 완료'], 201);
    }

    // 수정 — UpdateExpenseRequest로 유효성 검사 분리
    public function update(UpdateExpenseRequest $request, $id)
    {
        DB::table('expenses')->where('id', $id)->update([
            'date'       => $request->date,
            'item'       => $request->item,
            'amount'     => $request->amount,
            'currency'   => $request->currency,
            'category'   => $request->category,
            'payer'      => $request->payer,
            'amount_krw' => $request->amount_krw,
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
            'me'       => $me,
            'sibling'  => $sibling,
            'total'    => $total,
            'diff'     => $diff,
            'who_pays' => $whoPays,
            'amount'   => $amount,
        ]);
    }
}
