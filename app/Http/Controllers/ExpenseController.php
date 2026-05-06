<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    // 목록 조회
    public function index()
    {
        $expenses = DB::table('expenses')->orderBy('date', 'desc')->get();
        return response()->json($expenses);
    }

    // 등록
    public function store(Request $request)
    {
        $request->validate([
            'date'     => 'required|date',
            'item'     => 'required|max:20',
            'amount'   => 'required|integer|min:1',
            'category' => 'required',
        ]);

        $id = DB::table('expenses')->insertGetId([
            'date'       => $request->date,
            'item'       => $request->item,
            'amount'     => $request->amount,
            'category'   => $request->category,
            'memo'       => $request->memo,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'message' => '등록 완료'], 201);
    }

    // 삭제
    public function destroy($id)
    {
        DB::table('expenses')->where('id', $id)->delete();
        return response()->json(['message' => '삭제 완료']);
    }

    // 수정
    public function update(Request $request, $id)
    {
        $request->validate([
            'date'     => 'required|date',
            'item'     => 'required|max:20',
            'amount'   => 'required|integer|min:1',
            'category' => 'required',
        ]);

        DB::table('expenses')->where('id', $id)->update([
            'date'       => $request->date,
            'item'       => $request->item,
            'amount'     => $request->amount,
            'category'   => $request->category,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => '수정 완료']);
    }
}
