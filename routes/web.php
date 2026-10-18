<?php

use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\TripController;
use App\Http\Middleware\ResolveTrip;
use Illuminate\Support\Facades\Route;

Route::view('/', 'home');
Route::post('/trips', [TripController::class, 'store'])->middleware('throttle:10,1');
Route::prefix('/t/{token}')->middleware([ResolveTrip::class, 'throttle:120,1'])->group(function () {
    Route::get('/', [TripController::class, 'show']);
    Route::get('/data', [TripController::class, 'data']);
    Route::post('/identity', [TripController::class, 'identify']);
    Route::post('/expenses', [ExpenseController::class, 'store']);
    Route::patch('/expenses/{expense}', [ExpenseController::class, 'update'])->whereNumber('expense');
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->whereNumber('expense');
});
