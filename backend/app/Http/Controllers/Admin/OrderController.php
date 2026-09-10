<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class OrderController extends Controller
{
    /**
     * List orders with filtering by status, table, search and date.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Order::with(['table', 'orderItems']);

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by table ID
        if ($request->filled('table_id')) {
            $query->where('table_id', $request->table_id);
        }

        // Filter by date
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // Search by order number or customer name
        if ($request->filled('search')) {
            $search = '%' . strtolower($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(order_number) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(customer_name) LIKE ?', [$search]);
            });
        }

        $orders = $query->latest('id')->paginate($request->integer('per_page', 20));

        return OrderResource::collection($orders);
    }

    /**
     * Show single order with all item snapshots and table info.
     */
    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['table', 'orderItems.menuItem']));
    }

    /**
     * Update order status: pending -> confirmed -> preparing -> ready -> served -> completed, or cancelled.
     */
    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $order->update([
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => "Order status updated to \"{$order->status}\".",
            'order' => new OrderResource($order->load(['table', 'orderItems'])),
        ]);
    }
}
