<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\TableResource;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TableController extends Controller
{
    /**
     * Get all active tables for customer selection.
     */
    public function index(): AnonymousResourceCollection
    {
        $tables = Table::active()
            ->orderBy('table_number', 'asc')
            ->get();

        return TableResource::collection($tables);
    }

    /**
     * Verify table exists and is active for customer QR scan.
     * Supports matching by ID or table_number (e.g., '1', '01', '5', '05').
     */
    public function show(string $id): JsonResponse|TableResource
    {
        // Match by ID or by table_number
        $table = Table::where('id', $id)
            ->orWhere('table_number', $id)
            ->orWhere('table_number', str_pad($id, 2, '0', STR_PAD_LEFT))
            ->orWhereRaw('LOWER(name) = ?', [strtolower($id)])
            ->first();

        if (!$table) {
            return response()->json([
                'message' => 'Table not found. Please verify you scanned a valid restaurant QR code or select your table.',
                'valid' => false,
            ], 404);
        }

        if (!$table->isActive()) {
            return response()->json([
                'message' => "Table {$table->table_number} is currently closed or inactive. Please contact our restaurant staff.",
                'valid' => false,
                'table_number' => $table->table_number,
            ], 422);
        }

        return new TableResource($table);
    }
}
