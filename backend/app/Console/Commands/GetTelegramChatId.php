<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class GetTelegramChatId extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'telegram:get-chat-id {--token= : Bot token to query} {--save : Automatically save chat ID to .env}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find your Telegram chat ID from recent messages sent to your bot';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $botToken = $this->option('token') ?: config('telegram.bot_token');

        if (empty($botToken)) {
            $this->error('TELEGRAM_BOT_TOKEN is missing!');
            $this->line('Please put your token in backend/.env or run:');
            $this->line('  php artisan telegram:get-chat-id --token=YOUR_BOT_TOKEN');
            return 1;
        }

        $this->info("Checking for recent messages sent to your bot...");
        $url = "https://api.telegram.org/bot{$botToken}/getUpdates";

        try {
            $response = Http::timeout(10)->get($url);

            if (!$response->successful()) {
                $this->error('Telegram API error: ' . $response->body());
                return 1;
            }

            $data = $response->json();
            $updates = $data['result'] ?? [];

            if (empty($updates)) {
                $this->warn('No recent messages found for this bot!');
                $this->line('👉 Please open Telegram, search for your bot, and send it a message (like /start or "hello").');
                $this->line('Then run this command again.');
                return 1;
            }

            $lastUpdate = end($updates);
            $message = $lastUpdate['message'] ?? $lastUpdate['channel_post'] ?? $lastUpdate['my_chat_member'] ?? null;

            if (!$message || !isset($message['chat']['id'])) {
                $this->error('Could not extract chat ID from the latest update:');
                $this->line(json_encode($lastUpdate, JSON_PRETTY_PRINT));
                return 1;
            }

            $chatId = $message['chat']['id'];
            $chatType = $message['chat']['type'] ?? 'private';
            $chatName = $message['chat']['title'] ?? ($message['chat']['first_name'] ?? 'User');

            $this->info("✅ Found Chat ID!");
            $this->line("   Chat ID:   <fg=bright-green;options=bold>{$chatId}</>");
            $this->line("   Chat Type: {$chatType}");
            $this->line("   Name:      {$chatName}");

            $envPath = base_path('.env');
            if (File::exists($envPath)) {
                $envContent = File::get($envPath);
                $envContent = preg_replace(
                    '/^TELEGRAM_CHAT_ID=.*$/m',
                    "TELEGRAM_CHAT_ID={$chatId}",
                    $envContent
                );
                File::put($envPath, $envContent);
                $this->info("💾 Saved TELEGRAM_CHAT_ID={$chatId} into backend/.env!");
            }

            return 0;
        } catch (\Throwable $e) {
            $this->error('Error contacting Telegram: ' . $e->getMessage());
            return 1;
        }
    }
}
