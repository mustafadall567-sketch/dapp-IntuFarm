// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title FarmingVault
 * @dev Secure staking vault for earning rewards with advanced protection mechanisms
 */
contract FarmingVault is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;
    using Math for uint256;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 public immutable stakeToken; // sUSD
    IERC20 public immutable rewardToken; // RWD

    // Reward accounting with 1e18 precision
    uint256 public accRewardPerShare; // Accumulated rewards per share, scaled by 1e18
    uint256 public lastUpdate;
    uint256 public rewardRate; // Rewards per second, scaled by 1e18

    // Security parameters
    uint256 public lockPeriod; // Lock period in seconds
    uint256 public minStakeAmount; // Minimum stake amount
    uint256 public maxStakeAmount; // Maximum stake amount per user

    // Vault state
    uint256 public totalStaked;
    uint256 public rewardEndTime;
    uint256 public emergencyWithdrawFee; // Fee in basis points (10000 = 100%)

    struct UserInfo {
        uint256 amount; // Amount of staked tokens
        uint256 rewardDebt; // Reward debt for accurate accounting
        uint256 lastDeposit; // Timestamp of last deposit for lock period
        uint256 pendingRewards; // Manually tracked pending rewards
    }

    mapping(address => UserInfo) public userInfo;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount, uint256 fee);
    event RewardRateUpdated(uint256 newRate, uint256 endTime);
    event LockPeriodUpdated(uint256 newLockPeriod);
    event StakeLimitsUpdated(uint256 minAmount, uint256 maxAmount);
    event EmergencyWithdrawFeeUpdated(uint256 newFee);
    event RewardFunded(uint256 amount, uint256 duration);

    constructor(
        IERC20 _stakeToken,
        IERC20 _rewardToken,
        address admin,
        uint256 _lockPeriod,
        uint256 _minStakeAmount,
        uint256 _maxStakeAmount
    ) {
        require(address(_stakeToken) != address(0), "FarmingVault: stake token cannot be zero");
        require(address(_rewardToken) != address(0), "FarmingVault: reward token cannot be zero");
        require(admin != address(0), "FarmingVault: admin cannot be zero");
        require(_maxStakeAmount >= _minStakeAmount, "FarmingVault: invalid stake limits");

        stakeToken = _stakeToken;
        rewardToken = _rewardToken;
        lockPeriod = _lockPeriod;
        minStakeAmount = _minStakeAmount;
        maxStakeAmount = _maxStakeAmount;
        emergencyWithdrawFee = 1000; // 10% default fee

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);

        lastUpdate = block.timestamp;
    }

    /**
     * @dev Update reward variables
     */
    modifier updateReward() {
        if (block.timestamp > lastUpdate && totalStaked > 0 && rewardRate > 0) {
            uint256 multiplier = Math.min(block.timestamp, rewardEndTime) - lastUpdate;
            if (multiplier > 0) {
                uint256 reward = multiplier * rewardRate;
                accRewardPerShare += (reward * 1e18) / totalStaked;
            }
        }
        lastUpdate = block.timestamp;
        _;
    }

    /**
     * @dev Set reward rate and duration
     * @param _rewardRate New reward rate per second
     * @param _duration Duration in seconds
     */
    function setRewardRate(uint256 _rewardRate, uint256 _duration) 
        external 
        onlyRole(TREASURER_ROLE) 
        updateReward 
    {
        require(_duration > 0, "FarmingVault: duration must be positive");
        
        rewardRate = _rewardRate;
        rewardEndTime = block.timestamp + _duration;
        
        emit RewardRateUpdated(_rewardRate, rewardEndTime);
    }

    /**
     * @dev Fund the vault with rewards
     * @param amount Amount of reward tokens to fund
     * @param duration Duration for the rewards distribution
     */
    function fundRewards(uint256 amount, uint256 duration) 
        external 
        onlyRole(TREASURER_ROLE) 
        updateReward 
    {
        require(amount > 0, "FarmingVault: amount must be positive");
        require(duration > 0, "FarmingVault: duration must be positive");

        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 newRate = amount / duration;
        rewardRate = newRate;
        rewardEndTime = block.timestamp + duration;
        
        emit RewardFunded(amount, duration);
        emit RewardRateUpdated(newRate, rewardEndTime);
    }

    /**
     * @dev Set lock period
     * @param _lockPeriod New lock period in seconds
     */
    function setLockPeriod(uint256 _lockPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        lockPeriod = _lockPeriod;
        emit LockPeriodUpdated(_lockPeriod);
    }

    /**
     * @dev Set stake limits
     * @param _minAmount Minimum stake amount
     * @param _maxAmount Maximum stake amount
     */
    function setStakeLimits(uint256 _minAmount, uint256 _maxAmount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_maxAmount >= _minAmount, "FarmingVault: invalid stake limits");
        minStakeAmount = _minAmount;
        maxStakeAmount = _maxAmount;
        emit StakeLimitsUpdated(_minAmount, _maxAmount);
    }

    /**
     * @dev Set emergency withdraw fee
     * @param _fee Fee in basis points (10000 = 100%)
     */
    function setEmergencyWithdrawFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_fee <= 5000, "FarmingVault: fee too high"); // Max 50%
        emergencyWithdrawFee = _fee;
        emit EmergencyWithdrawFeeUpdated(_fee);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Calculate pending rewards for a user
     * @param user User address
     * @return Pending reward amount
     */
    function pendingReward(address user) public view returns (uint256) {
        UserInfo memory userObj = userInfo[user];
        uint256 _accRewardPerShare = accRewardPerShare;
        
        if (block.timestamp > lastUpdate && totalStaked > 0 && rewardRate > 0) {
            uint256 multiplier = Math.min(block.timestamp, rewardEndTime) - lastUpdate;
            if (multiplier > 0) {
                uint256 reward = multiplier * rewardRate;
                _accRewardPerShare += (reward * 1e18) / totalStaked;
            }
        }
        
        return (userObj.amount * _accRewardPerShare) / 1e18 - userObj.rewardDebt + userObj.pendingRewards;
    }

    /**
     * @dev Deposit stake tokens
     * @param amount Amount to deposit
     */
    function deposit(uint256 amount) external nonReentrant whenNotPaused updateReward {
        require(amount >= minStakeAmount, "FarmingVault: amount below minimum");
        
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount + amount <= maxStakeAmount, "FarmingVault: exceeds maximum stake");

        // Claim pending rewards if any
        if (user.amount > 0) {
            uint256 pending = (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt + user.pendingRewards;
            if (pending > 0) {
                user.pendingRewards = 0;
                _safeRewardTransfer(msg.sender, pending);
                emit Claim(msg.sender, pending);
            }
        }

        // Transfer stake tokens
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        
        // Update user info
        user.amount += amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;
        user.lastDeposit = block.timestamp;
        totalStaked += amount;

        emit Deposit(msg.sender, amount);
    }

    /**
     * @dev Withdraw stake tokens
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused updateReward {
        UserInfo storage user = userInfo[msg.sender];
        require(user.amount >= amount, "FarmingVault: insufficient balance");
        require(
            block.timestamp >= user.lastDeposit + lockPeriod,
            "FarmingVault: tokens are locked"
        );

        // Claim pending rewards
        uint256 pending = (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt + user.pendingRewards;
        if (pending > 0) {
            user.pendingRewards = 0;
            _safeRewardTransfer(msg.sender, pending);
            emit Claim(msg.sender, pending);
        }

        // Update user info
        user.amount -= amount;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;
        totalStaked -= amount;

        // Transfer stake tokens back
        stakeToken.safeTransfer(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    /**
     * @dev Claim rewards without withdrawing stake
     */
    function claim() external nonReentrant whenNotPaused updateReward {
        UserInfo storage user = userInfo[msg.sender];
        uint256 pending = (user.amount * accRewardPerShare) / 1e18 - user.rewardDebt + user.pendingRewards;
        
        require(pending > 0, "FarmingVault: no rewards to claim");
        
        user.pendingRewards = 0;
        user.rewardDebt = (user.amount * accRewardPerShare) / 1e18;
        
        _safeRewardTransfer(msg.sender, pending);
        emit Claim(msg.sender, pending);
    }

    /**
     * @dev Exit the vault (withdraw all and claim rewards)
     */
    function exit() external {
        UserInfo memory user = userInfo[msg.sender];
        if (user.amount > 0) {
            withdraw(user.amount);
        }
    }

    /**
     * @dev Emergency withdraw without rewards and with fee
     */
    function emergencyWithdraw() external nonReentrant {
        UserInfo storage user = userInfo[msg.sender];
        uint256 amount = user.amount;
        require(amount > 0, "FarmingVault: no stake to withdraw");

        // Reset user info
        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        totalStaked -= amount;

        // Calculate fee
        uint256 fee = (amount * emergencyWithdrawFee) / 10000;
        uint256 withdrawAmount = amount - fee;

        // Transfer tokens
        if (withdrawAmount > 0) {
            stakeToken.safeTransfer(msg.sender, withdrawAmount);
        }
        if (fee > 0) {
            stakeToken.safeTransfer(address(this), fee); // Fee stays in contract
        }

        emit EmergencyWithdraw(msg.sender, withdrawAmount, fee);
    }

    /**
     * @dev Safe reward transfer function
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _safeRewardTransfer(address to, uint256 amount) internal {
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        if (amount > rewardBalance) {
            rewardToken.safeTransfer(to, rewardBalance);
        } else {
            rewardToken.safeTransfer(to, amount);
        }
    }

    /**
     * @dev Emergency function to recover stuck tokens (admin only)
     * @param token Token address
     * @param amount Amount to recover
     */
    function recoverToken(IERC20 token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(token) != address(stakeToken), "FarmingVault: cannot recover stake token");
        token.safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Get user information
     * @param user User address
     * @return amount Staked amount
     * @return rewardDebt Reward debt
     * @return lastDeposit Last deposit timestamp
     * @return pendingRewards Pending rewards
     * @return unlockTime Unlock timestamp
     */
    function getUserInfo(address user) external view returns (
        uint256 amount,
        uint256 rewardDebt,
        uint256 lastDeposit,
        uint256 pendingRewards,
        uint256 unlockTime
    ) {
        UserInfo memory userObj = userInfo[user];
        return (
            userObj.amount,
            userObj.rewardDebt,
            userObj.lastDeposit,
            userObj.pendingRewards,
            userObj.lastDeposit + lockPeriod
        );
    }

    /**
     * @dev Get vault statistics
     * @return _totalStaked Total staked amount
     * @return _rewardRate Current reward rate
     * @return _rewardEndTime Reward end time
     * @return _accRewardPerShare Accumulated reward per share
     */
    function getVaultStats() external view returns (
        uint256 _totalStaked,
        uint256 _rewardRate,
        uint256 _rewardEndTime,
        uint256 _accRewardPerShare
    ) {
        return (totalStaked, rewardRate, rewardEndTime, accRewardPerShare);
    }
}
