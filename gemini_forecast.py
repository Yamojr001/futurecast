#!/usr/bin/env python3
import json
import logging
import os
import sys
from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List

# IMPORTANT: KEEP THIS COMMENT
# Follow these instructions when using this blueprint:
# - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
#   - do not change this unless explicitly requested by the user
# This API key is from Gemini Developer API Key, not vertex AI API Key
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


class ForecastData(BaseModel):
    title: str
    country: str
    value: str
    confidence: int
    detail: str
    key_drivers: List[str]


class EconomicForecast:
    def __init__(self):
        self.client = client

    def generate_forecast(self, country: str, topic: str, year: str = "2026") -> ForecastData:
        """
        Generate an economic forecast using Gemini AI
        """
        prompt = f"""
        As an expert economic analyst, provide a detailed economic forecast for {country} regarding {topic} for the year {year}.

        Please provide:
        1. A specific numerical prediction or percentage with proper economic context
        2. A confidence level (0-100) based on available data and economic stability
        3. A detailed analysis explaining the forecast methodology and reasoning
        4. Key economic drivers that influence this forecast

        Focus on realistic, data-driven predictions based on current economic trends, historical data, and geopolitical factors.
        Consider factors like inflation rates, GDP growth, government policies, international trade, and global economic conditions.

        Respond in JSON format with the following structure:
        {{
            "title": "{topic} {year}",
            "country": "{country}",
            "value": "your numerical prediction with context",
            "confidence": confidence_score_0_to_100,
            "detail": "detailed analysis and methodology explanation",
            "key_drivers": ["driver1", "driver2", "driver3"]
        }}
        """

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-pro",
                contents=[
                    types.Content(role="user", parts=[types.Part(text=prompt)])
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ForecastData,
                    temperature=0.3  # Lower temperature for more consistent predictions
                ),
            )

            if response.text:
                data = json.loads(response.text)
                return ForecastData(**data)
            else:
                raise ValueError("Empty response from Gemini model")

        except Exception as e:
            # Fallback to basic forecast if AI fails
            logging.error(f"Gemini API failed: {e}")
            return ForecastData(
                title=f"{topic} {year}",
                country=country,
                value="Data unavailable - AI service error",
                confidence=50,
                detail=f"Unable to generate AI forecast for {country} {topic}. Please try again later.",
                key_drivers=["AI service unavailable", "Manual intervention needed"]
            )


def main():
    if len(sys.argv) < 3:
        print("Usage: python gemini_forecast.py <country> <topic> [year]")
        sys.exit(1)

    country = sys.argv[1]
    topic = sys.argv[2]
    year = sys.argv[3] if len(sys.argv) > 3 else "2026"

    forecaster = EconomicForecast()
    forecast = forecaster.generate_forecast(country, topic, year)
    
    # Output JSON for PHP to consume
    print(json.dumps(forecast.model_dump(), indent=2))


if __name__ == "__main__":
    main()