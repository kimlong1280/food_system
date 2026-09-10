<?php

use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\MenuItemController as AdminMenuItemController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PosterController as AdminPosterController;
use App\Http\Controllers\Admin\TableController as AdminTableController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Public\MenuController;
use App\Http\Controllers\Public\OrderController;
use App\Http\Controllers\Public\PosterController;
use App\Http\Controllers\Public\TableController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (Customers & Guest Ordering)
|--------------------------------------------------------------------------
*/
Route::prefix('')->group(function () {
    // Health check
    Route::get('/health', fn () => response()->json(['status' => 'healthy', 'restaurant' => config('app.name')]));

    // Customer Menu & Categories
    Route::get('/categories', [MenuController::class, 'categories']);
    Route::get('/menu-items', [MenuController::class, 'index']);
    Route::get('/menu-items/{id}', [MenuController::class, 'show']);

    // Table QR Validation & Selection
    Route::get('/tables', [TableController::class, 'index']);
    Route::get('/tables/{id}', [TableController::class, 'show']);
    Route::get('/tables/{id}/bill', [OrderController::class, 'getTableBill']);
    Route::post('/tables/{id}/request-payment', [OrderController::class, 'requestTablePayment']);

    // Order Placement & Tracking
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{orderNumber}', [OrderController::class, 'show']);
    Route::post('/orders/{orderNumber}/request-payment', [OrderController::class, 'requestOrderPayment']);

    // Promotional Posters / Banners
    Route::get('/posters', [PosterController::class, 'index']);

    // Admin Auth
    Route::post('/login', [AuthController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| Authenticated User Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
});

/*
|--------------------------------------------------------------------------
| Protected Admin Routes (Sanctum + Admin Role)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard Stats & Analytics
    Route::get('/dashboard', [AdminDashboardController::class, 'stats']);

    // Categories Management
    Route::apiResource('categories', AdminCategoryController::class);

    // Menu Items Management
    Route::apiResource('menu-items', AdminMenuItemController::class);
    Route::patch('/menu-items/{menuItem}/toggle-availability', [AdminMenuItemController::class, 'toggleAvailability']);
    Route::patch('/menu-items/{menuItem}/toggle-featured', [AdminMenuItemController::class, 'toggleFeatured']);

    // Tables Management
    Route::apiResource('tables', AdminTableController::class);
    Route::patch('/tables/{table}/toggle-status', [AdminTableController::class, 'toggleStatus']);

    // Orders Management
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);

    // Promotional Posters
    Route::apiResource('posters', AdminPosterController::class);

    // Staff / Admin Users Management
    Route::apiResource('users', AdminUserController::class);
});
