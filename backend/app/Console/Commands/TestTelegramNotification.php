<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TestTelegramNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:test {--chat_id= : Override chat ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send a test notification message to verify Telegram bot setup';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $botToken = config('telegram.bot_token');
        $chatId = $this->option('chat_id') ?: config('telegram.chat_id');

        if (empty($botToken)) {
            $this->error('TELEGRAM_BOT_TOKEN is missing in backend/.env!');
            $this->info('Please set TELEGRAM_BOT_TOKEN in backend/.env.');
            return 1;
        }

        if (empty($chatId)) {
            $this->error('TELEGRAM_CHAT_ID is missing in backend/.env!');
            $this->info('Please set TELEGRAM_CHAT_ID in backend/.env or provide --chat_id=YOUR_ID.');
            return 1;
        }

        $this->info("Testing Telegram notification...");
        $this->line("Bot Token: " . substr($botToken, 0, 8) . '...' . substr($botToken, -4));
        $this->line("Chat ID: {$chatId}");

        $nowKh = now(\App\Services\TelegramNotificationService::CAMBODIA_TIMEZONE);
        $dateKh = $nowKh->format('d/m/Y');
        $timeKh = $nowKh->format('h:i A');

        $sampleText = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n";
        $sampleText .= "<b>   SREYKEY COFFEE & SOUP</b>\n";
        $sampleText .= "<b>         [ ORDER TICKET ]</b>\n";
        $sampleText .= "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n";
        $sampleText .= "<b>◆ ORDER NO   :</b> <code>#TEST-0001</code>\n";
        $sampleText .= "<b>◆ TABLE      :</b> Table 01 (Indoor)\n";
        $sampleText .= "<b>◆ CUSTOMER   :</b> Test Guest\n";
        $sampleText .= "<b>◆ DATE / TIME:</b> {$dateKh}, {$timeKh} (KH Time)\n\n";
        $sampleText .= "<pre>\n";
        $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $sampleText .= " ITEM              QTY   TOTAL\n";
        $sampleText .= "──────────────────────────────\n";
        $sampleText .= " Iced Latte          2   $5.00\n";
        $sampleText .= " Khmer Beef Soup     1   $4.50\n";
        $sampleText .= "   - Note: Less sweet\n";
        $sampleText .= "──────────────────────────────\n";
        $sampleText .= " TOTAL ITEMS: 3\n";
        $sampleText .= " TOTAL DUE:              $9.50\n";
        $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $sampleText .= "</pre>\n";
        $sampleText .= "<b>◆ ORDER NOTE :</b> <i>Deliver with extra lime</i>\n";
        $sampleText .= "<b>◆ STATUS     :</b> [ PENDING ]\n";
        $sampleText .= "<b>◆ PAYMENT    :</b> [ PAY AT COUNTER ]\n";
        $sampleText .= "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";

        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

        try {
            $response = Http::timeout(10)->post($url, [
                'chat_id' => $chatId,
                'text' => $sampleText,
                'parse_mode' => 'HTML',
            ]);

            if ($response->successful()) {
                $this->info('✅ Telegram test message sent successfully with table format and Cambodia time!');
                return 0;
            } else {
                $this->error('❌ Telegram API returned an error:');
                $this->line($response->body());
                return 1;
            }
        } catch (\Throwable $e) {
            $this->error('❌ Exception occurred while contacting Telegram: ' . $e->getMessage());
            return 1;
        }
    }
}
