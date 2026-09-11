<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'category_name' => $this->category?->name,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (float) $this->price,
            'price_khr' => (int) round((float) $this->price * 4000),
            'formatted_price' => '$' . number_format((float) $this->price, 2),
            'formatted_price_khr' => number_format(round((float) $this->price * 4000)) . ' ៛',
            'image' => $this->image ? (str_starts_with($this->image, 'http') ? $this->image : asset('storage/' . $this->image)) : null,
            'type' => $this->type,
            'is_available' => (bool) $this->is_available,
            'is_featured' => (bool) $this->is_featured,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
