<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class SetTelegramWebhook extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:set-webhook 
                            {--url= : Webhook URL (defaults to production backend URL)}
                            {--info : Only display current webhook status}
                            {--delete : Remove the current webhook}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set, check, or remove Telegram bot webhook for inline button replies';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $botToken = config('telegram.bot_token') ?: env('TELEGRAM_BOT_TOKEN', '8825095914:AAELG9lUC_WCylFve2Lfe563Km2iCAy-2UM');

        if (empty($botToken)) {
            $this->error('TELEGRAM_BOT_TOKEN is missing!');
            return 1;
        }

        // 1. Info only
        if ($this->option('info')) {
            $this->info("Checking Telegram Webhook Info...");
            $res = Http::get("https://api.telegram.org/bot{$botToken}/getWebhookInfo");
            $this->line(json_encode($res->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            return 0;
        }

        // 2. Delete webhook
        if ($this->option('delete')) {
            $this->info("Removing Telegram Webhook...");
            $res = Http::post("https://api.telegram.org/bot{$botToken}/deleteWebhook");
            if ($res->successful()) {
                $this->info("✅ Webhook removed successfully.");
            } else {
                $this->error("❌ Failed to remove webhook: " . $res->body());
            }
            return 0;
        }

        // 3. Set webhook
        $defaultUrl = 'https://food-system-backend-uroh.onrender.com/api/telegram/webhook';
        $targetUrl = $this->option('url') ?: $defaultUrl;

        $this->info("Setting Telegram Webhook to: {$targetUrl}");

        $response = Http::post("https://api.telegram.org/bot{$botToken}/setWebhook", [
            'url' => $targetUrl,
            'allowed_updates' => ['message', 'callback_query'],
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $this->info("✅ SUCCESS: Telegram webhook registered!");
            $this->line("Description: " . ($data['description'] ?? 'OK'));
            $this->newLine();
            $this->line("When staff clicks [ ✅ ទទួលការកុម្ម៉ង់ ] or [ ❌ បដិសេធ ] in Telegram, Telegram will POST to: {$targetUrl}");
        } else {
            $this->error("❌ FAILED to set webhook: " . $response->body());
            return 1;
        }

        return 0;
    }
}
