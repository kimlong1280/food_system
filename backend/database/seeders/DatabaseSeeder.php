<?php

namespace Database\Seeders;

use App\Models\Poster;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            CategorySeeder::class,
            MenuItemSeeder::class,
            TableSeeder::class,
        ]);

        // Seed sample promotional poster
        Poster::updateOrCreate(
            ['title' => 'Special Combo Offer!'],
            [
                'title' => 'Special Combo Offer!',
                'description' => 'Get a signature Chicken Burger + Classic Coke + Fries for only $6.99 today!',
                'image' => 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80',
                'status' => true,
                'start_date' => now()->subDays(5)->toDateString(),
                'end_date' => now()->addDays(30)->toDateString(),
            ]
        );
    }
}
