<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Table;
use App\Services\TelegramNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_telegram_webhook_handles_accept_callback(): void
    {
        Http::fake([
            'https://api.telegram.org/bot*' => Http::response(['ok' => true], 200),
        ]);

        $table = Table::first();
        $order = Order::create([
            'order_number' => 'ORD-TEST-001',
            'table_id' => $table->id,
            'customer_name' => 'John Doe',
            'status' => 'pending',
            'subtotal' => 10.00,
            'total' => 10.00,
        ]);

        $payload = [
            'update_id' => 99999,
            'callback_query' => [
                'id' => 'cb_query_123',
                'from' => [
                    'id' => 12345,
                    'first_name' => 'Hong',
                    'last_name' => 'Kimlong',
                    'username' => 'HongKimLong1',
                ],
                'message' => [
                    'message_id' => 777,
                    'chat' => [
                        'id' => -5376919317,
                        'title' => 'Hong and NUN',
                        'type' => 'group',
                    ],
                ],
                'data' => "order_accept_{$order->id}",
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'action' => 'accepted',
                'status' => 'preparing',
            ]);

        $order->refresh();
        $this->assertEquals('preparing', $order->status);
    }

    public function test_telegram_webhook_handles_reject_callback(): void
    {
        Http::fake([
            'https://api.telegram.org/bot*' => Http::response(['ok' => true], 200),
        ]);

        $table = Table::first();
        $order = Order::create([
            'order_number' => 'ORD-TEST-002',
            'table_id' => $table->id,
            'customer_name' => 'Jane Doe',
            'status' => 'pending',
            'subtotal' => 5.00,
            'total' => 5.00,
        ]);

        $payload = [
            'update_id' => 99998,
            'callback_query' => [
                'id' => 'cb_query_456',
                'from' => [
                    'id' => 12345,
                    'first_name' => 'Hong',
                    'username' => 'HongKimLong1',
                ],
                'message' => [
                    'message_id' => 778,
                    'chat' => [
                        'id' => -5376919317,
                        'title' => 'Hong and NUN',
                        'type' => 'group',
                    ],
                ],
                'data' => "order_reject_{$order->id}",
            ],
        ];

        $response = $this->postJson('/api/telegram/webhook', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'ok' => true,
                'action' => 'rejected',
                'status' => 'cancelled',
            ]);

        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
    }
}
