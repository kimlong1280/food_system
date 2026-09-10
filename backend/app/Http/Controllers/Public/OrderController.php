<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService
    ) {}

    /**
     * Customer submits order from cart.
     */
    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->createOrder($request->validated());

        return response()->json([
            'message' => 'Order placed successfully!',
            'order' => new OrderResource($order),
        ], 201);
    }

    /**
     * View order details by public order number (e.g., ORD-000001).
     */
    public function show(string $orderNumber): JsonResponse|OrderResource
    {
        $order = Order::with(['table', 'orderItems.menuItem'])
            ->where('order_number', $orderNumber)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return new OrderResource($order);
    }

    /**
     * Get active bill and summary for a table.
     */
    public function getTableBill(int $tableId): JsonResponse
    {
        $bill = $this->orderService->getTableBill($tableId);
        return response()->json($bill);
    }

    /**
     * Customer requests payment for their table (triggers Telegram alert to staff).
     */
    public function requestTablePayment(int $tableId, \Illuminate\Http\Request $request): JsonResponse
    {
        $customerName = $request->input('customer_name');
        $bill = $this->orderService->requestPaymentForTable($tableId, $customerName);

        return response()->json([
            'message' => 'Payment request sent! Staff has been alerted.',
            'bill' => $bill,
        ]);
    }

    /**
     * Customer requests payment from an individual order view.
     */
    public function requestOrderPayment(string $orderNumber): JsonResponse
    {
        $result = $this->orderService->requestPaymentForOrder($orderNumber);

        return response()->json([
            'message' => 'Payment request sent! Staff has been alerted.',
            'data' => $result,
        ]);
    }
}

