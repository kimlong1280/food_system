<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignId('menu_item_price_id')->nullable()->after('menu_item_id')->constrained('menu_item_prices')->nullOnDelete();
            $table->string('variant_name')->nullable()->after('item_name');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['menu_item_price_id']);
            $table->dropColumn(['menu_item_price_id', 'variant_name']);
        });
    }
};
