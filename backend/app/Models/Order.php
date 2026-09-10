<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'table_id',
        'customer_name',
        'status',
        'payment_requested_at',
        'subtotal',
        'total',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'total' => 'decimal:2',
            'payment_requested_at' => 'datetime',
        ];
    }

    /**
     * Get the table this order belongs to.
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }

    /**
     * Get the items in this order.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Generate a unique order number.
     */
    public static function generateOrderNumber(): string
    {
        $latest = static::latest('id')->first();
        $nextId = $latest ? $latest->id + 1 : 1;

        return 'ORD-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);
    }
}
