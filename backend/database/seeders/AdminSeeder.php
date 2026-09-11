<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Default admin
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Restaurant Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // Shortcut admin
        User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // Owner admin account
        User::updateOrCreate(
            ['email' => 'kimlong128028@gmail.com'],
            [
                'name' => 'Kim Long (Owner)',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );
    }
}
