<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Food',
                'description' => 'Delicious handcrafted dishes prepared fresh to order.',
                'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
                'status' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Drinks',
                'description' => 'Chilled beverages, freshly squeezed juices, and soft drinks.',
                'image' => 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
                'status' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Coffee',
                'description' => 'Artisanal roasted coffee and specialty espresso beverages.',
                'image' => 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80',
                'status' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Dessert',
                'description' => 'Sweet delicacies, pastries, and decadent cakes.',
                'image' => 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
                'status' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
