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
        $query = MenuItem::with(['category', 'prices']);

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
        $pricesInput = $data['prices'] ?? null;
        unset($data['prices']);

        // Process multiple prices if provided
        $processedPrices = [];
        if (is_array($pricesInput) && count($pricesInput) > 0) {
            foreach ($pricesInput as $idx => $p) {
                $rawPrice = (float) ($p['price'] ?? 0);
                if (isset($p['currency']) && strtoupper($p['currency']) === 'KHR') {
                    $rawPrice = round($rawPrice / 4000, 2);
                } elseif ($rawPrice > 500) {
                    $rawPrice = round($rawPrice / 4000, 2);
                }
                if ($rawPrice < 0.01) {
                    $rawPrice = 0.01;
                }

                $name = trim($p['name'] ?? '');
                if ($name === '') {
                    $khrFormatted = number_format(round($rawPrice * 4000));
                    $name = "{$khrFormatted} ៛";
                }

                $processedPrices[] = [
                    'name' => $name,
                    'price' => $rawPrice,
                    'is_default' => !empty($p['is_default']),
                    'sort_order' => isset($p['sort_order']) ? (int) $p['sort_order'] : $idx,
                ];
            }

            // Ensure at least one default
            $hasDefault = collect($processedPrices)->contains('is_default', true);
            if (!$hasDefault && count($processedPrices) > 0) {
                $processedPrices[0]['is_default'] = true;
            }

            // Sync base item price to default or lowest price
            $defaultOption = collect($processedPrices)->firstWhere('is_default', true);
            $data['price'] = $defaultOption ? $defaultOption['price'] : collect($processedPrices)->min('price');
        } else {
            // Single price handling
            if (isset($data['currency']) && strtoupper($data['currency']) === 'KHR') {
                $data['price'] = round((float) $data['price'] / 4000, 2);
            } elseif (isset($data['price']) && (float) $data['price'] > 500) {
                $data['price'] = round((float) $data['price'] / 4000, 2);
            }
            if (isset($data['price']) && $data['price'] < 0.01) {
                $data['price'] = 0.01;
            }
        }
        unset($data['currency']);

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('menu_items', 'public');
            $data['image'] = $path;
        }
        unset($data['image_file']);

        $item = MenuItem::create($data);

        // Insert prices if multiple prices mode
        if (!empty($processedPrices)) {
            foreach ($processedPrices as $priceData) {
                $item->prices()->create($priceData);
            }
        }

        return response()->json([
            'message' => 'Menu item created successfully.',
            'item' => new MenuItemResource($item->load(['category', 'prices'])),
        ], 201);
    }

    /**
     * Show single item.
     */
    public function show(MenuItem $menuItem): MenuItemResource
    {
        return new MenuItemResource($menuItem->load(['category', 'prices']));
    }

    /**
     * Update menu item.
     */
    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): JsonResponse
    {
        $data = $request->validated();
        $hasPricesKey = array_key_exists('prices', $data);
        $pricesInput = $data['prices'] ?? null;
        unset($data['prices']);

        $processedPrices = [];
        if ($hasPricesKey && is_array($pricesInput) && count($pricesInput) > 0) {
            foreach ($pricesInput as $idx => $p) {
                $rawPrice = (float) ($p['price'] ?? 0);
                if (isset($p['currency']) && strtoupper($p['currency']) === 'KHR') {
                    $rawPrice = round($rawPrice / 4000, 2);
                } elseif ($rawPrice > 500) {
                    $rawPrice = round($rawPrice / 4000, 2);
                }
                if ($rawPrice < 0.01) {
                    $rawPrice = 0.01;
                }

                $name = trim($p['name'] ?? '');
                if ($name === '') {
                    $khrFormatted = number_format(round($rawPrice * 4000));
                    $name = "{$khrFormatted} ៛";
                }

                $processedPrices[] = [
                    'name' => $name,
                    'price' => $rawPrice,
                    'is_default' => !empty($p['is_default']),
                    'sort_order' => isset($p['sort_order']) ? (int) $p['sort_order'] : $idx,
                ];
            }

            $hasDefault = collect($processedPrices)->contains('is_default', true);
            if (!$hasDefault && count($processedPrices) > 0) {
                $processedPrices[0]['is_default'] = true;
            }

            $defaultOption = collect($processedPrices)->firstWhere('is_default', true);
            $data['price'] = $defaultOption ? $defaultOption['price'] : collect($processedPrices)->min('price');
        } elseif (isset($data['price'])) {
            // Single price update
            if (isset($data['currency']) && strtoupper($data['currency']) === 'KHR') {
                $data['price'] = round((float) $data['price'] / 4000, 2);
            } elseif ((float) $data['price'] > 500) {
                $data['price'] = round((float) $data['price'] / 4000, 2);
            }
            if ($data['price'] < 0.01) {
                $data['price'] = 0.01;
            }
        }
        unset($data['currency']);

        if ($request->hasFile('image_file')) {
            if ($menuItem->image && !str_starts_with($menuItem->image, 'http')) {
                Storage::disk('public')->delete($menuItem->image);
            }
            $path = $request->file('image_file')->store('menu_items', 'public');
            $data['image'] = $path;
        }
        unset($data['image_file']);

        $menuItem->update($data);

        // If prices was explicitly provided, sync prices
        if ($hasPricesKey) {
            $menuItem->prices()->delete();
            if (!empty($processedPrices)) {
                foreach ($processedPrices as $priceData) {
                    $menuItem->prices()->create($priceData);
                }
            }
        }

        return response()->json([
            'message' => 'Menu item updated successfully.',
            'item' => new MenuItemResource($menuItem->load(['category', 'prices'])),
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
