<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Summarize the project and solidity contract description in markdown format

Certainly! Here is a concise summary of the Deadpool project and its core Solidity contract structure, presented in Markdown format:

# 🪦 Deadpool: Web3 Dead Token Lottery on Monad

## Project Overview

**Deadpool** is a gamified Web3 platform built on the Monad testnet. It allows users to deposit defunct or "dead" tokens (such as rugged meme coins or dust assets) into pools called "deadpools." After a set timer, all tokens in a deadpool are swapped for Monad coins and distributed among three randomly-selected winners. The platform takes a small fee, and anyone can create or participate in deadpools.

### Key Features

- **Create Deadpools:** Users can launch a pool with a specific dead token, deadline, and platform fee.
- **Deposit Tokens:** Anyone can deposit matching dead tokens into an open pool.
- **Gamified Cleanup:** Adds fun and anticipation by turning wallet dust into a chance to win rewards.
- **Random Rewards:** At deadline, pooled tokens are swapped to Monad and distributed to 3 winners.
- **Platform Fees:** A small portion of the swapped value is retained by the platform.
- **Community-driven:** Pools can be created for any identified dead token.


## Core Solidity Contract: Functionality

Below is a summary of the main contract features and functions required for Deadpool:


| Function | Purpose | Key Inputs | Access |
| :-- | :-- | :-- | :-- |
| `createDeadpool` | Start a new pool for a dead token, with fee \& timer | Token address, deadline, fee | Anyone |
| `depositToPool` | Deposit dead tokens into an open pool | Pool ID, amount | Anyone |
| `finalizePool` | Swap pooled tokens for Monad and pick 3 winners | Pool ID | Anyone (after deadline) |
| `claimReward` | Claim Monad reward if winner in a finalized pool | Pool ID | Winners only |
| `cancelPool` *(optional)* | Cancel open pool if no deposits yet | Pool ID | Pool creator |
| `emergencyWithdraw` | Admin recovers pool funds (for emergencies) | Pool ID | Admin only |
| `setTreasury/setDexRouter` | Update treasury or DEX router addresses | Address | Admin only |

### Main Data Structures

```solidity
struct Pool {
    address creator;
    address tokenAddress;
    uint256 deadline;
    uint16 platformFeeBps;
    uint256 totalDeposited;
    uint256 totalMonadReceived;
    address[3] winners;
    bool finalized;
}

mapping(uint256 => Pool) public pools;
mapping(uint256 => mapping(address => bool)) public hasClaimed;
uint256 public nextPoolId;
```


### Key Events

- `DeadpoolCreated`
- `Deposited`
- `PoolFinalized`
- `RewardClaimed`
- `PoolCanceled`
- `EmergencyWithdraw`
- `TreasuryUpdated`
- `DexRouterUpdated`


## Flow Diagram

1. **Create Deadpool** → 2. **Deposit Tokens** → 3. **Pool Finalized (Deadline)**
→ 4. **Tokens Swapped to Monad** → 5. **Three Winners Randomly Selected**
→ 6. **Winners Claim Rewards**

**Deadpool** offers a simple, transparent, and fun mechanism to clean up useless tokens with a fair chance to win, leveraging Monad’s cost-effective infrastructure and smart contract automation.

