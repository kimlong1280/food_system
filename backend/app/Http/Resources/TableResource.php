<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $qrUrl = "{$frontendUrl}/menu?table={$this->id}";

        return [
            'id' => $this->id,
            'table_number' => $this->table_number,
            'name' => $this->name,
            'status' => $this->status,
            'is_active' => $this->status === 'active',
            'is_occupied' => (bool) ($this->is_occupied ?? false),
            'qr_code' => $this->qr_code ? asset('storage/' . $this->qr_code) : null,
            'menu_url' => $qrUrl,
            'orders_count' => $this->whenCounted('orders'),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
