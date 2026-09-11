<?php

namespace App\Console\Commands;

use App\Services\TelegramNotificationService;
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
    public function handle(TelegramNotificationService $service)
    {
        $botToken = config('telegram.bot_token');
        $rawChatId = $this->option('chat_id') ?: config('telegram.chat_id');

        if (empty($botToken)) {
            $this->error('TELEGRAM_BOT_TOKEN is missing in backend/.env!');
            $this->info('Please set TELEGRAM_BOT_TOKEN in backend/.env.');
            return 1;
        }

        if (empty($rawChatId)) {
            $this->error('TELEGRAM_CHAT_ID is missing in backend/.env!');
            $this->info('Please set TELEGRAM_CHAT_ID in backend/.env or provide --chat_id=YOUR_ID.');
            return 1;
        }

        $chatIds = array_values(array_filter(
            array_map('trim', explode(',', (string) $rawChatId)),
            fn ($id) => $id !== ''
        ));

        $this->info("Testing Telegram notification delivery...");
        $this->line("Bot Token: " . substr($botToken, 0, 8) . '...' . substr($botToken, -4));
        $this->line("Target Chats (" . count($chatIds) . "): " . implode(', ', $chatIds));

        $nowKh = now(TelegramNotificationService::CAMBODIA_TIMEZONE);
        $dateKh = $nowKh->format('d/m/Y');
        $timeKh = $nowKh->format('h:i A');

        $appName = strtoupper(htmlspecialchars(config('app.name', 'SreyKeo Coffee & Soup'), ENT_QUOTES, 'UTF-8'));

        $sampleText = "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n";
        $sampleText .= "<b>   {$appName}</b>\n";
        $sampleText .= "<b>      [ 📋 ប័ណ្ណកុម្ម៉ង់ម្ហូបថ្មី ]</b>\n";
        $sampleText .= "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>\n";
        $sampleText .= "<b>◆ លេខកុម្ម៉ង់ :</b> <code>#TEST-0001</code>\n";
        $sampleText .= "<b>◆ តុ          :</b> តុ 01 (ខាងក្នុង)\n";
        $sampleText .= "<b>◆ អតិថិជន     :</b> ភ្ញៀវសាកល្បង\n";
        $sampleText .= "<b>◆ ពេលវេលា    :</b> {$dateKh}, {$timeKh} (ម៉ោងកម្ពុជា)\n\n";
        $sampleText .= "<pre>\n";
        $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $sampleText .= " ITEM (មុខទំនិញ)     QTY   TOTAL(៛)\n";
        $sampleText .= "──────────────────────────────\n";
        $sampleText .= " Iced Latte          2   20,000 ៛\n";
        $sampleText .= " Khmer Beef Soup     1   18,000 ៛\n";
        $sampleText .= "   - ចំណាំ: ផ្អែមតិច\n";
        $sampleText .= "──────────────────────────────\n";
        $sampleText .= " ចំនួនសរុប (ITEMS): 3\n";
        $sampleText .= " តម្លៃសរុប (KHR)  : 38,000 ៛\n";
        $sampleText .= " សមមូល (USD)     : $9.50\n";
        $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $sampleText .= "</pre>\n";
        $sampleText .= "<b>◆ ចំណាំ        :</b> <i>បន្ថែមក្រូចឆ្មារ</i>\n";
        $sampleText .= "<b>◆ ស្ថានភាព    :</b> [ រង់ចាំចម្អិន (PENDING) ]\n";
        $sampleText .= "<b>◆ ការទូទាត់    :</b> [ គិតលុយនៅកន្លែងគិតប្រាក់ ]\n";
        $sampleText .= "<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>";

        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
        $allSuccess = true;

        $replyMarkup = [
            'inline_keyboard' => [
                [
                    [
                        'text' => '✅ ទទួលការកុម្ម៉ង់',
                        'callback_data' => 'order_accept_1',
                    ],
                    [
                        'text' => '❌ បដិសេធ',
                        'callback_data' => 'order_reject_1',
                    ],
                ],
            ],
        ];

        foreach ($chatIds as $chatId) {
            $isGroup = str_starts_with($chatId, '-');
            $typeLabel = $isGroup ? "<fg=yellow>[GROUP / ALL MEMBERS]</>" : "<fg=cyan>[PERSONAL CHAT]</>";

            $this->newLine();
            $this->line("Sending to {$typeLabel} <fg=bright-white;options=bold>{$chatId}</>...");

            try {
                $response = Http::timeout(10)->post($url, [
                    'chat_id' => $chatId,
                    'text' => $sampleText,
                    'parse_mode' => 'HTML',
                    'reply_markup' => $replyMarkup,
                ]);

                if ($response->successful()) {
                    if ($isGroup) {
                        $this->info("✅ SUCCESS: Sent to group! ALL members in this group can see this alert!");
                    } else {
                        $this->info("✅ SUCCESS: Sent to personal chat!");
                    }
                } else {
                    $allSuccess = false;
                    $this->error("❌ FAILED for {$chatId}: " . $response->body());
                }
            } catch (\Throwable $e) {
                $allSuccess = false;
                $this->error("❌ Exception for {$chatId}: " . $e->getMessage());
            }
        }

        return $allSuccess ? 0 : 1;
    }
}
