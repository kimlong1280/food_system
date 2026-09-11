<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string|max:2000',
            'price' => 'required|numeric|min:0.01|max:99999999',
            'currency' => 'nullable|in:USD,KHR',
            'image' => 'nullable|string|max:2048',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:5120',
            'type' => 'required|in:food,drink,dessert,other',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }
}
