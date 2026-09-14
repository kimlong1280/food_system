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

    public function test_admin_can_create_menu_item_with_multiple_prices(): void
    {
        $admin = User::where('role', 'admin')->first();
        $cat = Category::first();

        $payload = [
            'category_id' => $cat->id,
            'name' => 'Signature Hot Pot',
            'description' => 'Rich broth with fresh beef slices and assorted vegetables.',
            'type' => 'food',
            'is_available' => true,
            'is_featured' => true,
            'prices' => [
                [
                    'name' => 'Small (1 Person)',
                    'price' => 3.50,
                    'is_default' => false,
                ],
                [
                    'name' => 'Medium (2-3 Persons)',
                    'price' => 6.00,
                    'is_default' => true,
                ],
                [
                    'name' => 'Large (4-5 Persons)',
                    'price' => 9.50,
                    'is_default' => false,
                ],
            ],
        ];

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/menu-items', $payload);

        $response->assertStatus(201);
        $item = $response->json('item');
        $this->assertEquals('Signature Hot Pot', $item['name']);
        $this->assertTrue($item['has_multiple_prices']);
        $this->assertCount(3, $item['prices']);
        $this->assertEquals(6.00, $item['price']); // Default price
        $this->assertEquals('$3.50 - $9.50', $item['formatted_price_range']);
    }

    public function test_customer_can_order_specific_price_variant(): void
    {
        $admin = User::where('role', 'admin')->first();
        $cat = Category::first();
        $table = Table::where('status', 'active')->first();

        // Create dish with variants
        $createRes = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/menu-items', [
            'category_id' => $cat->id,
            'name' => 'Crispy Chicken Wings',
            'type' => 'food',
            'is_available' => true,
            'prices' => [
                ['name' => 'Set 4pcs', 'price' => 2.50, 'is_default' => true],
                ['name' => 'Set 8pcs', 'price' => 4.50, 'is_default' => false],
            ],
        ]);

        $createRes->assertStatus(201);
        $itemData = $createRes->json('item');
        $largeVariant = collect($itemData['prices'])->firstWhere('name', 'Set 8pcs');

        // Customer places order for Large variant (qty 2 = 2 * $4.50 = $9.00)
        $orderRes = $this->postJson('/api/orders', [
            'table_id' => $table->id,
            'customer_name' => 'Bob',
            'items' => [
                [
                    'menu_item_id' => $itemData['id'],
                    'menu_item_price_id' => $largeVariant['id'],
                    'quantity' => 2,
                ],
            ],
        ]);

        $orderRes->assertStatus(201);
        $orderData = $orderRes->json('order');
        $this->assertEquals(9.00, $orderData['total']);
        $this->assertEquals('Crispy Chicken Wings (Set 8pcs)', $orderData['items'][0]['item_name']);
        $this->assertEquals('Set 8pcs', $orderData['items'][0]['variant_name']);
        $this->assertEquals($largeVariant['id'], $orderData['items'][0]['menu_item_price_id']);
    }

    public function test_admin_can_update_menu_item_with_multiple_prices(): void
    {
        $admin = User::where('role', 'admin')->first();
        $cat = Category::first();

        // Create single price dish
        $createRes = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/menu-items', [
            'category_id' => $cat->id,
            'name' => 'Beef Lok Lak',
            'type' => 'food',
            'price' => 5.00,
            'is_available' => true,
        ]);
        $createRes->assertStatus(201);
        $itemId = $createRes->json('item.id');

        // Update to multiple prices
        $updateRes = $this->actingAs($admin, 'sanctum')->putJson("/api/admin/menu-items/{$itemId}", [
            'category_id' => $cat->id,
            'name' => 'Beef Lok Lak Special',
            'type' => 'food',
            'is_available' => true,
            'prices' => [
                ['name' => 'Regular', 'price' => 5.00, 'is_default' => true],
                ['name' => 'Extra Meat', 'price' => 7.50, 'is_default' => false],
            ],
        ]);

        $updateRes->assertStatus(200);
        $updatedItem = $updateRes->json('item');
        $this->assertEquals('Beef Lok Lak Special', $updatedItem['name']);
        $this->assertTrue($updatedItem['has_multiple_prices']);
        $this->assertEquals(2, count($updatedItem['prices']));
        $this->assertEquals('$5.00 - $7.50', $updatedItem['formatted_price_range']);
    }

    public function test_admin_can_create_dish_with_khr_prices_like_fried_rice_10000_and_15000(): void
    {
        $admin = User::where('role', 'admin')->first();
        $cat = Category::first();
        $table = Table::where('status', 'active')->first();

        // Create Fried Rice with 10000 Riel and 15000 Riel prices (no explicit names provided)
        $createRes = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/menu-items', [
            'category_id' => $cat->id,
            'name' => 'Fried Rice (បាយឆា)',
            'type' => 'food',
            'is_available' => true,
            'prices' => [
                ['price' => 10000, 'currency' => 'KHR', 'is_default' => true],
                ['price' => 15000, 'currency' => 'KHR', 'is_default' => false],
            ],
        ]);

        $createRes->assertStatus(201);
        $dish = $createRes->json('item');
        $this->assertTrue($dish['has_multiple_prices']);
        $this->assertCount(2, $dish['prices']);
        $this->assertEquals('10,000 ៛', $dish['prices'][0]['name']);
        $this->assertEquals(2.50, $dish['prices'][0]['price']);
        $this->assertEquals('15,000 ៛', $dish['prices'][1]['name']);
        $this->assertEquals(3.75, $dish['prices'][1]['price']);
        $this->assertEquals('10,000 ៛ - 15,000 ៛', $dish['formatted_price_range_khr']);

        // Customer chooses the 15,000 Riel price
        $selectedOption = $dish['prices'][1];
        $orderRes = $this->postJson('/api/orders', [
            'table_id' => $table->id,
            'customer_name' => 'Dara',
            'items' => [
                [
                    'menu_item_id' => $dish['id'],
                    'menu_item_price_id' => $selectedOption['id'],
                    'quantity' => 1,
                ],
            ],
        ]);

        $orderRes->assertStatus(201);
        $order = $orderRes->json('order');
        $this->assertEquals(3.75, $order['total']);
        $this->assertEquals('Fried Rice (បាយឆា) (15,000 ៛)', $order['items'][0]['item_name']);
        $this->assertEquals('15,000 ៛', $order['items'][0]['variant_name']);
    }

    public function test_admin_can_add_chicken_normal_3_special_5_very_special_7_and_customer_chooses_special(): void
    {
        $admin = User::where('role', 'admin')->first();
        $cat = Category::first();
        $table = Table::where('status', 'active')->first();

        // 1. Admin creates dish "Chicken" with Normal $3, Special $5, Very Special $7
        $createRes = $this->actingAs($admin, 'sanctum')->postJson('/api/admin/menu-items', [
            'category_id' => $cat->id,
            'name' => 'Chicken',
            'type' => 'food',
            'is_available' => true,
            'prices' => [
                ['name' => 'Normal', 'price' => 3.00, 'is_default' => true],
                ['name' => 'Special', 'price' => 5.00, 'is_default' => false],
                ['name' => 'Very Special', 'price' => 7.00, 'is_default' => false],
            ],
        ]);

        $createRes->assertStatus(201);
        $dish = $createRes->json('item');
        $this->assertTrue($dish['has_multiple_prices']);
        $this->assertCount(3, $dish['prices']);
        $this->assertEquals('Normal', $dish['prices'][0]['name']);
        $this->assertEquals(3.00, $dish['prices'][0]['price']);
        $this->assertEquals('Special', $dish['prices'][1]['name']);
        $this->assertEquals(5.00, $dish['prices'][1]['price']);
        $this->assertEquals('Very Special', $dish['prices'][2]['name']);
        $this->assertEquals(7.00, $dish['prices'][2]['price']);
        $this->assertEquals('$3.00 - $7.00', $dish['formatted_price_range']);

        // 2. Customer chooses and orders "Special" ($5.00)
        $specialVariant = $dish['prices'][1];
        $orderRes = $this->postJson('/api/orders', [
            'table_id' => $table->id,
            'customer_name' => 'Customer A',
            'items' => [
                [
                    'menu_item_id' => $dish['id'],
                    'menu_item_price_id' => $specialVariant['id'],
                    'quantity' => 2,
                ],
            ],
        ]);

        $orderRes->assertStatus(201);
        $order = $orderRes->json('order');
        $this->assertEquals(10.00, $order['total']); // 2 * $5.00 = $10.00
        $this->assertEquals('Chicken (Special)', $order['items'][0]['item_name']);
        $this->assertEquals('Special', $order['items'][0]['variant_name']);
        $this->assertEquals($specialVariant['id'], $order['items'][0]['menu_item_price_id']);
    }
}


