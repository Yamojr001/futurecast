<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class WalletAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'address' => 'required|string|regex:/^0x[a-fA-F0-9]{40}$/',
        ]);

        $address = $request->input('address');

        // Find or create the user
        $user = User::firstOrCreate(
            ['wallet_address' => $address],
            [
                'name' => 'User ' . substr($address, 2, 4), // e.g., "User 9e73"
                'email' => $address . '@futurecast.app', // Create a dummy email
                'password' => Hash::make(Str::random(24)),
            ]
        );

        // Log the user in
        Auth::login($user);

        return response()->json(['status' => 'success', 'message' => 'User logged in successfully']);
    }
}