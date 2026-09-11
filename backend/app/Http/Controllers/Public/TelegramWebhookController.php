<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Order;
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
            Log::info('Telegram webhook received update:', [
                'update_id' => $update['update_id'] ?? null,
                'has_callback_query' => isset($update['callback_query']),
                'has_message' => isset($update['message']),
            ]);

            // Handle Callback Queries (when user taps an inline reply button)
            if (isset($update['callback_query'])) {
                return $this->handleCallbackQuery($update['callback_query'], $telegramService);
            }

            // Acknowledge all other updates (messages, commands, etc.)
            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            Log::error('Telegram webhook processing exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            // Always respond with 200 OK so Telegram does not retry failed updates indefinitely
            return response()->json(['ok' => true, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Handle inline keyboard callback queries (Accept / Reject order).
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

        // If button is already clicked / static informative button
        if ($data === 'none') {
            $telegramService->answerCallbackQuery($queryId, "ប័ណ្ណកុម្ម៉ង់នេះត្រូវបានដំណើរការរួចរាល់ហើយ (Already handled)");
            return response()->json(['ok' => true]);
        }

        // Match order action: order_accept_{id} or order_reject_{id}
        if (!preg_match('/^order_(accept|reject)_(\d+)$/', $data, $matches)) {
            $telegramService->answerCallbackQuery($queryId, "ទិន្នន័យមិនត្រឹមត្រូវ (Unknown action)");
            return response()->json(['ok' => true]);
        }

        $action = $matches[1];
        $orderId = (int) $matches[2];

        $order = Order::with(['table', 'orderItems'])->find($orderId);
        if (!$order) {
            $telegramService->answerCallbackQuery($queryId, "❌ រកមិនឃើញការកុម្ម៉ង់នេះទេ (Order #{$orderId} not found)");
            return response()->json(['ok' => true]);
        }

        $nowCambodia = now(TelegramNotificationService::CAMBODIA_TIMEZONE)->format('h:i A');

        if ($action === 'accept') {
            // Check if order was already accepted
            if (in_array(strtolower($order->status), ['preparing', 'ready', 'served', 'completed'])) {
                $telegramService->answerCallbackQuery($queryId, "ℹ️ ការកុម្ម៉ង់ #{$order->order_number} ត្រូវបានទទួលរួចហើយ!");
                return response()->json(['ok' => true]);
            }

            if (strtolower($order->status) === 'cancelled') {
                $telegramService->answerCallbackQuery($queryId, "⚠️ ការកុម្ម៉ង់ #{$order->order_number} ត្រូវបានបដិសេធរួចហើយ!");
                return response()->json(['ok' => true]);
            }

            // Update order status to 'preparing'
            $order->update(['status' => 'preparing']);

            Log::info("Order #{$order->order_number} accepted via Telegram by [{$userName}]");

            // Answer Telegram callback popup
            $telegramService->answerCallbackQuery(
                $queryId,
                "✅ បានទទួលការកុម្ម៉ង់ #{$order->order_number} រួចរាល់! ផ្ទះបាយកំពុងចម្អិន...",
                false
            );

            // Update Telegram message in group
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

                $telegramService->editMessageText($chatId, $messageId, $updatedMessage, $updatedReplyMarkup);
            }

            return response()->json([
                'ok' => true,
                'action' => 'accepted',
                'order_number' => $order->order_number,
                'status' => 'preparing',
            ]);
        }

        if ($action === 'reject') {
            // Check if order was already cancelled
            if (strtolower($order->status) === 'cancelled') {
                $telegramService->answerCallbackQuery($queryId, "ℹ️ ការកុម្ម៉ង់ #{$order->order_number} ត្រូវបានបដិសេធរួចហើយ!");
                return response()->json(['ok' => true]);
            }

            // If already being prepared or served, don't allow accidental reject
            if (in_array(strtolower($order->status), ['preparing', 'ready', 'served', 'completed'])) {
                $telegramService->answerCallbackQuery($queryId, "⚠️ ការកុម្ម៉ង់ #{$order->order_number} កំពុងចម្អិនរួចហើយ មិនអាចបដិសេធបានទេ!");
                return response()->json(['ok' => true]);
            }

            // Update order status to 'cancelled'
            $order->update(['status' => 'cancelled']);

            Log::info("Order #{$order->order_number} rejected via Telegram by [{$userName}]");

            // Answer Telegram callback popup
            $telegramService->answerCallbackQuery(
                $queryId,
                "❌ បានបដិសេធការកុម្ម៉ង់ #{$order->order_number}!",
                false
            );

            // Update Telegram message in group
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

                $telegramService->editMessageText($chatId, $messageId, $updatedMessage, $updatedReplyMarkup);
            }

            return response()->json([
                'ok' => true,
                'action' => 'rejected',
                'order_number' => $order->order_number,
                'status' => 'cancelled',
            ]);
        }

        return response()->json(['ok' => true]);
    }
}
