<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;

class ExchangeRateController extends Controller
{
    /**
     * 실시간 환율 조회
     * GET /api/exchange-rate/{currency}
     * exchangerate-api.com 무료 플랜 활용
     */
    public function show($currency)
    {
        $apiKey = env('EXCHANGE_API_KEY');
        $response = Http::get("https://v6.exchangerate-api.com/v6/{$apiKey}/pair/{$currency}/KRW");

        if ($response->failed()) {
            return response()->json(['error' => '환율 정보를 가져오지 못했습니다.'], 500);
        }

        $data = $response->json();

        return response()->json([
            'currency'       => $currency,
            'rate'           => $data['conversion_rate'],
            'last_updated'   => $data['time_last_update_utc'],
        ]);
    }
}
