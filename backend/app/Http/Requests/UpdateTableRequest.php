<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tableId = $this->route('table')?->id ?? $this->route('table') ?? $this->id;

        return [
            'table_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('tables', 'table_number')->ignore($tableId),
            ],
            'name' => 'nullable|string|max:100',
            'status' => 'sometimes|required|in:active,inactive',
            'is_occupied' => 'nullable|boolean',
        ];
    }
}
