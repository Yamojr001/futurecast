<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Forecast;
use Illuminate\Support\Facades\Process;

class GenerateForecastCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'forecast:generate {--ai : Use AI to generate forecasts}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generates economic forecasts using AI-powered predictions via Gemini API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $useAI = $this->option('ai');
        
        if ($useAI) {
            $this->info('Generating AI-powered forecasts using Gemini API...');
            $this->generateAIForecasts();
        } else {
            $this->info('Generating standard forecasts with sample data...');
            $this->generateSampleForecasts();
        }

        $this->info('All forecasts have been generated successfully.');
        return 0;
    }

    /**
     * Generate forecasts using AI
     */
    protected function generateAIForecasts()
    {
        $forecastSpecs = [
            ['country' => 'Nigeria', 'topic' => 'GDP Growth'],
            ['country' => 'Nigeria', 'topic' => 'Inflation Rate'],
            ['country' => 'Ghana', 'topic' => 'GDP Growth'],
            ['country' => 'Ghana', 'topic' => 'Inflation Rate'],
            ['country' => 'Kenya', 'topic' => 'Interest Rate'],
            ['country' => 'South Africa', 'topic' => 'Unemployment Rate'],
            ['country' => 'Egypt', 'topic' => 'Currency Devaluation'],
            ['country' => 'Morocco', 'topic' => 'Export Revenue'],
        ];

        // Clear existing forecasts
        Forecast::truncate();
        $this->warn('Cleared existing forecasts.');

        foreach ($forecastSpecs as $spec) {
            $this->info("Generating AI forecast for {$spec['country']} {$spec['topic']}...");
            
            try {
                // Call Python script to generate AI forecast
                $result = Process::run([
                    'python3', 
                    base_path('gemini_forecast.py'),
                    $spec['country'],
                    $spec['topic'],
                    '2026'
                ]);

                if ($result->successful()) {
                    $forecastData = json_decode($result->output(), true);
                    
                    if ($forecastData) {
                        Forecast::create([
                            'forecastId' => random_int(10000, 99999),
                            'title' => $forecastData['title'],
                            'country' => $forecastData['country'],
                            'freeSummary' => $forecastData['value'],
                            'unlockedContent' => json_encode([
                                'detail' => $forecastData['detail'],
                                'confidence' => $forecastData['confidence'],
                                'key_drivers' => $forecastData['key_drivers']
                            ]),
                        ]);
                        
                        $this->info("✅ Created AI forecast: {$forecastData['value']} (Confidence: {$forecastData['confidence']}%)");
                    } else {
                        $this->error("Failed to parse AI response for {$spec['country']} {$spec['topic']}");
                        $this->createFallbackForecast($spec);
                    }
                } else {
                    $this->error("AI generation failed for {$spec['country']} {$spec['topic']}: " . $result->errorOutput());
                    $this->createFallbackForecast($spec);
                }
            } catch (\Exception $e) {
                $this->error("Exception during AI generation: " . $e->getMessage());
                $this->createFallbackForecast($spec);
            }

            // Add small delay to avoid API rate limits
            sleep(1);
        }
    }

    /**
     * Generate sample forecasts without AI
     */
    protected function generateSampleForecasts()
    {
        $sampleForecasts = [
            [
                'country' => 'Nigeria', 
                'topic' => 'GDP Growth',
                'value' => '+2.5%',
                'detail' => 'Nigeria\'s GDP is expected to grow at 2.5% driven by oil sector recovery and improved agricultural output.',
                'confidence' => 75,
                'key_drivers' => ['Oil price recovery', 'Agricultural productivity', 'Infrastructure development']
            ],
            [
                'country' => 'Nigeria', 
                'topic' => 'Inflation Rate',
                'value' => '12.8%',
                'detail' => 'Inflation projected to remain elevated due to currency pressures and supply chain challenges.',
                'confidence' => 70,
                'key_drivers' => ['Currency depreciation', 'Food supply issues', 'Energy costs']
            ],
            [
                'country' => 'Ghana', 
                'topic' => 'GDP Growth',
                'value' => '+3.1%',
                'detail' => 'Ghana shows resilient growth prospects with strong cocoa exports and mining sector performance.',
                'confidence' => 80,
                'key_drivers' => ['Cocoa exports', 'Gold mining', 'Services sector growth']
            ],
            [
                'country' => 'Kenya', 
                'topic' => 'Interest Rate',
                'value' => '8.5%',
                'detail' => 'Central bank likely to maintain accommodative stance to support economic recovery.',
                'confidence' => 85,
                'key_drivers' => ['Inflation control', 'Economic recovery', 'Regional stability']
            ]
        ];

        // Clear existing forecasts
        Forecast::truncate();
        $this->warn('Cleared existing forecasts.');

        foreach ($sampleForecasts as $forecast) {
            $this->info("Creating forecast for {$forecast['country']} {$forecast['topic']}...");
            
            Forecast::create([
                'forecastId' => random_int(10000, 99999),
                'title' => "{$forecast['topic']} 2026",
                'country' => $forecast['country'],
                'freeSummary' => $forecast['value'],
                'unlockedContent' => json_encode([
                    'detail' => $forecast['detail'],
                    'confidence' => $forecast['confidence'],
                    'key_drivers' => $forecast['key_drivers']
                ]),
            ]);
        }
    }

    /**
     * Create fallback forecast if AI fails
     */
    protected function createFallbackForecast($spec)
    {
        $this->warn("Creating fallback forecast for {$spec['country']} {$spec['topic']}");
        
        Forecast::create([
            'forecastId' => random_int(10000, 99999),
            'title' => "{$spec['topic']} 2026",
            'country' => $spec['country'],
            'freeSummary' => 'Data processing in progress',
            'unlockedContent' => json_encode([
                'detail' => "Economic forecast for {$spec['country']} {$spec['topic']} is being processed. AI analysis will be available soon.",
                'confidence' => 60,
                'key_drivers' => ['Economic indicators analysis', 'Regional market conditions', 'Government policy impacts']
            ]),
        ]);
    }
}