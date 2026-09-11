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
    protected $signature = 'telegram:get-chat-id
                            {--token= : Bot token to query}
                            {--group : Automatically pick the first active group}
                            {--both : Save both the group ID and personal chat ID (comma-separated)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Find your Telegram chat/group IDs from recent messages or memberships';

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

        $this->info("Checking Telegram updates for recent messages & group memberships...");
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
                $this->warn('No recent messages or group updates found for this bot!');
                $this->displayHelpInstructions();
                return 1;
            }

            $groups = [];
            $privateChats = [];

            foreach ($updates as $update) {
                $chat = $update['message']['chat'] ?? $update['my_chat_member']['chat'] ?? $update['channel_post']['chat'] ?? null;
                if (!$chat || !isset($chat['id'])) {
                    continue;
                }

                $chatId = (string) $chat['id'];
                $type = $chat['type'] ?? 'unknown';
                $title = $chat['title'] ?? ($chat['first_name'] ?? 'Unknown');
                $username = $chat['username'] ?? '';
                $status = $update['my_chat_member']['new_chat_member']['status'] ?? null;

                if (in_array($type, ['group', 'supergroup', 'channel'])) {
                    if (!isset($groups[$chatId]) || $status !== null) {
                        $groups[$chatId] = [
                            'id' => $chatId,
                            'title' => $title,
                            'type' => $type,
                            'status' => $status ?? ($groups[$chatId]['status'] ?? 'active'),
                        ];
                    }
                } elseif ($type === 'private') {
                    $privateChats[$chatId] = [
                        'id' => $chatId,
                        'title' => $title,
                        'username' => $username ? "@{$username}" : '',
                        'type' => 'private',
                    ];
                }
            }

            // Separate active groups from groups the bot left
            $activeGroups = array_filter($groups, fn ($g) => !in_array($g['status'], ['left', 'kicked']));

            $this->newLine();
            $this->info("=== FOUND TELEGRAM CHATS ===");

            if (!empty($groups)) {
                $this->line("<fg=yellow;options=bold>📁 GROUPS & CHANNELS:</>");
                foreach ($groups as $id => $g) {
                    $statusTag = $g['status'] === 'left' ? "<fg=red>[BOT LEFT/REMOVED]</>" : "<fg=green>[ACTIVE {$g['status']}]</>";
                    $this->line("   • <fg=bright-cyan>{$g['title']}</> ({$g['type']}) {$statusTag}");
                    $this->line("     Chat ID: <fg=bright-green;options=bold>{$id}</>");
                }
            }

            if (!empty($privateChats)) {
                $this->line("<fg=yellow;options=bold>👤 PERSONAL CHATS (1-on-1):</>");
                foreach ($privateChats as $id => $p) {
                    $this->line("   • <fg=bright-cyan>{$p['title']}</> {$p['username']}");
                    $this->line("     Chat ID: <fg=bright-blue>{$id}</>");
                }
            }

            // Determine target to save
            $selectedId = null;

            if ($this->option('both') && !empty($activeGroups) && !empty($privateChats)) {
                $firstGroup = reset($activeGroups);
                $firstPrivate = reset($privateChats);
                $selectedId = "{$firstGroup['id']},{$firstPrivate['id']}";
                $this->info("Selecting BOTH group '{$firstGroup['title']}' AND personal chat '{$firstPrivate['title']}'");
            } elseif ($this->option('group') || !empty($activeGroups)) {
                // Priority: auto-pick active group
                $firstGroup = reset($activeGroups);
                $selectedId = $firstGroup['id'];
                $this->info("Selecting active group: <fg=bright-green>{$firstGroup['title']}</> ({$selectedId})");
            } elseif (!empty($groups)) {
                $firstGroup = reset($groups);
                $selectedId = $firstGroup['id'];
                $this->warn("Note: Bot may have left '{$firstGroup['title']}'. Saving ID: {$selectedId}");
            } elseif (!empty($privateChats)) {
                $firstPrivate = reset($privateChats);
                $selectedId = $firstPrivate['id'];
                $this->info("Selecting personal chat: {$firstPrivate['title']} ({$selectedId})");
            }

            if ($selectedId) {
                $this->saveChatIdToEnv($selectedId);
            } else {
                $this->displayHelpInstructions();
            }

            return 0;
        } catch (\Throwable $e) {
            $this->error('Error contacting Telegram: ' . $e->getMessage());
            return 1;
        }
    }

    protected function saveChatIdToEnv(string $chatId): void
    {
        $envPath = base_path('.env');
        if (File::exists($envPath)) {
            $envContent = File::get($envPath);
            if (preg_match('/^TELEGRAM_CHAT_ID=.*$/m', $envContent)) {
                $envContent = preg_replace(
                    '/^TELEGRAM_CHAT_ID=.*$/m',
                    "TELEGRAM_CHAT_ID={$chatId}",
                    $envContent
                );
            } else {
                $envContent .= "\nTELEGRAM_CHAT_ID={$chatId}\n";
            }
            File::put($envPath, $envContent);
            $this->info("💾 Saved TELEGRAM_CHAT_ID={$chatId} into backend/.env!");
            $this->line("👉 Run <fg=yellow>php artisan telegram:test</> to verify delivery to your group!");
        }
    }

    protected function displayHelpInstructions(): void
    {
        $this->newLine();
        $this->line("<fg=yellow;options=bold>┌─────────────────────────────────────────────────────────────┐</>");
        $this->line("<fg=yellow;options=bold>│ HOW TO CONNECT YOUR TELEGRAM BOT TO A GROUP (FOR MEMBERS)   │</>");
        $this->line("<fg=yellow;options=bold>└─────────────────────────────────────────────────────────────┘</>");
        $this->line("1. Open Telegram and open your Staff / Team Group.");
        $this->line("2. Add your bot (<fg=bright-cyan>@SK_Ordering_Bot</>) as a Member to the group.");
        $this->line("3. Promote the bot to <fg=bright-green;options=bold>Administrator</> of the group.");
        $this->line("   (Or ensure 'Send Messages' permission is turned ON).");
        $this->line("4. Send a command in the group: <fg=bright-yellow>/start</> or <fg=bright-yellow>@SK_Ordering_Bot</> hello.");
        $this->line("5. Run this command again: <fg=yellow>php artisan telegram:get-chat-id</>");
        $this->newLine();
    }
}
