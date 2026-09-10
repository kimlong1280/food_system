<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $foodCat = Category::where('name', 'Food')->first();
        $drinksCat = Category::where('name', 'Drinks')->first();
        $coffeeCat = Category::where('name', 'Coffee')->first();
        $dessertCat = Category::where('name', 'Dessert')->first();

        $items = [
            // Food
            [
                'category_id' => $foodCat->id,
                'name' => 'Chicken Burger',
                'description' => 'Crispy breaded chicken patty with fresh lettuce, tomato, and special burger sauce on a brioche bun.',
                'price' => 4.50,
                'image' => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
                'type' => 'food',
                'is_available' => true,
                'is_featured' => true,
            ],
            [
                'category_id' => $foodCat->id,
                'name' => 'Beef Burger',
                'description' => 'Juicy grilled beef patty topped with melted cheddar, caramelized onions, and house relish.',
                'price' => 5.50,
                'image' => 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
                'type' => 'food',
                'is_available' => true,
                'is_featured' => true,
            ],
            [
                'category_id' => $foodCat->id,
                'name' => 'Fried Rice',
                'description' => 'Wok-fried Jasmine rice with eggs, seasonal vegetables, garlic, scallions, and light soy seasoning.',
                'price' => 3.50,
                'image' => 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
                'type' => 'food',
                'is_available' => true,
                'is_featured' => false,
            ],
            [
                'category_id' => $foodCat->id,
                'name' => 'Pizza Margherita',
                'description' => 'Classic stone-baked thin crust pizza with San Marzano tomato sauce, fresh mozzarella, and fragrant basil.',
                'price' => 8.00,
                'image' => 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop&q=80',
                'type' => 'food',
                'is_available' => true,
                'is_featured' => true,
            ],
            [
                'category_id' => $foodCat->id,
                'name' => 'French Fries',
                'description' => 'Golden crispy shoestring fries seasoned with sea salt and served with tomato dip.',
                'price' => 2.50,
                'image' => 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
                'type' => 'food',
                'is_available' => true,
                'is_featured' => false,
            ],

            // Drinks
            [
                'category_id' => $drinksCat->id,
                'name' => 'Coca Cola',
                'description' => 'Refreshing ice-cold classic Coca Cola can (330ml).',
                'price' => 1.50,
                'image' => 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
                'type' => 'drink',
                'is_available' => true,
                'is_featured' => false,
            ],
            [
                'category_id' => $drinksCat->id,
                'name' => 'Fresh Orange Juice',
                'description' => 'Freshly squeezed sweet Valencia oranges served chilled with ice.',
                'price' => 2.50,
                'image' => 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
                'type' => 'drink',
                'is_available' => true,
                'is_featured' => false,
            ],

            // Coffee
            [
                'category_id' => $coffeeCat->id,
                'name' => 'Iced Americano',
                'description' => 'Double shot of rich espresso poured over crystal clear ice and cold water.',
                'price' => 2.20,
                'image' => 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
                'type' => 'drink',
                'is_available' => true,
                'is_featured' => true,
            ],

            // Dessert
            [
                'category_id' => $dessertCat->id,
                'name' => 'Chocolate Lava Cake',
                'description' => 'Warm molten chocolate cake with a gooey center, dusted with powdered sugar.',
                'price' => 3.50,
                'image' => 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
                'type' => 'dessert',
                'is_available' => true,
                'is_featured' => true,
            ],
        ];

        foreach ($items as $item) {
            MenuItem::updateOrCreate(['name' => $item['name']], $item);
        }
    }
}
