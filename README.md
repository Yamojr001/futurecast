# FutureCast - Economic Forecasting Platform Setup Guide

## Overview
FutureCast is a modern economic forecasting platform that combines AI-powered predictions with blockchain staking mechanisms. Users can stake DAG tokens to unlock premium forecasts and detailed economic analysis.

## Technology Stack
- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 18 + Inertia.js + Vite
- **Database**: SQLite (development) / PostgreSQL (production)
- **AI**: Google Gemini API for forecast generation
- **Blockchain**: Ethereum-compatible smart contracts (BlockDAG)
- **Styling**: Tailwind CSS

## Prerequisites
- PHP 8.2 or higher
- Node.js 18+ and npm
- Python 3.11+ (for AI forecasting)
- Composer
- Git

## Quick Setup (GitHub Clone)

### 1. Clone and Install Dependencies
```bash
# Clone the repository
git clone https://github.com/your-repo/futurecast.git
cd futurecast

# Install PHP dependencies
composer install

# Install Node.js dependencies
npm install

# Install Python dependencies (for AI features)
pip install google-genai pydantic
# OR with uv (recommended in Replit)
uv add google-genai pydantic
```

### 2. Environment Configuration
```bash
# Copy environment file
cp .env.example .env

# Generate Laravel application key
php artisan key:generate

# Create SQLite database (development)
touch database/database.sqlite

# Run migrations
php artisan migrate
```

### 3. Required Environment Variables
Add these to your `.env` file:

```env
# Application
APP_NAME="FutureCast"
APP_URL=http://localhost:8000

# Database (SQLite for development)
DB_CONNECTION=sqlite

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Vite Development Server
VITE_APP_NAME="${APP_NAME}"
VITE_DAG_TOKEN_ADDRESS=your_dag_token_contract_address
VITE_FUTURECAST_ADDRESS=your_futurecast_contract_address
```

### 4. Generate Sample Data
```bash
# Generate sample forecasts
php artisan forecast:generate

# Generate AI-powered forecasts (requires GEMINI_API_KEY)
php artisan forecast:generate --ai
```

### 5. Run the Development Server
```bash
# Option 1: Using Laravel's built-in command (recommended)
composer run dev

# Option 2: Manual startup
npx concurrently -c "#93c5fd,#c4b5fd,#fb7185,#fdba74" \
  "php artisan serve --host=localhost --port=8000" \
  "php artisan queue:listen --tries=1" \
  "npm run dev" \
  --names=laravel,queue,vite --kill-others
```

The application will be available at:
- Frontend: `http://localhost:5000` (Vite dev server)
- Backend API: `http://localhost:8000` (Laravel server)

## Getting API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API key" in the left sidebar
4. Create a new API key
5. Copy the key to your `.env` file as `GEMINI_API_KEY`

### DAG Token Setup
1. Deploy the DAG token contract or get the address from BlockDAG team
2. Deploy the FutureCast smart contract (see `FutureCast.sol`)
3. Update `.env` with contract addresses:
   ```env
   VITE_DAG_TOKEN_ADDRESS=0x...
   VITE_FUTURECAST_ADDRESS=0x...
   ```

## Smart Contract Deployment

### 1. Prepare the Contract
The smart contract is located at `FutureCast.sol` and includes:
- Economic forecast storage and management
- Tiered staking system (50 DAG = Basic, 100 DAG = Premium)
- User access control and unlocking mechanism
- Native currency support for BDAG
- Emergency functions and owner controls

### 2. Deploy to BlockDAG
```solidity
// Constructor parameters:
// _dagToken: Address of the DAG ERC20 token contract
// initialOwner: Address that will own the contract

// Example deployment:
constructor(
    0x1234...DAG_TOKEN_ADDRESS,
    0x5678...YOUR_WALLET_ADDRESS
)
```

### 3. Contract Features
- **createForecast()**: Create new economic forecasts (owner only)
- **stakeAndUnlock()**: Stake DAG tokens to unlock forecasts
- **stakeAndUnlockNative()**: Stake native BDAG to unlock forecasts
- **withdrawStake()**: Withdraw staked tokens (7-day cooldown)
- **hasUnlockedForecast()**: Check if user unlocked a forecast

## Application Features

### Frontend Features
1. **Dashboard**: Multi-country forecast overview with filtering
2. **Forecast Details**: Individual forecast pages with staking options
3. **Premium Page**: User access level and unlocked content management
4. **Wallet Integration**: MetaMask connection for blockchain interactions
5. **Responsive Design**: Mobile-first Tailwind CSS styling

### Backend Features
1. **Forecast Management**: CRUD operations for economic forecasts
2. **AI Integration**: Gemini API for generating realistic predictions
3. **User Authentication**: Laravel Breeze with wallet authentication
4. **Database Models**: Structured forecast data with JSON content
5. **Artisan Commands**: Automated forecast generation

### AI-Powered Forecasting
The system includes intelligent forecast generation:
```bash
# Generate AI forecasts for multiple countries
php artisan forecast:generate --ai
```

Features:
- Country-specific economic analysis
- Confidence scoring (0-100%)
- Key economic drivers identification
- Fallback to sample data if AI fails

## API Endpoints

### Authentication Required Routes
```
GET  /dashboard          - Main forecast dashboard
GET  /forecasts/{id}     - Individual forecast details
GET  /premium           - Premium features page
POST /wallet-login      - Wallet-based authentication
```

### Public Routes
```
GET  /                  - Landing page
GET  /login            - Standard login
POST /register         - User registration
```

## Database Schema

### Forecasts Table
```sql
- id: Primary key
- forecastId: Unique forecast identifier
- title: Forecast title (e.g., "GDP Growth 2026")
- country: Target country
- freeSummary: Public preview value
- unlockedContent: JSON with detailed analysis
- created_at/updated_at: Timestamps
```

### Users Table (Extended)
```sql
- id: Primary key
- name: User name
- email: User email
- wallet_address: Blockchain wallet (optional)
- email_verified_at: Verification timestamp
- password: Encrypted password
- remember_token: Remember me token
```

## Configuration Files

### Vite Configuration (`vite.config.js`)
```javascript
export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',  // Required for Replit
        port: 5000,       // Frontend port
        hmr: {
            host: 'localhost',
        },
    },
});
```

### Laravel Configuration
- **Database**: SQLite for development, PostgreSQL for production
- **Queue**: Database driver for background jobs
- **Cache**: Database-based caching
- **Session**: Database storage with 120-minute lifetime

## Troubleshooting

### Common Issues

1. **Vite server not accessible**
   - Ensure `host: '0.0.0.0'` in vite.config.js
   - Check that port 5000 is not blocked
   - Verify frontend build is working: `npm run dev`

2. **AI forecasts failing**
   - Check GEMINI_API_KEY is correctly set
   - Verify Python dependencies: `pip show google-genai`
   - Test Python script directly: `python3 gemini_forecast.py Nigeria "GDP Growth"`

3. **Database migration errors**
   - Ensure SQLite file exists: `touch database/database.sqlite`
   - Check file permissions
   - Try fresh migration: `php artisan migrate:fresh`

4. **Blockchain integration issues**
   - Verify contract addresses in `.env`
   - Check MetaMask network configuration
   - Ensure ABI files are in `resources/js/abi/`

### Development Commands

```bash
# Clear all caches
php artisan optimize:clear

# Reset database with fresh data
php artisan migrate:fresh
php artisan forecast:generate

# Check application status
php artisan about

# Monitor logs
php artisan pail

# Run tests
php artisan test
```

## Production Deployment

### 1. Environment Setup
```bash
# Production environment variables
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database (PostgreSQL recommended)
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_DATABASE=your-db-name
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

# Cache configuration
CACHE_STORE=redis
REDIS_HOST=your-redis-host

# Queue configuration (use Redis or database)
QUEUE_CONNECTION=redis
```

### 2. Build Assets
```bash
# Install production dependencies
composer install --optimize-autoloader --no-dev

# Build frontend assets
npm run build
```

### 3. Optimize for Production
```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Generate key
php artisan key:generate

# Run migrations
php artisan migrate --force
```

## Security Considerations

1. **API Keys**: Store in environment variables, never commit to git
2. **Database**: Use PostgreSQL in production with proper user permissions
3. **HTTPS**: Always use SSL/TLS in production
4. **CORS**: Configure appropriate CORS settings
5. **Rate Limiting**: Implement API rate limiting
6. **Input Validation**: All user inputs are validated server-side
7. **Smart Contract**: Audit contract before mainnet deployment

## Support

For technical support or questions:
1. Check this documentation first
2. Review error logs: `storage/logs/laravel.log`
3. Test individual components (AI script, database, frontend)
4. Verify environment configuration

## License

This project is licensed under the MIT License.

const dagTokenAddress = "0x3aef535bf937185735aaf5b803983adc110e9d76"
const futureCastAddress ="0x4058a46b47ccda82f3c7d63beb8547437ef1a41a" 
