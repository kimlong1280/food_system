<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Table;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_can_fetch_public_categories(): void
    {
        $response = $this->getJson('/api/categories');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'status', 'sort_order']
                ]
            ]);
    }

    public function test_can_fetch_menu_items_with_search_and_filter(): void
    {
        $response = $this->getJson('/api/menu-items?search=burger');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertStringContainsStringIgnoringCase('Burger', $data[0]['name']);
    }

    public function test_can_validate_active_table(): void
    {
        $table = Table::where('status', 'active')->first();
        $response = $this->getJson("/api/tables/{$table->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $table->id,
                    'table_number' => $table->table_number,
                    'is_active' => true,
                ]
            ]);
    }

    public function test_invalid_table_returns_404(): void
    {
        $response = $this->getJson('/api/tables/99999');
        $response->assertStatus(404);
    }

    public function test_customer_can_place_order_and_backend_calculates_price(): void
    {
        $table = Table::where('status', 'active')->first();
        $burger = MenuItem::where('name', 'Chicken Burger')->first();
        $coke = MenuItem::where('name', 'Coca Cola')->first();

        $payload = [
            'table_id' => $table->id,
            'customer_name' => 'Alice',
            'note' => 'Less ice please',
            'items' => [
                [
                    'menu_item_id' => $burger->id,
                    'quantity' => 2,
                    'note' => 'No onions',
                ],
                [
                    'menu_item_id' => $coke->id,
                    'quantity' => 1,
                    'note' => 'Extra cold',
                ],
            ],
        ];

        $response = $this->postJson('/api/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'order' => [
                    'id',
                    'order_number',
                    'table_id',
                    'status',
                    'subtotal',
                    'total',
                    'items',
                ]
            ]);

        $orderData = $response->json('order');
        // Chicken Burger ($4.50 * 2 = $9.00) + Coca Cola ($1.50 * 1 = $1.50) = $10.50
        $this->assertEquals(10.50, $orderData['total']);
        $this->assertEquals('pending', $orderData['status']);
        $this->assertCount(2, $orderData['items']);
    }

    public function test_admin_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'token',
                'user' => ['id', 'name', 'email', 'role']
            ]);

        $this->assertEquals('admin', $response->json('user.role'));
    }

    public function test_admin_dashboard_requires_auth(): void
    {
        $response = $this->getJson('/api/admin/dashboard');
        $response->assertStatus(401);
    }

    public function test_authenticated_admin_can_access_dashboard(): void
    {
        $admin = User::where('role', 'admin')->first();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'today_orders',
                'pending_orders',
                'completed_orders',
                'today_revenue',
                'recent_orders',
                'popular_items',
            ]);
    }
}
