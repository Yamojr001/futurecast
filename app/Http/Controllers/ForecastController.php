<?php

namespace App\Http\Controllers;

use App\Models\Forecast;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ForecastController extends Controller
{
    public function index(Request $request)
    {
        $selectedCountry = $request->input('country', 'Nigeria'); // Default to Nigeria
        
        // Get all unique countries that have forecasts
        $countries = Forecast::select('country')->distinct()->pluck('country');

        // Get forecasts for the selected country
        $forecasts = Forecast::where('country', $selectedCountry)->get();
        
        return Inertia::render('Dashboard', [
            'countries' => $countries,
            'selectedCountry' => $selectedCountry,
            'forecasts' => $forecasts,
        ]);
    }
}