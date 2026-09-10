<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OrderResource;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get aggregated admin dashboard metrics.
     */
    public function stats(): JsonResponse
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();

        // 1. Core KPIs
        $todayOrdersCount = Order::whereBetween('created_at', [$todayStart, $todayEnd])->count();
        $pendingOrdersCount = Order::where('status', 'pending')->count();
        $completedOrdersCount = Order::where('status', 'completed')->count();
        $todayRevenue = (float) Order::whereBetween('created_at', [$todayStart, $todayEnd])
            ->whereNotIn('status', ['cancelled'])
            ->sum('total');

        $totalRevenue = (float) Order::whereNotIn('status', ['cancelled'])->sum('total');
        $totalOrdersCount = Order::count();

        // 2. Status Breakdown
        $statusCounts = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        // 3. Recent 8 Orders
        $recentOrders = Order::with(['table', 'orderItems'])
            ->latest('id')
            ->limit(8)
            ->get();

        // 4. Popular Items (top 5 by total quantity ordered)
        $popularItemIds = OrderItem::select('menu_item_id', DB::raw('SUM(quantity) as total_qty'))
            ->whereNotNull('menu_item_id')
            ->groupBy('menu_item_id')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $popularItems = [];
        foreach ($popularItemIds as $row) {
            $item = MenuItem::with('category')->find($row->menu_item_id);
            if ($item) {
                $popularItems[] = [
                    'item' => new MenuItemResource($item),
                    'total_ordered' => (int) $row->total_qty,
                ];
            }
        }

        // 5. Unavailable Items Count
        $unavailableItemsCount = MenuItem::where('is_available', false)->count();

        return response()->json([
            'today_orders' => $todayOrdersCount,
            'pending_orders' => $pendingOrdersCount,
            'completed_orders' => $completedOrdersCount,
            'today_revenue' => $todayRevenue,
            'formatted_today_revenue' => '$' . number_format($todayRevenue, 2),
            'total_revenue' => $totalRevenue,
            'formatted_total_revenue' => '$' . number_format($totalRevenue, 2),
            'total_orders' => $totalOrdersCount,
            'status_counts' => $statusCounts,
            'unavailable_items_count' => $unavailableItemsCount,
            'recent_orders' => OrderResource::collection($recentOrders),
            'popular_items' => $popularItems,
        ]);
    }
}
