<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMenuItemRequest;
use App\Http\Requests\UpdateMenuItemRequest;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class MenuItemController extends Controller
{
    /**
     * List all menu items for admin with filters and search.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = MenuItem::with('category');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('is_available')) {
            $query->where('is_available', $request->boolean('is_available'));
        }

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', [$search])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$search]);
            });
        }

        $items = $query->orderBy('category_id', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return MenuItemResource::collection($items);
    }

    /**
     * Store new menu item.
     */
    public function store(StoreMenuItemRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Convert Khmer Riel to USD (Exchange Rate: $1 = 4,000 KHR)
        if (isset($data['currency']) && strtoupper($data['currency']) === 'KHR') {
            $data['price'] = round((float) $data['price'] / 4000, 2);
        } elseif ((float) $data['price'] > 500) {
            // Auto-detect if price was entered directly in Riel without currency tag
            $data['price'] = round((float) $data['price'] / 4000, 2);
        }
        unset($data['currency']);

        if ($data['price'] < 0.01) {
            $data['price'] = 0.01;
        }

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('menu_items', 'public');
            $data['image'] = $path;
        }

        unset($data['image_file']);

        $item = MenuItem::create($data);

        return response()->json([
            'message' => 'Menu item created successfully.',
            'item' => new MenuItemResource($item->load('category')),
        ], 201);
    }

    /**
     * Show single item.
     */
    public function show(MenuItem $menuItem): MenuItemResource
    {
        return new MenuItemResource($menuItem->load('category'));
    }

    /**
     * Update menu item.
     */
    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $data = $request->validated();

        // Convert Khmer Riel to USD (Exchange Rate: $1 = 4,000 KHR)
        if (isset($data['currency']) && strtoupper($data['currency']) === 'KHR') {
            $data['price'] = round((float) $data['price'] / 4000, 2);
        } elseif (isset($data['price']) && (float) $data['price'] > 500) {
            // Auto-detect if price was entered directly in Riel without currency tag
            $data['price'] = round((float) $data['price'] / 4000, 2);
        }
        unset($data['currency']);

        if (isset($data['price']) && $data['price'] < 0.01) {
            $data['price'] = 0.01;
        }

        if ($request->hasFile('image_file')) {
            if ($menuItem->image && !str_starts_with($menuItem->image, 'http')) {
                Storage::disk('public')->delete($menuItem->image);
            }
            $path = $request->file('image_file')->store('menu_items', 'public');
            $data['image'] = $path;
        }

        unset($data['image_file']);

        $menuItem->update($data);

        return response()->json([
            'message' => 'Menu item updated successfully.',
            'item' => new MenuItemResource($menuItem->load('category')),
        ]);
    }

    /**
     * Quick toggle availability status.
     */
    public function toggleAvailability(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update([
            'is_available' => !$menuItem->is_available,
        ]);

        return response()->json([
            'message' => 'Availability toggled successfully.',
            'is_available' => (bool) $menuItem->is_available,
            'item' => new MenuItemResource($menuItem->load('category')),
        ]);
    }

    /**
     * Quick toggle featured status.
     */
    public function toggleFeatured(MenuItem $menuItem): JsonResponse
    {
        $menuItem->update([
            'is_featured' => !$menuItem->is_featured,
        ]);

        return response()->json([
            'message' => 'Featured status toggled successfully.',
            'is_featured' => (bool) $menuItem->is_featured,
            'item' => new MenuItemResource($menuItem->load('category')),
        ]);
    }

    /**
     * Delete menu item.
     */
    public function destroy(MenuItem $menuItem): JsonResponse
    {
        if ($menuItem->image && !str_starts_with($menuItem->image, 'http')) {
            Storage::disk('public')->delete($menuItem->image);
        }

        $menuItem->delete();

        return response()->json([
            'message' => 'Menu item deleted successfully.',
        ]);
    }
}
