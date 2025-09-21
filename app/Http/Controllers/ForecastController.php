<?php

namespace App\Http\Controllers;

use App\Models\Forecast;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;

class ForecastController extends Controller
{
    public function index(Request $request)
    {
        $selectedCountry = $request->input('country', 'Nigeria'); // Default to Nigeria
        
        // Get all unique countries that have forecasts
        $countries = Forecast::select('country')->distinct()->pluck('country');

        // Get forecasts for the selected country - exclude unlocked content
        $forecasts = Forecast::where('country', $selectedCountry)
            ->select(['id', 'forecastId', 'title', 'country', 'freeSummary', 'created_at'])
            ->get();
        
        return Inertia::render('Dashboard', [
            'countries' => $countries,
            'selectedCountry' => $selectedCountry,
            'forecasts' => $forecasts,
        ]);
    }

    public function show(Forecast $forecast)
    {
        // Only send public data to frontend - never send unlocked content
        $publicForecast = $forecast->only(['id', 'forecastId', 'title', 'country', 'freeSummary', 'created_at']);
        
        return Inertia::render('Forecasts/Show', [
            'forecast' => $publicForecast,
            'userStakeLevel' => 0 // This would come from blockchain verification
        ]);
    }

    /**
     * API endpoint to get unlocked content after verifying user access
     */
    public function getUnlockedContent(Request $request, Forecast $forecast): JsonResponse
    {
        // TODO: Implement proper blockchain verification here
        // This should verify the user's stake on-chain before returning content
        
        $userStakeLevel = $this->verifyUserStakeLevel($request->user());
        
        if ($userStakeLevel < 50) {
            return response()->json(['error' => 'Insufficient stake level'], 403);
        }

        $unlockedContent = $forecast->unlockedContent;
        
        return response()->json([
            'success' => true,
            'unlockedContent' => $unlockedContent,
            'userStakeLevel' => $userStakeLevel
        ]);
    }

    /**
     * Verify user's stake level from blockchain
     * TODO: Implement actual blockchain verification
     */
    private function verifyUserStakeLevel($user): int
    {
        // This should call the smart contract to check user's actual stake
        // For now, returning 0 as placeholder
        return 0;
    }
}