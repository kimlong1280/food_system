<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Table;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramNotificationService
{
    /**
     * Cambodia Timezone Identifier (UTC+7)
     */
    public const CAMBODIA_TIMEZONE = 'Asia/Phnom_Penh';

    /**
     * Get array of target chat IDs (supports single ID or comma-separated list of IDs).
     *
     * @return array<string>
     */
    public function getTargetChatIds(): array
    {
        $rawChatId = config('telegram.chat_id') ?: env('TELEGRAM_CHAT_ID', '-5376919317');
        if (empty($rawChatId)) {
            $rawChatId = '-5376919317';
        }

        return array_values(array_filter(
            array_map('trim', explode(',', (string) $rawChatId)),
            fn ($id) => $id !== ''
        ));
    }

    /**
     * Send order notification to Telegram group(s) / chat(s).
     */
    public function sendOrderNotification(Order $order): bool
    {
        $botToken = config('telegram.bot_token') ?: env('TELEGRAM_BOT_TOKEN', '8825095914:AAELG9lUC_WCylFve2Lfe563Km2iCAy-2UM');
        $chatIds = $this->getTargetChatIds();

        if (empty($botToken) || empty($chatIds)) {
            Log::info('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
            return false;
        }

        try {
            $order->loadMissing(['table', 'orderItems']);

            $message = $this->formatOrderReceiptMessage($order);

            // Two inline reply buttons below order ticket: Accept and Reject
            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        [
                            'text' => '✅ ទទួលការកុម្ម៉ង់ (Accept)',
                            'callback_data' => "order_accept_{$order->id}",
                        ],
                        [
                            'text' => '❌ បដិសេធ (Reject)',
                            'callback_data' => "order_reject_{$order->id}",
                        ],
                    ],
                ],
            ];

            return $this->sendMessageToChats($botToken, $chatIds, $message, "order #{$order->order_number}", $replyMarkup);
        } catch (\Throwable $e) {
            // Never break order creation if Telegram fails
            Log::error("Telegram notification exception for order #{$order->order_number}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send bill payment request notification to Telegram group(s) / chat(s).
     */
    public function sendPaymentRequestNotification(Table $table, $orders, float $totalAmount, ?string $customerName = null): bool
    {
        $botToken = config('telegram.bot_token') ?: env('TELEGRAM_BOT_TOKEN', '8825095914:AAELG9lUC_WCylFve2Lfe563Km2iCAy-2UM');
        $chatIds = $this->getTargetChatIds();

        if (empty($botToken) || empty($chatIds)) {
            Log::info('Telegram payment alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
            return false;
        }

        try {
            $message = $this->formatPaymentRequestMessage($table, $orders, $totalAmount, $customerName);

            // Inline button below BILL PAYMENT REQUEST to confirm payment
            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        [
                            'text' => '✅ បញ្ជាក់ការទូទាត់ប្រាក់ (Confirm Payment)',
                            'callback_data' => "payment_confirm_{$table->id}",
                        ],
                    ],
                ],
            ];

            return $this->sendMessageToChats($botToken, $chatIds, $message, "Table {$table->table_number} bill payment", $replyMarkup);
        } catch (\Throwable $e) {
            Log::error("Telegram bill payment alert exception for Table {$table->table_number}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send HTML message to one or multiple chat IDs (groups or personal chats) with optional inline keyboard.
     *
     * @param string $botToken
     * @param array<string> $chatIds
     * @param string $message
     * @param string $context
     * @param array|null $replyMarkup
     * @return bool True if at least one message was sent successfully
     */
    protected function sendMessageToChats(string $botToken, array $chatIds, string $message, string $context = '', ?array $replyMarkup = null): bool
    {
        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
        $successCount = 0;

        foreach ($chatIds as $chatId) {
            try {
                $payload = [
                    'chat_id' => $chatId,
                    'text' => $message,
                    'parse_mode' => 'HTML',
                ];

                if (!empty($replyMarkup)) {
                    $payload['reply_markup'] = $replyMarkup;
                }

                $response = Http::timeout(10)->post($url, $payload);

                if ($response->successful()) {
                    Log::info("Telegram notification ({$context}) sent successfully to [{$chatId}]");
                    $successCount++;
                } else {
                    Log::error("Failed to send Telegram notification ({$context}) to [{$chatId}]: " . $response->body());
                }
            } catch (\Throwable $e) {
                Log::error("Telegram notification exception ({$context}) to [{$chatId}]: " . $e->getMessage());
            }
        }

        return $successCount > 0;
    }

    /**
     * Answer callback query when user clicks an inline reply button in Telegram.
     */
    public function answerCallbackQuery(string $callbackQueryId, string $text, bool $showAlert = false): bool
    {
        $botToken = config('telegram.bot_token') ?: env('TELEGRAM_BOT_TOKEN', '8825095914:AAELG9lUC_WCylFve2Lfe563Km2iCAy-2UM');
        if (empty($botToken)) {
            return false;
        }

        try {
            $url = "https://api.telegram.org/bot{$botToken}/answerCallbackQuery";
            $response = Http::timeout(5)->post($url, [
                'callback_query_id' => $callbackQueryId,
                'text' => $text,
                'show_alert' => $showAlert,
            ]);

            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("Telegram answerCallbackQuery exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Edit message text and reply markup in Telegram in-place.
     */
    public function editMessageText(string|int $chatId, int $messageId, string $newText, ?array $replyMarkup = null): bool
    {
        $botToken = config('telegram.bot_token') ?: env('TELEGRAM_BOT_TOKEN', '8825095914:AAELG9lUC_WCylFve2Lfe563Km2iCAy-2UM');
        if (empty($botToken)) {
            return false;
        }

        try {
            $url = "https://api.telegram.org/bot{$botToken}/editMessageText";
            $payload = [
                'chat_id' => $chatId,
                'message_id' => $messageId,
                'text' => $newText,
                'parse_mode' => 'HTML',
            ];

            if ($replyMarkup !== null) {
                $payload['reply_markup'] = $replyMarkup;
            }

            $response = Http::timeout(8)->post($url, $payload);
            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("Telegram editMessageText exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Edit message reply markup only in Telegram in-place.
     */
    public function editMessageReplyMarkup(string|int $chatId, int $messageId, ?array $replyMarkup = null): bool
    {
        $botToken = config('telegram.bot_token') ?: env('TELEGRAM_BOT_TOKEN', '8825095914:AAELG9lUC_WCylFve2Lfe563Km2iCAy-2UM');
        if (empty($botToken)) {
            return false;
        }

        try {
            $url = "https://api.telegram.org/bot{$botToken}/editMessageReplyMarkup";
            $payload = [
                'chat_id' => $chatId,
                'message_id' => $messageId,
            ];

            if ($replyMarkup !== null) {
                $payload['reply_markup'] = $replyMarkup;
            }

            $response = Http::timeout(8)->post($url, $payload);
            return $response->successful();
        } catch (\Throwable $e) {
            Log::error("Telegram editMessageReplyMarkup exception: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Format a clean, modern order notification message for Telegram in HTML format.
     */
    public function formatOrderReceiptMessage(Order $order, ?string $handledByInfo = null): string
    {
        $orderNumber = htmlspecialchars($order->order_number, ENT_QUOTES, 'UTF-8');
        $tableNumber = htmlspecialchars($order->table?->table_number ?? 'N/A', ENT_QUOTES, 'UTF-8');
        $tableName = $order->table?->name ? ' (' . htmlspecialchars($order->table->name, ENT_QUOTES, 'UTF-8') . ')' : '';

        // Format strictly in Cambodia Timezone (Asia/Phnom_Penh, UTC+7)
        $cambodiaTime = $order->created_at
            ? $order->created_at->copy()->timezone(self::CAMBODIA_TIMEZONE)
            : now(self::CAMBODIA_TIMEZONE);

        $formattedDate = $cambodiaTime->format('d/m/Y');
        $formattedTime = $cambodiaTime->format('h:i A');

        $statusKhmer = match (strtolower($order->status ?? 'pending')) {
            'pending' => '⏳ រង់ចាំទទួល (Pending)',
            'preparing' => '🍳 កំពុងចម្អិន (Preparing)',
            'ready' => '🍽️ រួចរាល់ (Ready)',
            'served' => '✅ បានជូនដល់តុ (Served)',
            'completed' => '🎉 បានបញ្ចប់ (Completed)',
            'cancelled' => '❌ បានបោះបង់ (Cancelled)',
            default => strtoupper($order->status ?? 'PENDING'),
        };

        $lines = [];
        $lines[] = "🛎 <b>ការកុម្ម៉ង់ម្ហូបថ្មី (NEW ORDER)</b>";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "📍 <b>តុ (Table):</b> <b>តុ {$tableNumber}{$tableName}</b>";
        $lines[] = "🧾 <b>លេខកុម្ម៉ង់ (Order ID):</b> <code>#{$orderNumber}</code>";
        $lines[] = "⏰ <b>ម៉ោង (Time):</b> {$formattedTime} • {$formattedDate}";

        if (!empty($order->customer_name)) {
            $customerName = htmlspecialchars($order->customer_name, ENT_QUOTES, 'UTF-8');
            $lines[] = "👤 <b>អតិថិជន (Customer):</b> {$customerName}";
        }

        $lines[] = "";
        $lines[] = "📋 <b>មុខម្ហូបដែលបានកុម្ម៉ង់ (ITEMS):</b>";
        $lines[] = "──────────────────────";

        $totalQty = 0;
        $idx = 1;

        foreach ($order->orderItems as $item) {
            $name = htmlspecialchars(trim($item->item_name), ENT_QUOTES, 'UTF-8');
            $qty = (int) $item->quantity;
            $unitPrice = (float) $item->price;
            $subtotalUsd = (float) $item->subtotal;
            $subtotalKhr = number_format(round($subtotalUsd * 4000));
            $totalQty += $qty;

            $lines[] = "<b>{$idx}. {$name}</b>";
            $lines[] = "   └ <b>{$qty}x</b> × $" . number_format($unitPrice, 2) . " = <b>$" . number_format($subtotalUsd, 2) . "</b> ({$subtotalKhr} ៛)";

            if (!empty($item->note)) {
                $itemNote = htmlspecialchars(trim($item->note), ENT_QUOTES, 'UTF-8');
                $lines[] = "   └ 📝 <i>ចំណាំ: {$itemNote}</i>";
            }

            $idx++;
        }

        $totalUsd = (float) $order->total;
        $totalKhr = number_format(round($totalUsd * 4000));
        $formattedTotalUsd = '$' . number_format($totalUsd, 2);

        $lines[] = "━━━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "📦 <b>ចំនួនសរុប (Total Items):</b> <b>{$totalQty}</b>";
        $lines[] = "💵 <b>សរុបជាដុល្លារ (Total USD):</b> <b>{$formattedTotalUsd}</b>";
        $lines[] = "🇰🇭 <b>សរុបជារៀល (Total KHR):</b> <b>{$totalKhr} ៛</b>";

        if (!empty($order->note)) {
            $orderNote = htmlspecialchars(trim($order->note), ENT_QUOTES, 'UTF-8');
            $lines[] = "──────────────────────";
            $lines[] = "📝 <b>ចំណាំពីអតិថិជន (Order Note):</b>";
            $lines[] = "<i>\"{$orderNote}\"</i>";
        }

        $lines[] = "──────────────────────";
        $lines[] = "📌 <b>ស្ថានភាព (Status):</b> <b>[ {$statusKhmer} ]</b>";
        $lines[] = "💳 <b>ការទូទាត់ (Payment):</b> [ គិតលុយពេលភ្ញៀវហៅ ]";

        if (!empty($handledByInfo)) {
            $lines[] = "👤 <b>ដំណើរការដោយ (Staff):</b> {$handledByInfo}";
        }

        $lines[] = "━━━━━━━━━━━━━━━━━━━━━━";

        return implode("\n", $lines);
    }

    /**
     * Format a clean, modern Bill Payment Request alert for Telegram.
     */
    public function formatPaymentRequestMessage(Table $table, $orders, float $totalAmount, ?string $customerName = null, ?string $handledByInfo = null): string
    {
        $tableNumber = htmlspecialchars($table->table_number, ENT_QUOTES, 'UTF-8');
        $tableName = $table->name ? ' (' . htmlspecialchars($table->name, ENT_QUOTES, 'UTF-8') . ')' : '';

        $cambodiaTime = now(self::CAMBODIA_TIMEZONE);
        $formattedDate = $cambodiaTime->format('d/m/Y');
        $formattedTime = $cambodiaTime->format('h:i A');

        $orderNumbers = collect($orders)->pluck('order_number')->filter()->map(fn ($n) => '#' . htmlspecialchars($n, ENT_QUOTES, 'UTF-8'))->implode(', ');

        $totalKhr = number_format(round($totalAmount * 4000)) . ' ៛';
        $totalUsd = '$' . number_format($totalAmount, 2);

        $lines = [];
        $lines[] = "🔔 <b>ស្នើសុំទូទាត់ប្រាក់ (BILL PAYMENT)</b>";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━━━";
        $lines[] = "📍 <b>តុ (Table):</b> <b>តុ {$tableNumber}{$tableName}</b>";
        $lines[] = "💰 <b>ទឹកប្រាក់ត្រូវទូទាត់ (Total Due):</b>";
        $lines[] = "👉 <b>{$totalUsd}</b>  •  <b>{$totalKhr}</b>";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━━━";

        if (!empty($customerName)) {
            $lines[] = "👤 <b>អតិថិជន (Customer):</b> " . htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
        }

        if (!empty($orderNumbers)) {
            $lines[] = "🧾 <b>វិក្កយបត្រ (Orders):</b> <code>{$orderNumbers}</code>";
        }

        $lines[] = "⏰ <b>ម៉ោង (Time):</b> {$formattedTime} • {$formattedDate}";
        $lines[] = "";
        $lines[] = "📋 <b>សង្ខេបមុខម្ហូបទាំងអស់ (BILL SUMMARY):</b>";
        $lines[] = "──────────────────────";

        $totalQty = 0;
        $idx = 1;

        foreach ($orders as $order) {
            foreach ($order->orderItems as $item) {
                $name = htmlspecialchars(trim($item->item_name), ENT_QUOTES, 'UTF-8');
                $qty = (int) $item->quantity;
                $subtotalUsd = (float) $item->subtotal;
                $subtotalKhr = number_format(round($subtotalUsd * 4000)) . ' ៛';
                $totalQty += $qty;

                $lines[] = "<b>{$idx}. {$name}</b>";
                $lines[] = "   └ <b>{$qty}x</b>  •  $" . number_format($subtotalUsd, 2) . " ({$subtotalKhr})";
                $idx++;
            }
        }

        $lines[] = "──────────────────────";
        $lines[] = "📦 <b>ចំនួនមុខម្ហូបសរុប (Items):</b> <b>{$totalQty}</b>";
        $lines[] = "━━━━━━━━━━━━━━━━━━━━━━";

        if (!empty($handledByInfo)) {
            $lines[] = "✅ <b>ស្ថានភាពទូទាត់:</b> {$handledByInfo}";
        } else {
            $lines[] = "⚠️ <b>ការងារត្រូវធ្វើ (ACTION REQUIRED):</b>";
            $lines[] = "<i>តុលេខ {$tableNumber} បានស្នើសុំគិតលុយ! សូមយកវិក្កយបត្រទៅកាន់តុដើម្បីប្រមូលប្រាក់។</i>";
        }

        $lines[] = "━━━━━━━━━━━━━━━━━━━━━━";

        return implode("\n", $lines);
    }
}

