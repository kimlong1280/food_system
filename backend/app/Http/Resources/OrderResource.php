<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'table_id' => $this->table_id,
            'table' => new TableResource($this->whenLoaded('table')),
            'table_number' => $this->table?->table_number,
            'customer_name' => $this->customer_name,
            'status' => $this->status,
            'payment_requested_at' => $this->payment_requested_at?->timezone(config('app.timezone', 'Asia/Phnom_Penh'))->toIso8601String(),
            'is_payment_requested' => !is_null($this->payment_requested_at),
            'formatted_payment_requested_time' => $this->payment_requested_at?->timezone(config('app.timezone', 'Asia/Phnom_Penh'))->format('h:i A'),
            'subtotal' => (float) $this->subtotal,
            'total' => (float) $this->total,
            'formatted_total' => '$' . number_format((float) $this->total, 2),
            'note' => $this->note,
            'items' => OrderItemResource::collection($this->whenLoaded('orderItems')),
            'items_count' => $this->orderItems_count ?? $this->orderItems?->count() ?? 0,
            'created_at' => $this->created_at?->timezone(config('app.timezone', 'Asia/Phnom_Penh'))->toIso8601String(),
            'formatted_time' => $this->created_at?->timezone(config('app.timezone', 'Asia/Phnom_Penh'))->format('h:i A'),
            'formatted_date' => $this->created_at?->timezone(config('app.timezone', 'Asia/Phnom_Penh'))->format('d/m/Y'),
            'updated_at' => $this->updated_at?->timezone(config('app.timezone', 'Asia/Phnom_Penh'))->toIso8601String(),
        ];
    }
}
