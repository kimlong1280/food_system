<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('prices') && is_string($this->prices)) {
            $decoded = json_decode($this->prices, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $this->merge(['prices' => $decoded]);
            }
        }

        if ($this->has('prices') && is_array($this->prices)) {
            $prices = $this->prices;
            foreach ($prices as $i => $p) {
                $name = trim($p['name'] ?? '');
                if ($name === '') {
                    $rawPrice = (float) ($p['price'] ?? 0);
                    if (isset($p['currency']) && strtoupper($p['currency']) === 'KHR') {
                        $rawPrice = round($rawPrice / 4000, 2);
                    } elseif ($rawPrice > 500) {
                        $rawPrice = round($rawPrice / 4000, 2);
                    }
                    $khr = number_format(round($rawPrice * 4000));
                    $prices[$i]['name'] = "{$khr} ៛";
                }
            }
            $this->merge(['prices' => $prices]);
        }
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string|max:2000',
            'price' => 'nullable|required_without:prices|numeric|min:0.01|max:99999999',
            'currency' => 'nullable|in:USD,KHR',
            'prices' => 'nullable|array',
            'prices.*.id' => 'nullable|integer',
            'prices.*.name' => 'nullable|string|max:100',
            'prices.*.price' => 'required_with:prices|numeric|min:0.01|max:99999999',
            'prices.*.currency' => 'nullable|in:USD,KHR',
            'prices.*.is_default' => 'nullable|boolean',
            'prices.*.sort_order' => 'nullable|integer',
            'image' => 'nullable|string|max:2048',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,avif|max:5120',
            'type' => 'required|in:food,drink,dessert,other',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
        ];
    }
}
