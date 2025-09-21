<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Forecast; // Make sure to import the Forecast model

class GenerateForecastCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'forecast:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generates multiple dummy forecasts for different countries to populate the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Generating multiple forecasts for different countries...');

        // We will create realistic dummy data to test the multi-country UI.
        // The real AI logic can be added back here later.
        $forecastsToGenerate = [
            [
                'country' => 'Nigeria', 
                'topic' => 'GDP Growth',
                'value' => '+2.5%',
            ],
            [
                'country' => 'Nigeria', 
                'topic' => 'Inflation Rate',
                'value' => '12%',
            ],
            [
                'country' => 'Ghana', 
                'topic' => 'GDP Growth',
                'value' => '+3.1%',
            ],
            [
                'country' => 'Ghana', 
                'topic' => 'Inflation Rate',
                'value' => '+5.1%',
            ],
            [
                'country' => 'Kenya',
                'topic' => 'Interest Rate',
                'value' => '8.5%',
            ]
        ];

        // First, let's clear out old forecasts to avoid duplicates
        Forecast::truncate();
        $this->warn('Cleared existing forecasts.');

        foreach ($forecastsToGenerate as $spec) {
            $this->info("Creating forecast for {$spec['country']} {$spec['topic']}...");
            
            Forecast::create([
                'forecastId' => random_int(10000, 99999),
                'title' => "{$spec['topic']} 2026",
                'country' => $spec['country'],
                'freeSummary' => $spec['value'],
                'unlockedContent' => json_encode([
                    'detail' => "This is the full, detailed AI report for {$spec['country']} {$spec['topic']}.",
                    'confidence' => 85,
                    'key_drivers' => ['Global oil prices', 'Local agricultural output']
                ]),
            ]);
        }

        $this->info('All new forecasts have been generated successfully.');
        return 0;
    }
}