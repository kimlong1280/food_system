<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MenuController extends Controller
{
    /**
     * Get all active categories with item count.
     */
    public function categories(): AnonymousResourceCollection
    {
        $categories = Category::active()
            ->orderBy('sort_order', 'asc')
            ->orderBy('name', 'asc')
            ->withCount(['menuItems' => function ($q) {
                $q->where('is_available', true);
            }])
            ->get();

        return CategoryResource::collection($categories);
    }

    /**
     * Get menu items with search and category filtering.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = MenuItem::with('category');

        // Optional filter: only available items for customers (default: true)
        if ($request->boolean('available_only', true)) {
            $query->available();
        }

        // Filter by category
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by type (food, drink, dessert, etc.)
        if ($request->filled('type') && in_array($request->type, ['food', 'drink', 'dessert', 'other'])) {
            $query->where('type', $request->type);
        }

        // Filter by featured
        if ($request->boolean('featured')) {
            $query->featured();
        }

        // Search query
        if ($request->filled('search')) {
            $search = '%' . strtolower($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$search]);
            });
        }

        $items = $query->orderBy('is_featured', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return MenuItemResource::collection($items);
    }

    /**
     * Get single menu item details.
     */
    public function show(int $id): JsonResponse|MenuItemResource
    {
        $item = MenuItem::with('category')->find($id);

        if (!$item) {
            return response()->json(['message' => 'Menu item not found.'], 404);
        }

        return new MenuItemResource($item);
    }
}
