<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class ExchangeRateService
{
    /**
     * {통화} → KRW 환율 조회 (1시간 캐시)
     * 실패 시 예외를 던져, 환율 없이 저장되는 일을 막는다.
     */
    public function rate(string $currency): array
    {
        return Cache::remember("exchange-rate:{$currency}", 3600, function () use ($currency) {
            $apiKey = env('EXCHANGE_API_KEY');
            $response = Http::timeout(5)->get("https://v6.exchangerate-api.com/v6/{$apiKey}/pair/{$currency}/KRW");

            if ($response->failed() || ! isset($response['conversion_rate'])) {
                throw new RuntimeException('환율 정보를 가져오지 못했습니다.');
            }

            return [
                'rate' => $response['conversion_rate'],
                'last_updated' => $response['time_last_update_utc'],
            ];
        });
    }

    // 원화 환산 — KRW는 그대로, 외화는 서버에서 조회한 환율로 계산
    public function toKrw(int $amount, string $currency): int
    {
        if ($currency === 'KRW') {
            return $amount;
        }

        return (int) round($amount * $this->rate($currency)['rate']);
    }
}
