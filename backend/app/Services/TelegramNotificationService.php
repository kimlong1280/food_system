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
                            'text' => 'Accept (ទទួលកុម្ម៉ង់)',
                            'callback_data' => "order_accept_{$order->id}",
                        ],
                        [
                            'text' => 'Reject (បដិសេធ)',
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
                            'text' => 'Confirm Payment (បញ្ជាក់ការទូទាត់)',
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
     * Format a clean, professional restaurant POS receipt message for Telegram without emojis.
     */
    public function formatOrderReceiptMessage(Order $order, ?string $handledByInfo = null): string
    {
        $appName = strtoupper(htmlspecialchars(config('app.name', 'SreyKeo Coffee & Soup'), ENT_QUOTES, 'UTF-8'));
        $orderNumber = htmlspecialchars($order->order_number, ENT_QUOTES, 'UTF-8');
        $tableNumber = htmlspecialchars($order->table?->table_number ?? 'N/A', ENT_QUOTES, 'UTF-8');
        $tableName = $order->table?->name ? ' (' . htmlspecialchars($order->table->name, ENT_QUOTES, 'UTF-8') . ')' : '';

        // Format strictly in Cambodia Timezone (Asia/Phnom_Penh, UTC+7)
        $cambodiaTime = $order->created_at
            ? $order->created_at->copy()->timezone(self::CAMBODIA_TIMEZONE)
            : now(self::CAMBODIA_TIMEZONE);

        $formattedDate = $cambodiaTime->format('d/m/Y');
        $formattedTime = $cambodiaTime->format('h:i A');

        $statusText = match (strtolower($order->status ?? 'pending')) {
            'pending' => 'PENDING (រង់ចាំចម្អិន)',
            'preparing' => 'PREPARING (កំពុងចម្អិន)',
            'ready' => 'READY (រួចរាល់)',
            'served' => 'SERVED (បានជូនដល់តុ)',
            'completed' => 'COMPLETED (បានបញ្ចប់)',
            'cancelled' => 'CANCELLED (បានបោះបង់)',
            default => strtoupper($order->status ?? 'PENDING'),
        };

        $lines = [];
        $lines[] = "================================";
        $lines[] = "<b>         {$appName}</b>";
        $lines[] = "<b>          ORDER RECEIPT</b>";
        $lines[] = "<b>        ( ប័ណ្ណកុម្ម៉ង់ម្ហូប )</b>";
        $lines[] = "================================";
        $lines[] = "<b>Order No  :</b> <code>#{$orderNumber}</code>";
        $lines[] = "<b>Table     :</b> <b>តុ {$tableNumber}{$tableName}</b>";
        $lines[] = "<b>Date/Time :</b> {$formattedDate}, {$formattedTime}";

        if (!empty($order->customer_name)) {
            $customerName = htmlspecialchars($order->customer_name, ENT_QUOTES, 'UTF-8');
            $lines[] = "<b>Customer  :</b> {$customerName}";
        }

        $lines[] = "--------------------------------";
        $lines[] = "<b>ITEMS / មុខទំនិញ:</b>";
        $lines[] = "";

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
            $lines[] = "   Qty: <b>{$qty}</b> x $" . number_format($unitPrice, 2) . " = <b>$" . number_format($subtotalUsd, 2) . "</b> ({$subtotalKhr} KHR)";

            if (!empty($item->note)) {
                $itemNote = htmlspecialchars(trim($item->note), ENT_QUOTES, 'UTF-8');
                $lines[] = "   Note: <i>{$itemNote}</i>";
            }

            $lines[] = "";
            $idx++;
        }

        $totalUsd = (float) $order->total;
        $totalKhr = number_format(round($totalUsd * 4000));
        $formattedTotalUsd = '$' . number_format($totalUsd, 2);

        $lines[] = "--------------------------------";
        $lines[] = "<b>Total Items :</b> <b>{$totalQty}</b>";
        $lines[] = "<b>TOTAL (USD) :</b> <b>{$formattedTotalUsd}</b>";
        $lines[] = "<b>TOTAL (KHR) :</b> <b>{$totalKhr} KHR</b>";

        if (!empty($order->note)) {
            $orderNote = htmlspecialchars(trim($order->note), ENT_QUOTES, 'UTF-8');
            $lines[] = "--------------------------------";
            $lines[] = "<b>Customer Note:</b> <i>\"{$orderNote}\"</i>";
        }

        $lines[] = "--------------------------------";
        $lines[] = "<b>Status      :</b> <b>{$statusText}</b>";
        $lines[] = "<b>Payment     :</b> Pay at Table (គិតលុយពេលភ្ញៀវហៅ)";

        if (!empty($handledByInfo)) {
            $lines[] = "<b>Handled By  :</b> {$handledByInfo}";
        }

        $lines[] = "================================";

        return implode("\n", $lines);
    }

    /**
     * Format a clean, professional Bill Payment Request receipt message without emojis.
     */
    public function formatPaymentRequestMessage(Table $table, $orders, float $totalAmount, ?string $customerName = null, ?string $handledByInfo = null): string
    {
        $appName = strtoupper(htmlspecialchars(config('app.name', 'SreyKeo Coffee & Soup'), ENT_QUOTES, 'UTF-8'));
        $tableNumber = htmlspecialchars($table->table_number, ENT_QUOTES, 'UTF-8');
        $tableName = $table->name ? ' (' . htmlspecialchars($table->name, ENT_QUOTES, 'UTF-8') . ')' : '';

        $cambodiaTime = now(self::CAMBODIA_TIMEZONE);
        $formattedDate = $cambodiaTime->format('d/m/Y');
        $formattedTime = $cambodiaTime->format('h:i A');

        $orderNumbers = collect($orders)->pluck('order_number')->filter()->map(fn ($n) => '#' . htmlspecialchars($n, ENT_QUOTES, 'UTF-8'))->implode(', ');

        $totalKhr = number_format(round($totalAmount * 4000)) . ' KHR';
        $totalUsd = '$' . number_format($totalAmount, 2);

        $lines = [];
        $lines[] = "================================";
        $lines[] = "<b>         {$appName}</b>";
        $lines[] = "<b>      BILL PAYMENT REQUEST</b>";
        $lines[] = "<b>     ( ស្នើសុំទូទាត់ប្រាក់ )</b>";
        $lines[] = "================================";
        $lines[] = "<b>Table       :</b> <b>តុ {$tableNumber}{$tableName}</b>";
        $lines[] = "<b>TOTAL DUE   :</b> <b>{$totalUsd}</b> / <b>{$totalKhr}</b>";

        if (!empty($customerName)) {
            $lines[] = "<b>Customer    :</b> " . htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
        }

        if (!empty($orderNumbers)) {
            $lines[] = "<b>Order(s)    :</b> <code>{$orderNumbers}</code>";
        }

        $lines[] = "<b>Date/Time   :</b> {$formattedDate}, {$formattedTime}";
        $lines[] = "--------------------------------";
        $lines[] = "<b>BILL SUMMARY:</b>";
        $lines[] = "";

        $totalQty = 0;
        $idx = 1;

        foreach ($orders as $order) {
            foreach ($order->orderItems as $item) {
                $name = htmlspecialchars(trim($item->item_name), ENT_QUOTES, 'UTF-8');
                $qty = (int) $item->quantity;
                $subtotalUsd = (float) $item->subtotal;
                $subtotalKhr = number_format(round($subtotalUsd * 4000)) . ' KHR';
                $totalQty += $qty;

                $lines[] = "<b>{$idx}. {$name}</b>";
                $lines[] = "   Qty: <b>{$qty}</b> = $" . number_format($subtotalUsd, 2) . " ({$subtotalKhr})";
                $idx++;
            }
        }

        $lines[] = "";
        $lines[] = "--------------------------------";
        $lines[] = "<b>Total Items :</b> <b>{$totalQty}</b>";
        $lines[] = "<b>TOTAL DUE   :</b> <b>{$totalUsd}</b> / <b>{$totalKhr}</b>";
        $lines[] = "--------------------------------";

        if (!empty($handledByInfo)) {
            $lines[] = "<b>Status      :</b> {$handledByInfo}";
        } else {
            $lines[] = "<b>ACTION REQUIRED:</b>";
            $lines[] = "<i>Table {$tableNumber} requested bill. Please bring receipt to collect payment.</i>";
        }

        $lines[] = "================================";

        return implode("\n", $lines);
    }
}

