# Laravel + React Forecasting Application

## Overview
This is a Laravel application with React frontend using Inertia.js for seamless server-side and client-side integration. The application appears to be a forecasting platform with blockchain integration (using ethers.js) and user authentication.

## Architecture
- **Backend**: Laravel 12.30.1 with PHP 8.2
- **Frontend**: React 18.2 with Vite 7.1.6 and Tailwind CSS
- **Database**: SQLite (development)
- **Authentication**: Laravel Breeze with custom wallet authentication
- **Blockchain**: Ethereum integration via ethers.js

## Development Setup
- **Backend Server**: Runs on localhost:8000
- **Frontend Dev Server**: Runs on 0.0.0.0:5000 (proxied for Replit)
- **Queue Worker**: Processes background jobs
- **Build Tool**: Vite with Laravel plugin and React support

## Key Features
- User registration and authentication
- Wallet-based authentication (Web3)
- Forecast management system
- Dashboard with forecasts
- Country-specific forecasting
- Queue-based job processing

## Production Deployment
- **Build Command**: `npm run build` (compiles assets)
- **Run Command**: Laravel Artisan serve on port 5000
- **Deployment Type**: Autoscale (stateless web app)

## Project Structure
- `/app` - Laravel application logic
- `/resources/js` - React components and frontend code
- `/resources/css` - Styles and Tailwind configuration
- `/routes` - Laravel routing definitions
- `/database` - Migrations and model factories

## Recent Changes (September 21, 2025)
- Configured Vite for Replit environment (host: 0.0.0.0:5000)
- Set up development workflow with concurrent Laravel/Queue/Vite processes
- Configured deployment settings for production
- Established SQLite database with migrations