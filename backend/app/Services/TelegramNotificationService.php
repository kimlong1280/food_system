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
                            'text' => '✅ ទទួលការកុម្ម៉ង់',
                            'callback_data' => "order_accept_{$order->id}",
                        ],
                        [
                            'text' => '❌ បដិសេធ',
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
     * Format a clean, beautiful table receipt message for Telegram in HTML format with Khmer language.
     */
    public function formatOrderReceiptMessage(Order $order, ?string $handledByInfo = null): string
    {
        $appName = config('app.name', 'SreyKeo Coffee & Soup');
        $escapedAppName = htmlspecialchars($appName, ENT_QUOTES, 'UTF-8');
        $orderNumber = htmlspecialchars($order->order_number, ENT_QUOTES, 'UTF-8');

        $tableNumber = htmlspecialchars($order->table?->table_number ?? 'N/A', ENT_QUOTES, 'UTF-8');
        $tableName = $order->table?->name ? ' (' . htmlspecialchars($order->table->name, ENT_QUOTES, 'UTF-8') . ')' : '';

        // Format strictly in Cambodia Timezone (Asia/Phnom_Penh, UTC+7)
        $cambodiaTime = $order->created_at
            ? $order->created_at->copy()->timezone(self::CAMBODIA_TIMEZONE)
            : now(self::CAMBODIA_TIMEZONE);

        $formattedDate = $cambodiaTime->format('d/m/Y');
        $formattedTime = $cambodiaTime->format('h:i A');

        $lines = [];
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";
        $lines[] = "<b>   " . strtoupper($escapedAppName) . "</b>";
        $lines[] = "<b>      [ 📋 ប័ណ្ណកុម្ម៉ង់ម្ហូបថ្មី ]</b>";
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";
        $lines[] = "<b>◆ លេខកុម្ម៉ង់ :</b> <code>#{$orderNumber}</code>";
        $lines[] = "<b>◆ តុ          :</b> តុ {$tableNumber}{$tableName}";

        if (!empty($order->customer_name)) {
            $customerName = htmlspecialchars($order->customer_name, ENT_QUOTES, 'UTF-8');
            $lines[] = "<b>◆ អតិថិជន     :</b> {$customerName}";
        }

        $lines[] = "<b>◆ ពេលវេលា    :</b> {$formattedDate}, {$formattedTime} (ម៉ោងកម្ពុជា)";
        $lines[] = "";

        // Build Clean Fixed-Width Monospace Table in KHR
        $tableOutput = $this->buildReceiptTable($order);
        $lines[] = "<pre>";
        $lines[] = $tableOutput;
        $lines[] = "</pre>";

        if (!empty($order->note)) {
            $orderNote = htmlspecialchars($order->note, ENT_QUOTES, 'UTF-8');
            $lines[] = "<b>◆ ចំណាំ        :</b> <i>{$orderNote}</i>";
        }

        $statusKhmer = match (strtolower($order->status ?? 'pending')) {
            'pending' => 'រង់ចាំចម្អិន (PENDING)',
            'preparing' => 'កំពុងចម្អិន (PREPARING)',
            'ready' => 'រួចរាល់ (READY)',
            'served' => 'បានជូនដល់តុ (SERVED)',
            'completed' => 'បានបញ្ចប់ (COMPLETED)',
            'cancelled' => 'បានបោះបង់ (CANCELLED)',
            default => strtoupper($order->status ?? 'PENDING'),
        };

        $lines[] = "<b>◆ ស្ថានភាព    :</b> [ {$statusKhmer} ]";
        $lines[] = "<b>◆ ការទូទាត់    :</b> [ គិតលុយពេលភ្ញៀវហៅ ]";

        if (!empty($handledByInfo)) {
            $lines[] = "<b>◆ ដំណើរការដោយ  :</b> {$handledByInfo}";
        }

        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";

        return implode("\n", $lines);
    }

    /**
     * Format a clean, beautiful Bill Payment Request alert for Telegram in Khmer language.
     */
    public function formatPaymentRequestMessage(Table $table, $orders, float $totalAmount, ?string $customerName = null, ?string $handledByInfo = null): string
    {
        $appName = config('app.name', 'SreyKeo Coffee & Soup');
        $escapedAppName = htmlspecialchars($appName, ENT_QUOTES, 'UTF-8');

        $tableNumber = htmlspecialchars($table->table_number, ENT_QUOTES, 'UTF-8');
        $tableName = $table->name ? ' (' . htmlspecialchars($table->name, ENT_QUOTES, 'UTF-8') . ')' : '';

        $cambodiaTime = now(self::CAMBODIA_TIMEZONE);
        $formattedDate = $cambodiaTime->format('d/m/Y');
        $formattedTime = $cambodiaTime->format('h:i A');

        $orderNumbers = collect($orders)->pluck('order_number')->filter()->implode(', ');

        $totalKhr = number_format(round($totalAmount * 4000)) . ' ៛';
        $totalUsd = '$' . number_format($totalAmount, 2);

        $lines = [];
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";
        $lines[] = "<b>   " . strtoupper($escapedAppName) . "</b>";
        $lines[] = "<b>    [ 🔔 ស្នើសុំទូទាត់គិតលុយ ]</b>";
        $lines[] = "<b>      ( BILL PAYMENT REQUEST )</b>";
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";
        $lines[] = "<b>◆ តុ          :</b> <b>តុ {$tableNumber}{$tableName}</b>";
        $lines[] = "<b>◆ ទឹកប្រាក់សរុប :</b> <b>{$totalKhr}</b> ({$totalUsd})";

        if (!empty($customerName)) {
            $lines[] = "<b>◆ អតិថិជន     :</b> " . htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
        }

        if (!empty($orderNumbers)) {
            $lines[] = "<b>◆ លេខកុម្ម៉ង់  :</b> <code>{$orderNumbers}</code>";
        }

        $lines[] = "<b>◆ ពេលវេលា    :</b> {$formattedDate}, {$formattedTime} (ម៉ោងកម្ពុជា)";
        $lines[] = "";

        // Build item summary table across orders in KHR
        $lines[] = "<pre>";
        $lines[] = $this->buildMultiOrderReceiptTable($orders, $totalAmount);
        $lines[] = "</pre>";

        if (!empty($handledByInfo)) {
            $lines[] = "<b>◆ ស្ថានភាពទូទាត់ :</b> {$handledByInfo}";
        } else {
            $lines[] = "<b>👉 ការងារត្រូវធ្វើ (ACTION REQUIRED):</b>";
            $lines[] = "<i>តុលេខ {$tableNumber} បានស្នើសុំទូទាត់គិតលុយ! សូមយកវិក្កយបត្រទៅកាន់តុលេខ {$tableNumber} ដើម្បីប្រមូលប្រាក់។</i>";
        }
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";

        return implode("\n", $lines);
    }

    /**
     * Build monospace item table resembling a clean POS receipt with KHR Riel prices.
     * Width = 30 characters (perfect fit for Telegram mobile and desktop).
     */
    protected function buildReceiptTable(Order $order): string
    {
        $rows = [];
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
        $rows[] = " ITEM (មុខទំនិញ)     QTY   TOTAL(៛)";
        $rows[] = "──────────────────────────────";

        $totalItemsCount = 0;

        foreach ($order->orderItems as $item) {
            $name = trim($item->item_name);
            $qty = (int) $item->quantity;
            $subtotalKhr = number_format(round((float) $item->subtotal * 4000)) . ' ៛';
            $totalItemsCount += $qty;

            // If item name fits within 14 chars, print on single line
            if (mb_strlen($name, 'UTF-8') <= 14) {
                $nameCol = ' ' . str_pad($name, 14, ' ');
                $qtyCol = str_pad((string) $qty, 3, ' ', STR_PAD_LEFT);
                $totalCol = str_pad($subtotalKhr, 12, ' ', STR_PAD_LEFT);
                $rows[] = $nameCol . $qtyCol . $totalCol;
            } else {
                // For longer names, print name on line 1, qty & total on line 2
                $rows[] = ' ' . $name;
                $rows[] = str_repeat(' ', 14) . str_pad((string) $qty, 3, ' ', STR_PAD_LEFT) . str_pad($subtotalKhr, 13, ' ', STR_PAD_LEFT);
            }

            // Print item note if present
            if (!empty($item->note)) {
                $rows[] = "   - ចំណាំ: " . trim($item->note);
            }
        }

        $formattedOrderTotalKhr = number_format(round((float) $order->total * 4000)) . ' ៛';
        $formattedOrderTotalUsd = '$' . number_format((float) $order->total, 2);

        $rows[] = "──────────────────────────────";
        $rows[] = " ចំនួនសរុប (ITEMS): " . $totalItemsCount;
        $rows[] = " តម្លៃសរុប (KHR)  : " . $formattedOrderTotalKhr;
        $rows[] = " សមមូល (USD)     : " . $formattedOrderTotalUsd;
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

        return implode("\n", $rows);
    }

    /**
     * Build monospace item table for multiple orders belonging to a table bill in KHR.
     */
    protected function buildMultiOrderReceiptTable($orders, float $totalAmount): string
    {
        $rows = [];
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
        $rows[] = " ITEM (មុខទំនិញ)     QTY   TOTAL(៛)";
        $rows[] = "──────────────────────────────";

        $totalItemsCount = 0;

        foreach ($orders as $order) {
            foreach ($order->orderItems as $item) {
                $name = trim($item->item_name);
                $qty = (int) $item->quantity;
                $subtotalKhr = number_format(round((float) $item->subtotal * 4000)) . ' ៛';
                $totalItemsCount += $qty;

                if (mb_strlen($name, 'UTF-8') <= 14) {
                    $nameCol = ' ' . str_pad($name, 14, ' ');
                    $qtyCol = str_pad((string) $qty, 3, ' ', STR_PAD_LEFT);
                    $totalCol = str_pad($subtotalKhr, 12, ' ', STR_PAD_LEFT);
                    $rows[] = $nameCol . $qtyCol . $totalCol;
                } else {
                    $rows[] = ' ' . $name;
                    $rows[] = str_repeat(' ', 14) . str_pad((string) $qty, 3, ' ', STR_PAD_LEFT) . str_pad($subtotalKhr, 13, ' ', STR_PAD_LEFT);
                }
            }
        }

        $formattedTotalKhr = number_format(round($totalAmount * 4000)) . ' ៛';
        $formattedTotalUsd = '$' . number_format($totalAmount, 2);

        $rows[] = "──────────────────────────────";
        $rows[] = " ចំនួនសរុប (ITEMS): " . $totalItemsCount;
        $rows[] = " តម្លៃសរុប (KHR)  : " . $formattedTotalKhr;
        $rows[] = " សមមូល (USD)     : " . $formattedTotalUsd;
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

        return implode("\n", $rows);
    }
}

