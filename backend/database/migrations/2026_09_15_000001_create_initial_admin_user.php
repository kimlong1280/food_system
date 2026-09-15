<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensures admin accounts exist upon database creation without requiring seeders.
     */
    public function up(): void
    {
        // Owner admin account
        User::firstOrCreate(
            ['email' => 'kimlong128028@gmail.com'],
            [
                'name' => 'Kim Long (Owner)',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        // Default admin account
        User::firstOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        User::whereIn('email', ['kimlong128028@gmail.com', 'admin@admin.com'])->delete();
    }
};
