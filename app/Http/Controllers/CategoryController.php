<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    // 목록 조회
    public function index()
    {
        $categories = DB::table('categories')->get();
        return response()->json($categories);
    }

    // 등록
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|max:20|unique:categories,name',
        ]);

        $id = DB::table('categories')->insertGetId([
            'name'       => $request->name,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id, 'name' => $request->name], 201);
    }

    // 수정
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|max:20|unique:categories,name,' . $id,
        ]);

        DB::table('categories')->where('id', $id)->update([
            'name'       => $request->name,
            'updated_at' => now(),
        ]);

        return response()->json(['message' => '수정 완료']);
    }

    // 삭제
    public function destroy($id)
    {
        DB::table('categories')->where('id', $id)->delete();
        return response()->json(['message' => '삭제 완료']);
    }
}
