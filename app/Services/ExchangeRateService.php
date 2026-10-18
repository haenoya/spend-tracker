<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
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
        if (! in_array($currency, ['KRW', 'JPY', 'USD'], true)) {
            throw new RuntimeException('지원하지 않는 통화입니다.');
        }
        if ($currency === 'KRW') {
            return ['rate' => 1, 'last_updated' => null];
        }

        return Cache::remember("exchange-rate:{$currency}", 3600, function () use ($currency) {
            $apiKey = config('services.exchange_rate.api_key');
            try {
                $response = Http::timeout(5)->get("https://v6.exchangerate-api.com/v6/{$apiKey}/pair/{$currency}/KRW");
            } catch (ConnectionException $e) {
                throw new RuntimeException('환율 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.', 0, $e);
            }

            if ($response->failed() || ! is_numeric($response['conversion_rate'] ?? null) || $response['conversion_rate'] <= 0) {
                throw new RuntimeException('환율 정보를 가져오지 못했습니다.');
            }

            return [
                'rate' => $response['conversion_rate'],
                'last_updated' => $response['time_last_update_utc'] ?? null,
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
