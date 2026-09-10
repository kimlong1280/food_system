<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ManageAdminUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:user 
                            {email : The Gmail or email address of the admin} 
                            {password? : The admin password (minimum 6 characters)} 
                            {--name= : The display name of the admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or update an administrator account with your Gmail/email';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));
        $password = $this->argument('password');
        $name = $this->option('name');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error("Invalid email address format: {$email}");
            return 1;
        }

        if (empty($password)) {
            $password = 'password';
        }

        if (strlen($password) < 6) {
            $this->error("Password must be at least 6 characters long.");
            return 1;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->password = Hash::make($password);
            $user->role = 'admin';
            if ($name) {
                $user->name = $name;
            }
            $user->save();

            $this->info("Successfully updated administrator account: {$email}");
        } else {
            $user = User::create([
                'name' => $name ?: 'Administrator',
                'email' => $email,
                'password' => Hash::make($password),
                'role' => 'admin',
            ]);

            $this->info("Successfully created new administrator account: {$email}");
        }

        $this->table(['Field', 'Value'], [
            ['Name', $user->name],
            ['Email', $user->email],
            ['Role', $user->role],
            ['Login URL', 'http://localhost:5173/admin/login'],
        ]);

        $this->line('');
        $this->info("You can now open http://localhost:5173/admin/login and sign in with your Gmail and password.");

        return 0;
    }
}
