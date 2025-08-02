//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

/**
 * @title Deadpool
 * @dev A gamified Web3 platform for depositing dead tokens and winning Monad rewards
 * @author BuidlGuidl
 */
contract Deadpool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000; // 10% max platform fee
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MIN_POOL_DURATION = 1 hours;
    uint256 public constant MAX_POOL_DURATION = 30 days;

    // State Variables
    address public treasury;
    address public dexRouter;
    uint256 public nextPoolId = 1;
    uint16 public platformFeeBps = 1000; // Default 10% platform fee

    // Pool structure
    struct Pool {
        address creator;
        address tokenAddress;
        uint256 deadline;
        uint256 totalDeposited;
        uint256 totalMonadReceived;
        address[3] winners;
        bool finalized;
        bool cancelled;
        address[] depositors;
        mapping(address => uint256) deposits;
    }

    // Storage mappings
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(address => uint256[]) public userPools; // Pools created by user
    mapping(address => uint256[]) public userDeposits; // Pools user deposited to

    // Events
    event DeadpoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        address indexed tokenAddress,
        uint256 deadline
    );
    
    event Deposited(
        uint256 indexed poolId,
        address indexed depositor,
        uint256 amount,
        uint256 totalDeposited
    );
    
    event PoolFinalized(
        uint256 indexed poolId,
        uint256 totalMonadReceived,
        address[3] winners,
        uint256 platformFee
    );
    
    event RewardClaimed(
        uint256 indexed poolId,
        address indexed winner,
        uint256 reward
    );
    
    event PoolCanceled(
        uint256 indexed poolId,
        address indexed creator
    );
    
    event EmergencyWithdraw(
        uint256 indexed poolId,
        address indexed admin,
        uint256 amount
    );
    
    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );
    
    event DexRouterUpdated(
        address indexed oldRouter,
        address indexed newRouter
    );
    
    event PlatformFeeUpdated(
        uint16 oldFeeBps,
        uint16 newFeeBps
    );

    // Modifiers
    modifier validPool(uint256 poolId) {
        require(poolId > 0 && poolId < nextPoolId, "Invalid pool ID");
        _;
    }

    modifier poolNotFinalized(uint256 poolId) {
        require(!pools[poolId].finalized, "Pool already finalized");
        require(!pools[poolId].cancelled, "Pool cancelled");
        _;
    }

    modifier onlyAfterDeadline(uint256 poolId) {
        require(block.timestamp >= pools[poolId].deadline, "Pool deadline not reached");
        _;
    }

    modifier onlyBeforeDeadline(uint256 poolId) {
        require(block.timestamp < pools[poolId].deadline, "Pool deadline passed");
        _;
    }

    // Constructor
    constructor(address _treasury, address _dexRouter) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury address");
        require(_dexRouter != address(0), "Invalid DEX router address");
        
        treasury = _treasury;
        dexRouter = _dexRouter;
    }

    /**
     * @dev Create a new deadpool for a specific dead token
     * @param tokenAddress Address of the dead token
     * @param duration Duration of the pool in seconds
     */
    function createDeadpool(
        address tokenAddress,
        uint256 duration
    ) external returns (uint256) {
        require(tokenAddress != address(0), "Invalid token address");
        require(duration >= MIN_POOL_DURATION && duration <= MAX_POOL_DURATION, "Invalid duration");

        uint256 poolId = nextPoolId++;
        uint256 deadline = block.timestamp + duration;

        Pool storage newPool = pools[poolId];
        newPool.creator = msg.sender;
        newPool.tokenAddress = tokenAddress;
        newPool.deadline = deadline;
        newPool.totalDeposited = 0;
        newPool.totalMonadReceived = 0;
        newPool.finalized = false;
        newPool.cancelled = false;

        userPools[msg.sender].push(poolId);

        emit DeadpoolCreated(poolId, msg.sender, tokenAddress, deadline);

        return poolId;
    }

    /**
     * @dev Deposit dead tokens into an open pool
     * @param poolId ID of the pool to deposit to
     * @param amount Amount of tokens to deposit
     */
    function depositToPool(uint256 poolId, uint256 amount) 
        external 
        validPool(poolId) 
        poolNotFinalized(poolId) 
        onlyBeforeDeadline(poolId) 
        nonReentrant 
    {
        require(amount > 0, "Amount must be greater than 0");

        Pool storage pool = pools[poolId];
        IERC20 token = IERC20(pool.tokenAddress);

        // Transfer tokens from user to contract
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Update pool state
        if (pool.deposits[msg.sender] == 0) {
            pool.depositors.push(msg.sender);
            userDeposits[msg.sender].push(poolId);
        }
        
        pool.deposits[msg.sender] = pool.deposits[msg.sender] + amount;
        pool.totalDeposited = pool.totalDeposited + amount;

        emit Deposited(poolId, msg.sender, amount, pool.totalDeposited);
    }

    /**
     * @dev Finalize a pool after deadline - swap tokens and select winners
     * @param poolId ID of the pool to finalize
     */
    function finalizePool(uint256 poolId) 
        external 
        validPool(poolId) 
        poolNotFinalized(poolId) 
        onlyAfterDeadline(poolId) 
        nonReentrant 
    {
        Pool storage pool = pools[poolId];
        require(pool.totalDeposited > 0, "No deposits in pool");

        // Swap dead tokens for Monad (MON)
        uint256 monadReceived = _swapTokensForMonad(pool.tokenAddress, pool.totalDeposited);
        require(monadReceived > 0, "Swap failed or no Monad received");

        // Calculate platform fee
        uint256 platformFee = (monadReceived * platformFeeBps) / BPS_DENOMINATOR;
        uint256 rewardPool = monadReceived - platformFee;

        // Transfer platform fee to treasury
        if (platformFee > 0) {
            payable(treasury).transfer(platformFee);
        }

        // Select 3 winners randomly
        address[3] memory winners = _selectWinners(poolId);
        
        // Update pool state
        pool.totalMonadReceived = rewardPool;
        pool.winners = winners;
        pool.finalized = true;

        emit PoolFinalized(poolId, monadReceived, winners, platformFee);
    }

    /**
     * @dev Claim reward if user is a winner
     * @param poolId ID of the pool to claim from
     */
    function claimReward(uint256 poolId) 
        external 
        validPool(poolId) 
        nonReentrant 
    {
        Pool storage pool = pools[poolId];
        require(pool.finalized, "Pool not finalized");
        require(!hasClaimed[poolId][msg.sender], "Already claimed");

        // Check if msg.sender is a winner
        bool isWinner = false;
        for (uint i = 0; i < 3; i++) {
            if (pool.winners[i] == msg.sender) {
                isWinner = true;
                break;
            }
        }
        require(isWinner, "Not a winner");

        // Calculate individual reward (split equally among 3 winners)
        uint256 reward = pool.totalMonadReceived / 3;
        require(reward > 0, "No reward available");

        // Mark as claimed and transfer reward
        hasClaimed[poolId][msg.sender] = true;
        payable(msg.sender).transfer(reward);

        emit RewardClaimed(poolId, msg.sender, reward);
    }

    /**
     * @dev Cancel a pool if no deposits have been made yet (creator only)
     * @param poolId ID of the pool to cancel
     */
    function cancelPool(uint256 poolId) 
        external 
        validPool(poolId) 
        poolNotFinalized(poolId) 
    {
        Pool storage pool = pools[poolId];
        require(msg.sender == pool.creator, "Only creator can cancel");
        require(pool.totalDeposited == 0, "Cannot cancel pool with deposits");

        pool.cancelled = true;

        emit PoolCanceled(poolId, msg.sender);
    }

    /**
     * @dev Emergency withdraw function for admin (owner only)
     * @param poolId ID of the pool to withdraw from
     */
    function emergencyWithdraw(uint256 poolId) 
        external 
        onlyOwner 
        validPool(poolId) 
        nonReentrant 
    {
        Pool storage pool = pools[poolId];
        require(!pool.finalized, "Cannot withdraw from finalized pool");

        if (pool.totalDeposited > 0) {
            IERC20 token = IERC20(pool.tokenAddress);
            uint256 balance = token.balanceOf(address(this));
            if (balance > 0) {
                token.safeTransfer(treasury, balance);
            }
        }

        pool.cancelled = true;

        emit EmergencyWithdraw(poolId, msg.sender, pool.totalDeposited);
    }

    /**
     * @dev Update treasury address (owner only)
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;

        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Update DEX router address (owner only)
     * @param newRouter New DEX router address
     */
    function setDexRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "Invalid router address");
        address oldRouter = dexRouter;
        dexRouter = newRouter;

        emit DexRouterUpdated(oldRouter, newRouter);
    }

    /**
     * @dev Update platform fee (owner only)
     * @param newFeeBps New platform fee in basis points (0-1000, max 10%)
     */
    function setPlatformFee(uint16 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_PLATFORM_FEE_BPS, "Platform fee too high");
        uint16 oldFeeBps = platformFeeBps;
        platformFeeBps = newFeeBps;

        emit PlatformFeeUpdated(oldFeeBps, newFeeBps);
    }

    // View functions
    function getPool(uint256 poolId) external view returns (
        address creator,
        address tokenAddress,
        uint256 deadline,
        uint256 totalDeposited,
        uint256 totalMonadReceived,
        address[3] memory winners,
        bool finalized,
        bool cancelled
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.creator,
            pool.tokenAddress,
            pool.deadline,
            pool.totalDeposited,
            pool.totalMonadReceived,
            pool.winners,
            pool.finalized,
            pool.cancelled
        );
    }

    function getUserDeposit(uint256 poolId, address user) external view returns (uint256) {
        return pools[poolId].deposits[user];
    }

    function getPoolDepositors(uint256 poolId) external view returns (address[] memory) {
        return pools[poolId].depositors;
    }

    function getUserPools(address user) external view returns (uint256[] memory) {
        return userPools[user];
    }

    function getUserDeposits(address user) external view returns (uint256[] memory) {
        return userDeposits[user];
    }

    // Internal functions
    function _swapTokensForMonad(address tokenAddress, uint256 amount) internal returns (uint256) {
        // This is a simplified swap implementation
        // In a real implementation, you would integrate with a DEX router
        // For now, we'll simulate the swap by returning the contract's Monad balance
        
        console.log("Swapping %s tokens of %s for Monad", amount, tokenAddress);
        
        // Simulate swap - in reality, this would call DEX router
        uint256 contractBalance = address(this).balance;
        
        // Return a portion of the contract balance as "swapped" Monad
        // This is just for testing - real implementation would use DEX
        return contractBalance > 0 ? contractBalance : 0;
    }

    function _selectWinners(uint256 poolId) internal view returns (address[3] memory) {
        Pool storage pool = pools[poolId];
        address[] memory depositors = pool.depositors;
        require(depositors.length > 0, "No depositors");

        address[3] memory winners;
        
        if (depositors.length >= 3) {
            // Select 3 different winners
            uint256 seed = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                poolId,
                msg.sender
            )));
            
            for (uint i = 0; i < 3; i++) {
                uint256 index = uint256(keccak256(abi.encodePacked(seed, i))) % depositors.length;
                winners[i] = depositors[index];
                
                // Simple way to avoid duplicates - in production, use more sophisticated method
                if (i > 0 && winners[i] == winners[i-1]) {
                    index = (index + 1) % depositors.length;
                    winners[i] = depositors[index];
                }
            }
        } else {
            // If fewer than 3 depositors, fill available slots
            for (uint i = 0; i < depositors.length && i < 3; i++) {
                winners[i] = depositors[i];
            }
        }

        return winners;
    }

    // Function to receive ETH (Monad)
    receive() external payable {}

    // Fallback function
    fallback() external payable {}
}