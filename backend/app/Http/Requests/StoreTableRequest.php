<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'table_number' => 'required|string|max:50|unique:tables,table_number',
            'name' => 'nullable|string|max:100',
            'status' => 'required|in:active,inactive',
        ];
    }
}
