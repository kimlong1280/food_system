<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    /**
     * List all categories with item count and pagination/search.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Category::withCount('menuItems');

        if ($request->filled('search')) {
            $search = '%' . strtolower($request->search) . '%';
            $query->whereRaw('LOWER(name) LIKE ?', [$search]);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->boolean('status'));
        }

        $categories = $query->orderBy('sort_order', 'asc')
            ->orderBy('id', 'desc')
            ->get();

        return CategoryResource::collection($categories);
    }

    /**
     * Store a new category.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('categories', 'public');
            $data['image'] = $path;
        }

        unset($data['image_file']);

        $category = Category::create($data);

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => new CategoryResource($category),
        ], 201);
    }

    /**
     * Show single category.
     */
    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->loadCount('menuItems'));
    }

    /**
     * Update category.
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image_file')) {
            if ($category->image && !str_starts_with($category->image, 'http')) {
                Storage::disk('public')->delete($category->image);
            }
            $path = $request->file('image_file')->store('categories', 'public');
            $data['image'] = $path;
        }

        unset($data['image_file']);

        $category->update($data);

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => new CategoryResource($category),
        ]);
    }

    /**
     * Delete category.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->image && !str_starts_with($category->image, 'http')) {
            Storage::disk('public')->delete($category->image);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}
