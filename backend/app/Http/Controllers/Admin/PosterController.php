<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePosterRequest;
use App\Http\Requests\UpdatePosterRequest;
use App\Http\Resources\PosterResource;
use App\Models\Poster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;

class PosterController extends Controller
{
    /**
     * List all posters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $posters = Poster::orderBy('id', 'desc')->get();
        return PosterResource::collection($posters);
    }

    /**
     * Store new promotional poster banner.
     */
    public function store(StorePosterRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('posters', 'public');
            $data['image'] = $path;
        }

        if (empty($data['image'])) {
            return response()->json(['message' => 'Please provide an image file or image URL.'], 422);
        }

        unset($data['image_file']);

        $poster = Poster::create($data);

        return response()->json([
            'message' => 'Poster created successfully.',
            'poster' => new PosterResource($poster),
        ], 201);
    }

    /**
     * Show single poster.
     */
    public function show(Poster $poster): PosterResource
    {
        return new PosterResource($poster);
    }

    /**
     * Update poster banner.
     */
    public function update(UpdatePosterRequest $request, Poster $poster): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image_file')) {
            if ($poster->image && !str_starts_with($poster->image, 'http')) {
                Storage::disk('public')->delete($poster->image);
            }
            $path = $request->file('image_file')->store('posters', 'public');
            $data['image'] = $path;
        }

        unset($data['image_file']);

        $poster->update($data);

        return response()->json([
            'message' => 'Poster updated successfully.',
            'poster' => new PosterResource($poster),
        ]);
    }

    /**
     * Delete poster.
     */
    public function destroy(Poster $poster): JsonResponse
    {
        if ($poster->image && !str_starts_with($poster->image, 'http')) {
            Storage::disk('public')->delete($poster->image);
        }

        $poster->delete();

        return response()->json([
            'message' => 'Poster deleted successfully.',
        ]);
    }
}
