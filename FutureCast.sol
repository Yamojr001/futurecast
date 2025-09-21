// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FutureCast
 * @dev A smart contract for economic forecasting with tiered staking access
 * Users can stake DAG tokens to unlock premium forecasts and analysis
 */
contract FutureCast is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Forecast structure (no unlocked content on-chain for security)
    struct Forecast {
        uint256 id;
        string title;
        string country;
        string freeSummary;
        string contentHash; // Hash or encrypted reference to off-chain content
        uint256 createdAt;
        bool isActive;
    }
    
    // Staking tiers
    struct StakeTier {
        uint256 amount;      // Required stake amount in tokens
        string name;         // Tier name (Basic, Premium)
        bool unlocksFull;    // Whether this tier unlocks full content
    }
    
    // User stake information
    struct UserStake {
        uint256 totalStaked;
        uint256 tier;
        uint256[] unlockedForecasts;
        uint256 lastStakeTime;
    }
    
    // State variables
    IERC20 public dagToken;
    mapping(uint256 => Forecast) public forecasts;
    mapping(address => UserStake) public userStakes;
    StakeTier[] public stakeTiers;
    
    uint256 public nextForecastId = 1;
    uint256 public totalForecasts;
    uint256 public totalValueLocked;
    
    // Events
    event ForecastCreated(uint256 indexed forecastId, string title, string country);
    event ForecastUnlocked(address indexed user, uint256 indexed forecastId, uint256 tier);
    event StakeDeposited(address indexed user, uint256 amount, uint256 tier);
    event StakeWithdrawn(address indexed user, uint256 amount);
    event TierAdded(uint256 indexed tierId, uint256 amount, string name);
    
    // Custom errors
    error InvalidStakeAmount();
    error InsufficientStake();
    error ForecastNotFound();
    error AlreadyUnlocked();
    error InvalidTier();
    error TransferFailed();
    error NoStakeToWithdraw();
    
    constructor(address _dagToken, address initialOwner) Ownable(initialOwner) {
        dagToken = IERC20(_dagToken);
        
        // Initialize default tiers
        stakeTiers.push(StakeTier({
            amount: 50 * 10**18,    // 50 DAG tokens
            name: "Basic",
            unlocksFull: false
        }));
        
        stakeTiers.push(StakeTier({
            amount: 100 * 10**18,   // 100 DAG tokens
            name: "Premium",
            unlocksFull: true
        }));
    }
    
    /**
     * @dev Create a new economic forecast (only owner)
     */
    function createForecast(
        string calldata _title,
        string calldata _country,
        string calldata _freeSummary,
        string calldata _contentHash
    ) external onlyOwner {
        uint256 forecastId = nextForecastId++;
        
        forecasts[forecastId] = Forecast({
            id: forecastId,
            title: _title,
            country: _country,
            freeSummary: _freeSummary,
            contentHash: _contentHash,
            createdAt: block.timestamp,
            isActive: true
        });
        
        totalForecasts++;
        emit ForecastCreated(forecastId, _title, _country);
    }
    
    /**
     * @dev Stake tokens and unlock a specific forecast
     */
    function stakeAndUnlock(uint256 _forecastId, uint256 _tierIndex) external nonReentrant {
        if (_forecastId == 0 || forecasts[_forecastId].id == 0) {
            revert ForecastNotFound();
        }
        
        if (_tierIndex >= stakeTiers.length) {
            revert InvalidTier();
        }
        
        StakeTier memory tier = stakeTiers[_tierIndex];
        UserStake storage userStake = userStakes[msg.sender];
        
        // Check if user already has sufficient stake
        if (userStake.totalStaked < tier.amount) {
            uint256 requiredStake = tier.amount - userStake.totalStaked;
            
            // Transfer tokens from user using SafeERC20
            dagToken.safeTransferFrom(msg.sender, address(this), requiredStake);
            
            userStake.totalStaked = tier.amount;
            userStake.tier = _tierIndex;
            userStake.lastStakeTime = block.timestamp;
            totalValueLocked += requiredStake;
            
            emit StakeDeposited(msg.sender, requiredStake, _tierIndex);
        }
        
        // Check if already unlocked
        for (uint i = 0; i < userStake.unlockedForecasts.length; i++) {
            if (userStake.unlockedForecasts[i] == _forecastId) {
                revert AlreadyUnlocked();
            }
        }
        
        // Unlock the forecast
        userStake.unlockedForecasts.push(_forecastId);
        emit ForecastUnlocked(msg.sender, _forecastId, _tierIndex);
    }
    
    /**
     * @dev Stake tokens with native currency (payable function for BDAG)
     */
    function stakeAndUnlockNative(uint256 _forecastId, uint256 _tierIndex) external payable nonReentrant {
        if (_forecastId == 0 || forecasts[_forecastId].id == 0) {
            revert ForecastNotFound();
        }
        
        if (_tierIndex >= stakeTiers.length) {
            revert InvalidTier();
        }
        
        StakeTier memory tier = stakeTiers[_tierIndex];
        
        // For native currency, we expect the exact tier amount
        if (msg.value != tier.amount) {
            revert InvalidStakeAmount();
        }
        
        UserStake storage userStake = userStakes[msg.sender];
        
        // Check if already unlocked
        for (uint i = 0; i < userStake.unlockedForecasts.length; i++) {
            if (userStake.unlockedForecasts[i] == _forecastId) {
                revert AlreadyUnlocked();
            }
        }
        
        // Update user stake
        userStake.totalStaked += msg.value;
        userStake.tier = _tierIndex;
        userStake.lastStakeTime = block.timestamp;
        userStake.unlockedForecasts.push(_forecastId);
        totalValueLocked += msg.value;
        
        emit StakeDeposited(msg.sender, msg.value, _tierIndex);
        emit ForecastUnlocked(msg.sender, _forecastId, _tierIndex);
    }
    
    /**
     * @dev Withdraw staked tokens (with 7-day cooldown)
     */
    function withdrawStake(uint256 _amount) external nonReentrant {
        UserStake storage userStake = userStakes[msg.sender];
        
        if (userStake.totalStaked == 0) {
            revert NoStakeToWithdraw();
        }
        
        if (_amount > userStake.totalStaked) {
            _amount = userStake.totalStaked;
        }
        
        // 7-day cooldown period
        require(block.timestamp >= userStake.lastStakeTime + 7 days, "Cooldown period active");
        
        userStake.totalStaked -= _amount;
        totalValueLocked -= _amount;
        
        // Update tier based on remaining stake
        userStake.tier = getUserTier(userStake.totalStaked);
        
        // Transfer tokens back to user using SafeERC20
        dagToken.safeTransfer(msg.sender, _amount);
        
        emit StakeWithdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev Add a new staking tier (only owner)
     */
    function addStakeTier(uint256 _amount, string calldata _name, bool _unlocksFull) external onlyOwner {
        stakeTiers.push(StakeTier({
            amount: _amount,
            name: _name,
            unlocksFull: _unlocksFull
        }));
        
        emit TierAdded(stakeTiers.length - 1, _amount, _name);
    }
    
    /**
     * @dev Get user's current tier based on staked amount
     */
    function getUserTier(uint256 _stakedAmount) public view returns (uint256) {
        for (uint256 i = stakeTiers.length; i > 0; i--) {
            if (_stakedAmount >= stakeTiers[i - 1].amount) {
                return i - 1;
            }
        }
        return 0; // Default to lowest tier
    }
    
    /**
     * @dev Check if user has unlocked a specific forecast
     */
    function hasUnlockedForecast(address _user, uint256 _forecastId) external view returns (bool) {
        uint256[] memory unlockedForecasts = userStakes[_user].unlockedForecasts;
        for (uint i = 0; i < unlockedForecasts.length; i++) {
            if (unlockedForecasts[i] == _forecastId) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get all unlocked forecasts for a user
     */
    function getUserUnlockedForecasts(address _user) external view returns (uint256[] memory) {
        return userStakes[_user].unlockedForecasts;
    }
    
    /**
     * @dev Get forecast details
     */
    function getForecast(uint256 _forecastId) external view returns (Forecast memory) {
        return forecasts[_forecastId];
    }
    
    /**
     * @dev Get all stake tiers
     */
    function getAllTiers() external view returns (StakeTier[] memory) {
        return stakeTiers;
    }
    
    /**
     * @dev Emergency withdraw for contract owner
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = dagToken.balanceOf(address(this));
        if (balance > 0) {
            dagToken.safeTransfer(owner(), balance);
        }
        
        // Also withdraw any native currency
        if (address(this).balance > 0) {
            payable(owner()).transfer(address(this).balance);
        }
    }
    
    /**
     * @dev Update forecast content (only owner)
     */
    function updateForecast(
        uint256 _forecastId,
        string calldata _title,
        string calldata _country,
        string calldata _freeSummary,
        string calldata _contentHash
    ) external onlyOwner {
        if (forecasts[_forecastId].id == 0) {
            revert ForecastNotFound();
        }
        
        Forecast storage forecast = forecasts[_forecastId];
        forecast.title = _title;
        forecast.country = _country;
        forecast.freeSummary = _freeSummary;
        forecast.contentHash = _contentHash;
    }
    
    /**
     * @dev Toggle forecast active status
     */
    function toggleForecastStatus(uint256 _forecastId) external onlyOwner {
        if (forecasts[_forecastId].id == 0) {
            revert ForecastNotFound();
        }
        
        forecasts[_forecastId].isActive = !forecasts[_forecastId].isActive;
    }
    
    // Fallback function to receive native currency
    receive() external payable {
        totalValueLocked += msg.value;
    }
}