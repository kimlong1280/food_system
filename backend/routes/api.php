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
use App\Http\Controllers\Public\TelegramWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes (Customers & Guest Ordering)
|--------------------------------------------------------------------------
*/
Route::prefix('')->group(function () {
    // Health & Diagnostic checks
    Route::get('/health', fn () => response()->json([
        'status' => 'healthy',
        'restaurant' => config('app.name'),
        'database' => config('database.default'),
        'categories_count' => \App\Models\Category::count(),
        'menu_items_count' => \App\Models\MenuItem::count(),
    ]));
    Route::get('/run-setup', function () {
        try {
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = \Illuminate\Support\Facades\Artisan::output();

            \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
            $seedOutput = \Illuminate\Support\Facades\Artisan::output();

            return response()->json([
                'status' => 'success',
                'migrate' => $migrateOutput,
                'seed' => $seedOutput,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'trace' => $e->getFile() . ':' . $e->getLine(),
            ], 500);
        }
    });
    Route::get('/debug-db', function () {
        $base = env('DB_HOST', '');
        $user = env('DB_USERNAME', '');
        $pass = env('DB_PASSWORD', '');
        $db = env('DB_DATABASE', '');
        $port = env('DB_PORT', 5432);

        $dbUrl = env('DATABASE_URL');
        if ($dbUrl) {
            $parsed = parse_url($dbUrl);
            if (!empty($parsed['host']) && (empty($base) || $base === '127.0.0.1')) $base = $parsed['host'];
            if (!empty($parsed['user']) && empty($user)) $user = $parsed['user'];
            if (!empty($parsed['pass']) && empty($pass)) $pass = $parsed['pass'];
            if (!empty($parsed['path']) && empty($db)) $db = ltrim($parsed['path'], '/');
            if (!empty($parsed['port'])) $port = $parsed['port'];
        }

        if (str_contains($base, '.')) {
            $parts = explode('.', $base);
            $base = $parts[0];
        }

        $results = [];
        $connectedRegion = null;
        $connectedPdo = null;

        $candidates = [
            'internal_prefer' => ['host' => $base, 'ssl' => 'prefer'],
            'internal_disable' => ['host' => $base, 'ssl' => 'disable'],
            'oregon_require' => ['host' => "{$base}.oregon-postgres.render.com", 'ssl' => 'require'],
            'singapore_require' => ['host' => "{$base}.singapore-postgres.render.com", 'ssl' => 'require'],
            'frankfurt_require' => ['host' => "{$base}.frankfurt-postgres.render.com", 'ssl' => 'require'],
            'ohio_require' => ['host' => "{$base}.ohio-postgres.render.com", 'ssl' => 'require'],
        ];

        foreach ($candidates as $name => $cfg) {
            $candidate = $cfg['host'];
            $ssl = $cfg['ssl'];
            $ip = gethostbyname($candidate);
            try {
                $dsn = "pgsql:host={$candidate};port={$port};dbname={$db};sslmode={$ssl}";
                $pdo = new \PDO($dsn, $user, $pass, [\PDO::ATTR_TIMEOUT => 4, \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
                $tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")->fetchAll(\PDO::FETCH_COLUMN);
                $results[$name] = [
                    'status' => 'connected',
                    'host' => $candidate,
                    'ssl' => $ssl,
                    'ip' => $ip,
                    'tables' => $tables,
                ];
                if (!$connectedRegion) {
                    $connectedRegion = $name;
                    $connectedPdo = $pdo;
                }
            } catch (\Throwable $e) {
                $results[$name] = [
                    'status' => 'failed',
                    'host' => $candidate,
                    'ssl' => $ssl,
                    'ip' => $ip,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'base' => $base,
            'user' => $user,
            'db' => $db,
            'port' => $port,
            'has_password' => !empty($pass),
            'password_len' => strlen($pass),
            'database_url' => env('DATABASE_URL') ? preg_replace('/:[^:@]+@/', ':***@', env('DATABASE_URL')) : null,
            'current_config_host' => config('database.connections.pgsql.host'),
            'current_config_sslmode' => config('database.connections.pgsql.sslmode'),
            'resolv_conf' => file_exists('/etc/resolv.conf') ? file_get_contents('/etc/resolv.conf') : null,
            'connected_region' => $connectedRegion,
            'results' => $results,
        ]);
    });

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

    // Telegram Bot Webhook (Inline Button Callbacks)
    Route::post('/telegram/webhook', [TelegramWebhookController::class, 'handleWebhook']);

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
