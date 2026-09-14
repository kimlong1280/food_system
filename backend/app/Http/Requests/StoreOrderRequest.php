<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'table_id' => 'required|exists:tables,id',
            'customer_name' => 'nullable|string|max:100',
            'note' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.menu_item_id' => 'required|exists:menu_items,id',
            'items.*.menu_item_price_id' => 'nullable|exists:menu_item_prices,id',
            'items.*.variant_name' => 'nullable|string|max:100',
            'items.*.quantity' => 'required|integer|min:1|max:100',
            'items.*.note' => 'nullable|string|max:255',
        ];
    }
}
