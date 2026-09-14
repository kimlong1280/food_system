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
    protected $signature = 'telegram:test {--chat_id= : Override chat ID} {--bill : Send Bill Payment alert test}';

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

        if ($this->option('bill')) {
            $sampleText = "🔔 <b>ស្នើសុំទូទាត់ប្រាក់ (BILL PAYMENT)</b>\n";
            $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━\n";
            $sampleText .= "📍 <b>តុ (Table):</b> <b>តុ 01 (ខាងក្នុង)</b>\n";
            $sampleText .= "💰 <b>ទឹកប្រាក់ត្រូវទូទាត់ (Total Due):</b>\n";
            $sampleText .= "👉 <b>$9.50</b>  •  <b>38,000 ៛</b>\n";
            $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━\n";
            $sampleText .= "👤 <b>អតិថិជន (Customer):</b> ភ្ញៀវសាកល្បង\n";
            $sampleText .= "🧾 <b>វិក្កយបត្រ (Orders):</b> <code>#TEST-0001</code>\n";
            $sampleText .= "⏰ <b>ម៉ោង (Time):</b> {$timeKh} • {$dateKh}\n\n";
            $sampleText .= "📋 <b>សង្ខេបមុខម្ហូបទាំងអស់ (BILL SUMMARY):</b>\n";
            $sampleText .= "──────────────────────\n";
            $sampleText .= "<b>1. Iced Latte</b>\n";
            $sampleText .= "   └ <b>2x</b>  •  $5.00 (20,000 ៛)\n";
            $sampleText .= "<b>2. Khmer Beef Soup</b>\n";
            $sampleText .= "   └ <b>1x</b>  •  $4.50 (18,000 ៛)\n";
            $sampleText .= "──────────────────────\n";
            $sampleText .= "📦 <b>ចំនួនមុខម្ហូបសរុប (Items):</b> <b>3</b>\n";
            $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━\n";
            $sampleText .= "⚠️ <b>ការងារត្រូវធ្វើ (ACTION REQUIRED):</b>\n";
            $sampleText .= "<i>តុលេខ 01 បានស្នើសុំគិតលុយ! សូមយកវិក្កយបត្រទៅកាន់តុដើម្បីប្រមូលប្រាក់។</i>\n";
            $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━";

            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        [
                            'text' => '✅ បញ្ជាក់ការទូទាត់ប្រាក់ (Confirm Payment)',
                            'callback_data' => 'payment_confirm_1',
                        ],
                    ],
                ],
            ];
        } else {
            $sampleText = "🛎 <b>ការកុម្ម៉ង់ម្ហូបថ្មី (NEW ORDER)</b>\n";
            $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━\n";
            $sampleText .= "📍 <b>តុ (Table):</b> <b>តុ 01 (ខាងក្នុង)</b>\n";
            $sampleText .= "🧾 <b>លេខកុម្ម៉ង់ (Order ID):</b> <code>#TEST-0001</code>\n";
            $sampleText .= "⏰ <b>ម៉ោង (Time):</b> {$timeKh} • {$dateKh}\n";
            $sampleText .= "👤 <b>អតិថិជន (Customer):</b> ភ្ញៀវសាកល្បង\n\n";
            $sampleText .= "📋 <b>មុខម្ហូបដែលបានកុម្ម៉ង់ (ITEMS):</b>\n";
            $sampleText .= "──────────────────────\n";
            $sampleText .= "<b>1. Iced Latte</b>\n";
            $sampleText .= "   └ <b>2x</b> × $2.50 = <b>$5.00</b> (20,000 ៛)\n";
            $sampleText .= "<b>2. Khmer Beef Soup</b>\n";
            $sampleText .= "   └ <b>1x</b> × $4.50 = <b>$4.50</b> (18,000 ៛)\n";
            $sampleText .= "   └ 📝 <i>ចំណាំ: ផ្អែមតិច</i>\n";
            $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━\n";
            $sampleText .= "📦 <b>ចំនួនសរុប (Total Items):</b> <b>3</b>\n";
            $sampleText .= "💵 <b>សរុបជាដុល្លារ (Total USD):</b> <b>$9.50</b>\n";
            $sampleText .= "🇰🇭 <b>សរុបជារៀល (Total KHR):</b> <b>38,000 ៛</b>\n";
            $sampleText .= "──────────────────────\n";
            $sampleText .= "📝 <b>ចំណាំពីអតិថិជន (Order Note):</b>\n";
            $sampleText .= "<i>\"បន្ថែមក្រូចឆ្មារ\"</i>\n";
            $sampleText .= "──────────────────────\n";
            $sampleText .= "📌 <b>ស្ថានភាព (Status):</b> <b>[ ⏳ រង់ចាំទទួល (Pending) ]</b>\n";
            $sampleText .= "💳 <b>ការទូទាត់ (Payment):</b> [ គិតលុយពេលភ្ញៀវហៅ ]\n";
            $sampleText .= "━━━━━━━━━━━━━━━━━━━━━━";

            $replyMarkup = [
                'inline_keyboard' => [
                    [
                        [
                            'text' => '✅ ទទួលការកុម្ម៉ង់ (Accept)',
                            'callback_data' => 'order_accept_1',
                        ],
                        [
                            'text' => '❌ បដិសេធ (Reject)',
                            'callback_data' => 'order_reject_1',
                        ],
                    ],
                ],
            ];
        }

        $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
        $allSuccess = true;

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
