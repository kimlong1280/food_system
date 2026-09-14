<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemPriceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'name' => $this->name,
            'price' => (float) $this->price,
            'price_khr' => (int) round((float) $this->price * 4000),
            'formatted_price' => '$' . number_format((float) $this->price, 2),
            'formatted_price_khr' => number_format(round((float) $this->price * 4000)) . ' ៛',
            'is_default' => (bool) $this->is_default,
            'sort_order' => (int) $this->sort_order,
        ];
    }
}
