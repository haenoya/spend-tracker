<?php

namespace App\Http\Controllers;

use App\Services\ExchangeRateService;
use RuntimeException;

class ExchangeRateController extends Controller
{
    /**
     * 실시간 환율 조회 (입력 중 원화 미리보기용)
     * GET /api/exchange-rate/{currency}
     * exchangerate-api.com 무료 플랜 활용
     */
    public function show($currency, ExchangeRateService $exchangeRate)
    {
        try {
            $data = $exchangeRate->rate($currency);
        } catch (RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }

        return response()->json([
            'currency' => $currency,
            'rate' => $data['rate'],
            'last_updated' => $data['last_updated'],
        ]);
    }
}
