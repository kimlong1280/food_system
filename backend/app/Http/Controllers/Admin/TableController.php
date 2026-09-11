<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTableRequest;
use App\Http\Requests\UpdateTableRequest;
use App\Http\Resources\TableResource;
use App\Models\Table;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TableController extends Controller
{
    /**
     * List all tables with order count.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Table::withCount('orders');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(table_number) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(name) LIKE ?', [$search]);
            });
        }

        $tables = $query->orderBy('table_number', 'asc')->get();

        return TableResource::collection($tables);
    }

    /**
     * Create a table.
     */
    public function store(StoreTableRequest $request): JsonResponse
    {
        $table = Table::create($request->validated());

        return response()->json([
            'message' => 'Table created successfully.',
            'table' => new TableResource($table),
        ], 201);
    }

    /**
     * Show single table.
     */
    public function show(Table $table): TableResource
    {
        return new TableResource($table->loadCount('orders'));
    }

    /**
     * Update table.
     */
    public function update(UpdateTableRequest $request, Table $table): JsonResponse
    {
        $table->update($request->validated());

        return response()->json([
            'message' => 'Table updated successfully.',
            'table' => new TableResource($table),
        ]);
    }

    /**
     * Toggle table status between active and inactive.
     */
    public function toggleStatus(Table $table): JsonResponse
    {
        $newStatus = $table->status === 'active' ? 'inactive' : 'active';
        $table->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Table is now {$newStatus}.",
            'table' => new TableResource($table),
        ]);
    }

    /**
     * Toggle table occupancy between occupied (customer in) and available.
     */
    public function toggleOccupancy(Table $table): JsonResponse
    {
        $newOccupied = !$table->is_occupied;
        $table->update(['is_occupied' => $newOccupied]);

        $stateMsg = $newOccupied ? 'Customer Seated (Occupied)' : 'Available (Empty)';

        return response()->json([
            'message' => "Table {$table->table_number} marked as {$stateMsg}.",
            'table' => new TableResource($table),
        ]);
    }

    /**
     * Delete table.
     */
    public function destroy(Table $table): JsonResponse
    {
        // Don't allow deletion if table has orders
        if ($table->orders()->exists()) {
            return response()->json([
                'message' => 'Cannot delete a table with existing order history. Deactivate it instead.',
            ], 422);
        }

        $table->delete();

        return response()->json([
            'message' => 'Table deleted successfully.',
        ]);
    }
}
