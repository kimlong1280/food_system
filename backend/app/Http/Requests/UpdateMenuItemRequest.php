<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string|max:2000',
            'price' => 'sometimes|required|numeric|min:0.01|max:9999.99',
            'image' => 'nullable|string|max:2048',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:5120',
            'type' => 'sometimes|required|in:food,drink,dessert,other',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }
}
