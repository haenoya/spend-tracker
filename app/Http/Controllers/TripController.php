<?php

namespace App\Http\Controllers;

use App\Services\SettlementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TripController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'participants' => ['required', 'array', 'min:2', 'max:20'],
            'participants.*' => ['required', 'string', 'max:30', 'distinct:ignore_case'],
            'demo' => ['sometimes', 'boolean'],
        ]);
        $token = bin2hex(random_bytes(32));
        DB::transaction(function () use ($data, $token) {
            $id = DB::table('trips')->insertGetId([
                'name' => $data['name'], 'token_hash' => hash('sha256', $token),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            foreach ($data['participants'] as $name) {
                DB::table('participants')->insert(['trip_id' => $id, 'name' => $name]);
            }
            if ($data['demo'] ?? false) {
                $people = DB::table('participants')->where('trip_id', $id)->orderBy('id')->get();
                foreach ([200000, 100000] as $i => $amount) {
                    DB::table('expenses')->insert([
                        'trip_id' => $id, 'payer_id' => $people[$i]->id, 'payer' => $people[$i]->name,
                        'date' => now()->toDateString(), 'item' => $i === 0 ? '숙소 예약 (예시)' : '저녁 식사 (예시)',
                        'amount' => $amount, 'amount_krw' => $amount, 'currency' => 'KRW',
                        'category' => $i === 0 ? '숙박' : '식비', 'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
            }
        });

        return response()->json(['path' => '/t/'.$token], 201);
    }

    public function show(Request $request, string $token)
    {
        return view('trip', ['trip' => $request->attributes->get('trip')]);
    }

    public function identify(Request $request, string $token)
    {
        $trip = $request->attributes->get('trip');
        $data = $request->validate([
            'participant_id' => ['required', 'integer', Rule::exists('participants', 'id')->where('trip_id', $trip->id)],
        ]);
        $request->session()->put('trip.'.$trip->id, (int) $data['participant_id']);

        return response()->json(['message' => '이름을 선택했습니다.']);
    }

    public function data(Request $request, string $token, SettlementService $settlement)
    {
        $trip = $request->attributes->get('trip');
        $participants = DB::table('participants')->where('trip_id', $trip->id)->orderBy('id')->get();
        $expenses = DB::table('expenses')->where('trip_id', $trip->id)->orderByDesc('date')->orderByDesc('id')->get();
        $events = DB::table('expense_events')->where('trip_id', $trip->id)->orderByDesc('id')->limit(50)->get();
        foreach ($events as $event) {
            $event->before = $event->before ? json_decode($event->before, true) : null;
            $event->after = $event->after ? json_decode($event->after, true) : null;
        }

        return response()->json([
            'name' => $trip->name,
            'participants' => $participants, 'expenses' => $expenses, 'events' => $events,
            'selected' => $request->session()->get('trip.'.$trip->id),
            'settlement' => $settlement->calculate(
                $participants->map(fn ($p) => (array) $p)->all(),
                $expenses->map(fn ($e) => (array) $e)->all(),
            ),
        ]);
    }
}
