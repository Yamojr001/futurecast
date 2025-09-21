<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Forecast;
use App\Http\Controllers\Auth\WalletAuthController;

// 1. ADD THIS LINE to import your new controller
use App\Http\Controllers\ForecastController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// 2. THIS IS THE LINE TO CHANGE.
// Instead of the simple function, we now point it to our controller's `index` method.
Route::get('/dashboard', [ForecastController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::get('/forecasts/{forecast}', function (Forecast $forecast) {
    return Inertia::render('Forecasts/Show', [
        'forecast' => $forecast,
        'userStakeLevel' => 0 // This would normally come from user's blockchain data
    ]);
})->middleware(['auth'])->name('forecasts.show');

Route::get('/premium', function () {
    return Inertia::render('Premium', [
        'userStakeLevel' => 0, // This would normally come from user's blockchain data
        'unlockedForecasts' => [] // This would come from user's unlocked forecast data
    ]);
})->middleware(['auth'])->name('premium');

Route::post('/wallet-login', [WalletAuthController::class, 'login'])->name('wallet.login');

require __DIR__.'/auth.php';