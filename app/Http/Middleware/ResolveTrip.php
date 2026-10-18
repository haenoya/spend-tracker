<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResolveTrip
{
    public function handle(Request $request, Closure $next)
    {
        $token = (string) $request->route('token');
        abort_unless(preg_match('/^[a-f0-9]{64}$/', $token), 404);
        $trip = DB::table('trips')->where('token_hash', hash('sha256', $token))->first();
        abort_unless($trip, 404);
        $request->attributes->set('trip', $trip);

        return $next($request)
            ->header('Cache-Control', 'private, no-store')
            ->header('Referrer-Policy', 'no-referrer')
            ->header('X-Robots-Tag', 'noindex, nofollow');
    }
}
