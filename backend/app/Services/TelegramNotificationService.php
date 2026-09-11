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
        $rawChatId = config('telegram.chat_id');
        if (empty($rawChatId)) {
            return [];
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
        $botToken = config('telegram.bot_token');
        $chatIds = $this->getTargetChatIds();

        if (empty($botToken) || empty($chatIds)) {
            Log::info('Telegram notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
            return false;
        }

        try {
            $order->loadMissing(['table', 'orderItems']);

            $message = $this->formatOrderReceiptMessage($order);

            return $this->sendMessageToChats($botToken, $chatIds, $message, "order #{$order->order_number}");
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
        $botToken = config('telegram.bot_token');
        $chatIds = $this->getTargetChatIds();

        if (empty($botToken) || empty($chatIds)) {
            Log::info('Telegram payment alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.');
            return false;
        }

        try {
            $message = $this->formatPaymentRequestMessage($table, $orders, $totalAmount, $customerName);

            return $this->sendMessageToChats($botToken, $chatIds, $message, "Table {$table->table_number} bill payment");
        } catch (\Throwable $e) {
            Log::error("Telegram bill payment alert exception for Table {$table->table_number}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send HTML message to one or multiple chat IDs (groups or personal chats).
     *
     * @param string $botToken
     * @param array<string> $chatIds
     * @param string $message
     * @param string $context
     * @return bool True if at least one message was sent successfully
     */
    protected function sendMessageToChats(string $botToken, array $chatIds, string $message, string $context = ''): bool
    {
        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
        $successCount = 0;

        foreach ($chatIds as $chatId) {
            try {
                $response = Http::timeout(10)->post($url, [
                    'chat_id' => $chatId,
                    'text' => $message,
                    'parse_mode' => 'HTML',
                ]);

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
     * Format a clean, beautiful table receipt message for Telegram in HTML format.
     */
    public function formatOrderReceiptMessage(Order $order): string
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
        $lines[] = "<b>         [ ORDER TICKET ]</b>";
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";
        $lines[] = "<b>◆ ORDER NO   :</b> <code>#{$orderNumber}</code>";
        $lines[] = "<b>◆ TABLE      :</b> Table {$tableNumber}{$tableName}";

        if (!empty($order->customer_name)) {
            $customerName = htmlspecialchars($order->customer_name, ENT_QUOTES, 'UTF-8');
            $lines[] = "<b>◆ CUSTOMER   :</b> {$customerName}";
        }

        $lines[] = "<b>◆ DATE / TIME:</b> {$formattedDate}, {$formattedTime} (KH Time)";
        $lines[] = "";

        // Build Clean Fixed-Width Monospace Table
        $tableOutput = $this->buildReceiptTable($order);
        $lines[] = "<pre>";
        $lines[] = $tableOutput;
        $lines[] = "</pre>";

        if (!empty($order->note)) {
            $orderNote = htmlspecialchars($order->note, ENT_QUOTES, 'UTF-8');
            $lines[] = "<b>◆ ORDER NOTE :</b> <i>{$orderNote}</i>";
        }

        $statusUpper = strtoupper($order->status ?? 'PENDING');
        $lines[] = "<b>◆ STATUS     :</b> [ {$statusUpper} ]";
        $lines[] = "<b>◆ PAYMENT    :</b> [ CALL BILL WHEN READY ]";
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";

        return implode("\n", $lines);
    }

    /**
     * Format a clean, beautiful Bill Payment Request alert for Telegram.
     */
    public function formatPaymentRequestMessage(Table $table, $orders, float $totalAmount, ?string $customerName = null): string
    {
        $appName = config('app.name', 'SreyKeo Coffee & Soup');
        $escapedAppName = htmlspecialchars($appName, ENT_QUOTES, 'UTF-8');

        $tableNumber = htmlspecialchars($table->table_number, ENT_QUOTES, 'UTF-8');
        $tableName = $table->name ? ' (' . htmlspecialchars($table->name, ENT_QUOTES, 'UTF-8') . ')' : '';

        $cambodiaTime = now(self::CAMBODIA_TIMEZONE);
        $formattedDate = $cambodiaTime->format('d/m/Y');
        $formattedTime = $cambodiaTime->format('h:i A');

        $orderNumbers = collect($orders)->pluck('order_number')->filter()->implode(', ');

        $lines = [];
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";
        $lines[] = "<b>   " . strtoupper($escapedAppName) . "</b>";
        $lines[] = "<b>    [ 🔔 BILL PAYMENT REQUEST ]</b>";
        $lines[] = "<b>      ( ស្នើសុំទូទាត់គិតលុយ )</b>";
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";
        $lines[] = "<b>◆ TABLE      :</b> <b>Table {$tableNumber}{$tableName}</b>";
        $lines[] = "<b>◆ TOTAL DUE  :</b> <b>$" . number_format($totalAmount, 2) . "</b>";

        if (!empty($customerName)) {
            $lines[] = "<b>◆ CUSTOMER   :</b> " . htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8');
        }

        if (!empty($orderNumbers)) {
            $lines[] = "<b>◆ ORDERS     :</b> <code>{$orderNumbers}</code>";
        }

        $lines[] = "<b>◆ TIME       :</b> {$formattedDate}, {$formattedTime} (KH Time)";
        $lines[] = "";

        // Build item summary table across orders
        $lines[] = "<pre>";
        $lines[] = $this->buildMultiOrderReceiptTable($orders, $totalAmount);
        $lines[] = "</pre>";

        $lines[] = "<b>👉 ACTION REQUIRED:</b>";
        $lines[] = "<i>Table {$tableNumber} requested to pay! Please bring the bill to Table {$tableNumber} and collect payment.</i>";
        $lines[] = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";

        return implode("\n", $lines);
    }

    /**
     * Build monospace item table resembling a clean POS receipt.
     * Width = 30 characters (perfect fit for Telegram mobile and desktop).
     */
    protected function buildReceiptTable(Order $order): string
    {
        $rows = [];
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
        $rows[] = " ITEM              QTY   TOTAL";
        $rows[] = "──────────────────────────────";

        $totalItemsCount = 0;

        foreach ($order->orderItems as $item) {
            $name = trim($item->item_name);
            $qty = (int) $item->quantity;
            $subtotal = number_format((float) $item->subtotal, 2);
            $totalItemsCount += $qty;

            // If item name fits within 15 chars, print on single line
            if (mb_strlen($name, 'UTF-8') <= 15) {
                $nameCol = ' ' . str_pad($name, 15, ' ');
                $qtyCol = str_pad((string) $qty, 4, ' ', STR_PAD_LEFT);
                $totalCol = str_pad('$' . $subtotal, 10, ' ', STR_PAD_LEFT);
                $rows[] = $nameCol . $qtyCol . $totalCol;
            } else {
                // For longer names, print name on line 1, qty & total on line 2
                $rows[] = ' ' . $name;
                $rows[] = str_repeat(' ', 16) . str_pad((string) $qty, 4, ' ', STR_PAD_LEFT) . str_pad('$' . $subtotal, 10, ' ', STR_PAD_LEFT);
            }

            // Print item note if present
            if (!empty($item->note)) {
                $rows[] = "   - Note: " . trim($item->note);
            }
        }

        $formattedOrderTotal = number_format((float) $order->total, 2);

        $rows[] = "──────────────────────────────";
        $rows[] = " TOTAL ITEMS: " . $totalItemsCount;
        $rows[] = " TOTAL DUE:" . str_pad('$' . $formattedOrderTotal, 19, ' ', STR_PAD_LEFT);
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

        return implode("\n", $rows);
    }

    /**
     * Build monospace item table for multiple orders belonging to a table bill.
     */
    protected function buildMultiOrderReceiptTable($orders, float $totalAmount): string
    {
        $rows = [];
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";
        $rows[] = " ITEM              QTY   TOTAL";
        $rows[] = "──────────────────────────────";

        $totalItemsCount = 0;

        foreach ($orders as $order) {
            foreach ($order->orderItems as $item) {
                $name = trim($item->item_name);
                $qty = (int) $item->quantity;
                $subtotal = number_format((float) $item->subtotal, 2);
                $totalItemsCount += $qty;

                if (mb_strlen($name, 'UTF-8') <= 15) {
                    $nameCol = ' ' . str_pad($name, 15, ' ');
                    $qtyCol = str_pad((string) $qty, 4, ' ', STR_PAD_LEFT);
                    $totalCol = str_pad('$' . $subtotal, 10, ' ', STR_PAD_LEFT);
                    $rows[] = $nameCol . $qtyCol . $totalCol;
                } else {
                    $rows[] = ' ' . $name;
                    $rows[] = str_repeat(' ', 16) . str_pad((string) $qty, 4, ' ', STR_PAD_LEFT) . str_pad('$' . $subtotal, 10, ' ', STR_PAD_LEFT);
                }
            }
        }

        $rows[] = "──────────────────────────────";
        $rows[] = " TOTAL ITEMS: " . $totalItemsCount;
        $rows[] = " TOTAL DUE:" . str_pad('$' . number_format($totalAmount, 2), 19, ' ', STR_PAD_LEFT);
        $rows[] = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

        return implode("\n", $rows);
    }
}

