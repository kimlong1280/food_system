<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\PosterResource;
use App\Models\Poster;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PosterController extends Controller
{
    /**
     * Get active posters/banners for promotional carousel.
     */
    public function index(): AnonymousResourceCollection
    {
        $posters = Poster::active()
            ->orderBy('id', 'desc')
            ->get();

        return PosterResource::collection($posters);
    }
}
