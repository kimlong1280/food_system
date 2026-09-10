<?php

namespace App\Services;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        protected TelegramNotificationService $telegramService
    ) {}

    /**
     * Create an order from validated data with database transaction and price calculation.
     */
    public function createOrder(array $data): Order
    {
        return DB::transaction(function () use ($data) {
            // 1. Verify Table exists and is active
            $table = Table::find($data['table_id']);
            if (!$table || !$table->isActive()) {
                throw ValidationException::withMessages([
                    'table_id' => ['The selected table is currently unavailable or inactive.'],
                ]);
            }

            // 2. Fetch and validate all menu items
            $itemIds = collect($data['items'])->pluck('menu_item_id')->unique()->all();
            $menuItems = MenuItem::whereIn('id', $itemIds)->get()->keyBy('id');

            foreach ($data['items'] as $itemData) {
                $menuItem = $menuItems->get($itemData['menu_item_id']);

                if (!$menuItem) {
                    throw ValidationException::withMessages([
                        'items' => ["Menu item ID {$itemData['menu_item_id']} does not exist."],
                    ]);
                }

                if (!$menuItem->is_available) {
                    throw ValidationException::withMessages([
                        'items' => ["\"{$menuItem->name}\" is currently sold out or unavailable."],
                    ]);
                }
            }

            // 3. Calculate order subtotal and total strictly from DB prices (never trust frontend)
            $calculatedSubtotal = 0.0;
            $itemsToInsert = [];

            foreach ($data['items'] as $itemData) {
                $menuItem = $menuItems->get($itemData['menu_item_id']);
                $quantity = (int) $itemData['quantity'];
                $price = (float) $menuItem->price;
                $lineSubtotal = round($price * $quantity, 2);
                $calculatedSubtotal += $lineSubtotal;

                $itemsToInsert[] = [
                    'menu_item_id' => $menuItem->id,
                    'item_name' => $menuItem->name,
                    'price' => $price,
                    'quantity' => $quantity,
                    'subtotal' => $lineSubtotal,
                    'note' => $itemData['note'] ?? null,
                ];
            }

            $calculatedTotal = round($calculatedSubtotal, 2);

            // 4. Create Order
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'table_id' => $table->id,
                'customer_name' => $data['customer_name'] ?? null,
                'status' => 'pending',
                'subtotal' => $calculatedSubtotal,
                'total' => $calculatedTotal,
                'note' => $data['note'] ?? null,
            ]);

            // 5. Create Order Items
            foreach ($itemsToInsert as $item) {
                $item['order_id'] = $order->id;
                OrderItem::create($item);
            }

            // Load relations for response and notification
            $order->load(['table', 'orderItems.menuItem']);

            // 6. Send Telegram Notification (safely handled inside service)
            $this->telegramService->sendOrderNotification($order);

            return $order;
        });
    }

    /**
     * Get aggregated active bill and order details for a table.
     */
    public function getTableBill(int $tableId): array
    {
        $table = Table::findOrFail($tableId);

        $activeOrders = Order::with(['table', 'orderItems.menuItem'])
            ->where('table_id', $tableId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->orderBy('created_at', 'asc')
            ->get();

        $totalDue = round((float) $activeOrders->sum('total'), 2);
        $isPaymentRequested = $activeOrders->contains(fn ($o) => $o->payment_requested_at !== null);
        $latestPaymentRequestedAt = $activeOrders->pluck('payment_requested_at')->filter()->sortDesc()->first();

        return [
            'table' => [
                'id' => $table->id,
                'table_number' => $table->table_number,
                'name' => $table->name,
                'status' => $table->status,
            ],
            'orders' => \App\Http\Resources\OrderResource::collection($activeOrders),
            'total_due' => $totalDue,
            'orders_count' => $activeOrders->count(),
            'items_count' => $activeOrders->sum(fn ($o) => $o->orderItems->sum('quantity')),
            'is_payment_requested' => $isPaymentRequested,
            'payment_requested_at' => $latestPaymentRequestedAt,
        ];
    }

    /**
     * Customer requests payment / call bill for their table.
     */
    public function requestPaymentForTable(int $tableId, ?string $customerName = null): array
    {
        $table = Table::findOrFail($tableId);

        $activeOrders = Order::with(['table', 'orderItems.menuItem'])
            ->where('table_id', $tableId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->get();

        if ($activeOrders->isEmpty()) {
            throw ValidationException::withMessages([
                'table' => ['There are no active orders for Table ' . $table->table_number . ' to pay.'],
            ]);
        }

        // Set payment_requested_at timestamp on all active orders for this table
        $now = now();
        Order::whereIn('id', $activeOrders->pluck('id'))->update([
            'payment_requested_at' => $now,
        ]);

        // Refresh orders
        foreach ($activeOrders as $order) {
            $order->payment_requested_at = $now;
        }

        $totalDue = round((float) $activeOrders->sum('total'), 2);
        $resolvedCustomerName = $customerName ?: $activeOrders->pluck('customer_name')->filter()->first();

        // Send Telegram alert
        $this->telegramService->sendPaymentRequestNotification(
            $table,
            $activeOrders,
            $totalDue,
            $resolvedCustomerName
        );

        return $this->getTableBill($tableId);
    }

    /**
     * Request payment for a specific order by order number.
     * Consolidates to the table if the order belongs to an active table.
     */
    public function requestPaymentForOrder(string $orderNumber): array
    {
        $order = Order::with(['table', 'orderItems.menuItem'])
            ->where('order_number', $orderNumber)
            ->firstOrFail();

        if (in_array($order->status, ['completed', 'cancelled'])) {
            throw ValidationException::withMessages([
                'order' => ["Order {$orderNumber} is already {$order->status}."],
            ]);
        }

        if ($order->table_id) {
            return $this->requestPaymentForTable($order->table_id, $order->customer_name);
        }

        // Standalone order (without table)
        $now = now();
        $order->update(['payment_requested_at' => $now]);

        return [
            'order' => new \App\Http\Resources\OrderResource($order),
            'total_due' => (float) $order->total,
            'is_payment_requested' => true,
            'payment_requested_at' => $now,
        ];
    }
}

