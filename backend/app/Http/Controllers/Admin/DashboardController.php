<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\OrderResource;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
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
        $preparingOrdersCount = Order::where('status', 'preparing')->count();
        $readyOrdersCount = Order::where('status', 'ready')->count();
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

        // 3. Tables Occupancy & Bill Requests
        $totalTablesCount = Table::count();
        $activeTableIds = Order::whereNotIn('status', ['completed', 'cancelled'])
            ->pluck('table_id')
            ->unique()
            ->filter();
        $activeTablesCount = $activeTableIds->count();

        // Orders where guest requested bill
        $billRequestedCount = Order::whereNotNull('payment_requested_at')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->count();

        // 4. Tables with live occupancy status for dashboard grid
        $tablesList = Table::orderBy('table_number')->get()->map(function ($table) use ($activeTableIds) {
            return [
                'id' => $table->id,
                'table_number' => $table->table_number,
                'name' => $table->name,
                'capacity' => $table->capacity,
                'is_active' => $table->status === 'active',
                'is_occupied' => $activeTableIds->contains($table->id),
            ];
        });

        // 5. Recent 12 Orders with eager loading
        $recentOrders = Order::with(['table', 'orderItems'])
            ->latest('id')
            ->limit(12)
            ->get();

        // 6. Popular Items (top 5 by total quantity ordered)
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

        // 7. Unavailable Items Count
        $unavailableItemsCount = MenuItem::where('is_available', false)->count();

        return response()->json([
            'today_orders' => $todayOrdersCount,
            'pending_orders' => $pendingOrdersCount,
            'preparing_orders' => $preparingOrdersCount,
            'ready_orders' => $readyOrdersCount,
            'completed_orders' => $completedOrdersCount,
            'today_revenue' => $todayRevenue,
            'formatted_today_revenue' => '$' . number_format($todayRevenue, 2),
            'formatted_today_revenue_khr' => number_format(round($todayRevenue * 4000)) . ' ៛',
            'total_revenue' => $totalRevenue,
            'formatted_total_revenue' => '$' . number_format($totalRevenue, 2),
            'formatted_total_revenue_khr' => number_format(round($totalRevenue * 4000)) . ' ៛',
            'total_orders' => $totalOrdersCount,
            'total_tables' => $totalTablesCount,
            'active_tables' => $activeTablesCount,
            'bill_requested_count' => $billRequestedCount,
            'tables' => $tablesList,
            'status_counts' => $statusCounts,
            'unavailable_items_count' => $unavailableItemsCount,
            'recent_orders' => OrderResource::collection($recentOrders),
            'popular_items' => $popularItems,
        ]);
    }
}
