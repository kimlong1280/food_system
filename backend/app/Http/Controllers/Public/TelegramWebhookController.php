<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Table;
use App\Services\TelegramNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    /**
     * Handle incoming webhook updates from Telegram Bot API.
     */
    public function handleWebhook(Request $request, TelegramNotificationService $telegramService): JsonResponse
    {
        try {
            $update = $request->all();
            Log::info('Telegram webhook update:', [
                'update_id' => $update['update_id'] ?? null,
                'has_callback_query' => isset($update['callback_query']),
            ]);

            // Handle Callback Queries (when user taps an inline reply button)
            if (isset($update['callback_query'])) {
                return $this->handleCallbackQuery($update['callback_query'], $telegramService);
            }

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            Log::error('Telegram webhook processing exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['ok' => true, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Handle inline keyboard callback queries (Accept / Reject order / Confirm Payment).
     */
    protected function handleCallbackQuery(array $callbackQuery, TelegramNotificationService $telegramService): JsonResponse
    {
        $queryId = (string) ($callbackQuery['id'] ?? '');
        $data = (string) ($callbackQuery['data'] ?? '');
        $fromUser = $callbackQuery['from'] ?? [];
        $userName = trim(($fromUser['first_name'] ?? '') . ' ' . ($fromUser['last_name'] ?? ''));
        if (empty($userName)) {
            $userName = $fromUser['username'] ?? 'បុគ្គលិក (Staff)';
        }

        $message = $callbackQuery['message'] ?? [];
        $chatId = $message['chat']['id'] ?? null;
        $messageId = $message['message_id'] ?? null;
        $originalText = (string) ($message['text'] ?? '');

        $nowCambodia = now(TelegramNotificationService::CAMBODIA_TIMEZONE)->format('h:i A');

        // 1. If button is static / already processed
        if ($data === 'none') {
            $telegramService->answerCallbackQuery($queryId, "ប័ណ្ណនេះត្រូវបានដំណើរការរួចរាល់ហើយ (Already completed)");
            return response()->json(['ok' => true]);
        }

        // 2. Confirm Bill Payment: payment_confirm_{tableId}
        if (preg_match('/^payment_confirm_(\d+)$/', $data, $matches)) {
            $tableId = (int) $matches[1];
            $table = Table::find($tableId);

            $activeOrders = Order::with(['table', 'orderItems'])
                ->where('table_id', $tableId)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->get();

            if ($activeOrders->isNotEmpty()) {
                // Mark all active orders for this table as completed
                Order::whereIn('id', $activeOrders->pluck('id'))->update(['status' => 'completed']);

                $tableName = $table?->table_number ?? $tableId;
                $telegramService->answerCallbackQuery(
                    $queryId,
                    "✅ បានបញ្ជាក់ការទូទាត់ប្រាក់តុ {$tableName} រួចរាល់!",
                    false
                );

                if ($chatId && $messageId && $table) {
                    $handledByInfo = "✅ បានទូទាត់ប្រាក់រួចរាល់ដោយ: {$userName} ({$nowCambodia})";
                    $total = (float) $activeOrders->sum('total');
                    $updatedMessage = $telegramService->formatPaymentRequestMessage($table, $activeOrders, $total, null, $handledByInfo);

                    $updatedReplyMarkup = [
                        'inline_keyboard' => [
                            [
                                [
                                    'text' => "✅ បានទូទាត់ប្រាក់រួចរាល់ដោយ: {$userName}",
                                    'callback_data' => 'none',
                                ],
                            ],
                        ],
                    ];

                    $edited = $telegramService->editMessageText($chatId, $messageId, $updatedMessage, $updatedReplyMarkup);
                    if (!$edited) {
                        $telegramService->editMessageReplyMarkup($chatId, $messageId, $updatedReplyMarkup);
                    }
                }
            } else {
                // Table has no active orders (or was a test message)
                $telegramService->answerCallbackQuery(
                    $queryId,
                    "✅ បានបញ្ជាក់ការទូទាត់ប្រាក់ដោយជោគជ័យ!",
                    false
                );

                if ($chatId && $messageId) {
                    $updatedReplyMarkup = [
                        'inline_keyboard' => [
                            [
                                [
                                    'text' => "✅ បានទូទាត់ប្រាក់រួចរាល់ដោយ: {$userName}",
                                    'callback_data' => 'none',
                                ],
                            ],
                        ],
                    ];
                    $telegramService->editMessageReplyMarkup($chatId, $messageId, $updatedReplyMarkup);
                }
            }

            return response()->json([
                'ok' => true,
                'action' => 'payment_confirmed',
                'table_id' => $tableId,
            ]);
        }

        // 3. Match Order Action: order_accept_{id} or order_reject_{id}
        if (preg_match('/^order_(accept|reject)_(\d+)$/', $data, $matches)) {
            $action = $matches[1];
            $orderId = (int) $matches[2];

            $order = Order::with(['table', 'orderItems'])->find($orderId);

            // Handle Accept
            if ($action === 'accept') {
                if ($order) {
                    // If order exists in database
                    if (in_array(strtolower($order->status), ['preparing', 'ready', 'served', 'completed'])) {
                        $telegramService->answerCallbackQuery($queryId, "ℹ️ ការកុម្ម៉ង់ #{$order->order_number} ត្រូវបានទទួលរួចហើយ!");
                        return response()->json(['ok' => true]);
                    }

                    if (strtolower($order->status) === 'cancelled') {
                        $telegramService->answerCallbackQuery($queryId, "⚠️ ការកុម្ម៉ង់ #{$order->order_number} ត្រូវបានបដិសេធរួចហើយ!");
                        return response()->json(['ok' => true]);
                    }

                    $order->update(['status' => 'preparing']);

                    $telegramService->answerCallbackQuery(
                        $queryId,
                        "✅ បានទទួលការកុម្ម៉ង់ #{$order->order_number} រួចរាល់! ផ្ទះបាយកំពុងចម្អិន...",
                        false
                    );

                    if ($chatId && $messageId) {
                        $handledByInfo = "✅ {$userName} (កំពុងចម្អិន - {$nowCambodia})";
                        $updatedMessage = $telegramService->formatOrderReceiptMessage($order, $handledByInfo);

                        $updatedReplyMarkup = [
                            'inline_keyboard' => [
                                [
                                    [
                                        'text' => "✅ បានទទួលដោយ: {$userName} (កំពុងចម្អិន)",
                                        'callback_data' => 'none',
                                    ],
                                ],
                            ],
                        ];

                        $edited = $telegramService->editMessageText($chatId, $messageId, $updatedMessage, $updatedReplyMarkup);
                        if (!$edited) {
                            $telegramService->editMessageReplyMarkup($chatId, $messageId, $updatedReplyMarkup);
                        }
                    }
                } else {
                    // Fallback for test alert or orders from previous restart
                    $telegramService->answerCallbackQuery(
                        $queryId,
                        "✅ បានទទួលការកុម្ម៉ង់ដោយជោគជ័យ! (Order accepted)",
                        false
                    );

                    if ($chatId && $messageId) {
                        $updatedReplyMarkup = [
                            'inline_keyboard' => [
                                [
                                    [
                                        'text' => "✅ បានទទួលដោយ: {$userName} (កំពុងចម្អិន)",
                                        'callback_data' => 'none',
                                    ],
                                ],
                            ],
                        ];
                        $telegramService->editMessageReplyMarkup($chatId, $messageId, $updatedReplyMarkup);
                    }
                }

                return response()->json([
                    'ok' => true,
                    'action' => 'accepted',
                    'order_id' => $orderId,
                    'status' => 'preparing',
                ]);
            }

            // Handle Reject
            if ($action === 'reject') {
                if ($order) {
                    if (strtolower($order->status) === 'cancelled') {
                        $telegramService->answerCallbackQuery($queryId, "ℹ️ ការកុម្ម៉ង់ #{$order->order_number} ត្រូវបានបដិសេធរួចហើយ!");
                        return response()->json(['ok' => true]);
                    }

                    if (in_array(strtolower($order->status), ['preparing', 'ready', 'served', 'completed'])) {
                        $telegramService->answerCallbackQuery($queryId, "⚠️ ការកុម្ម៉ង់ #{$order->order_number} កំពុងចម្អិនរួចហើយ មិនអាចបដិសេធបានទេ!");
                        return response()->json(['ok' => true]);
                    }

                    $order->update(['status' => 'cancelled']);

                    $telegramService->answerCallbackQuery(
                        $queryId,
                        "❌ បានបដិសេធការកុម្ម៉ង់ #{$order->order_number}!",
                        false
                    );

                    if ($chatId && $messageId) {
                        $handledByInfo = "❌ បដិសេធដោយ: {$userName} ({$nowCambodia})";
                        $updatedMessage = $telegramService->formatOrderReceiptMessage($order, $handledByInfo);

                        $updatedReplyMarkup = [
                            'inline_keyboard' => [
                                [
                                    [
                                        'text' => "❌ បានបដិសេធដោយ: {$userName}",
                                        'callback_data' => 'none',
                                    ],
                                ],
                            ],
                        ];

                        $edited = $telegramService->editMessageText($chatId, $messageId, $updatedMessage, $updatedReplyMarkup);
                        if (!$edited) {
                            $telegramService->editMessageReplyMarkup($chatId, $messageId, $updatedReplyMarkup);
                        }
                    }
                } else {
                    $telegramService->answerCallbackQuery(
                        $queryId,
                        "❌ បានបដិសេធការកុម្ម៉ង់សាកល្បង!",
                        false
                    );

                    if ($chatId && $messageId) {
                        $updatedReplyMarkup = [
                            'inline_keyboard' => [
                                [
                                    [
                                        'text' => "❌ បានបដិសេធដោយ: {$userName}",
                                        'callback_data' => 'none',
                                    ],
                                ],
                            ],
                        ];
                        $telegramService->editMessageReplyMarkup($chatId, $messageId, $updatedReplyMarkup);
                    }
                }

                return response()->json([
                    'ok' => true,
                    'action' => 'rejected',
                    'order_id' => $orderId,
                    'status' => 'cancelled',
                ]);
            }
        }

        $telegramService->answerCallbackQuery($queryId, "បានដំណើរការរួចរាល់ (Done)");
        return response()->json(['ok' => true]);
    }
}
