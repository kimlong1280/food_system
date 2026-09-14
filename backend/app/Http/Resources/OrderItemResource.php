<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'menu_item_id' => $this->menu_item_id,
            'menu_item_price_id' => $this->menu_item_price_id,
            'item_name' => $this->item_name,
            'variant_name' => $this->variant_name,
            'price' => (float) $this->price,
            'quantity' => (int) $this->quantity,
            'subtotal' => (float) $this->subtotal,
            'note' => $this->note,
            'menu_item' => new MenuItemResource($this->whenLoaded('menuItem')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
