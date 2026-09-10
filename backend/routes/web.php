<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'restaurant' => config('app.name', 'SreyKeo Coffee & Soup'),
        'status' => 'online',
        'api' => url('/api/health'),
    ]);
});
