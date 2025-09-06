# DEX Challenge - Setup and Usage Guide

## 🎯 Project Overview

This is a complete decentralized exchange (DEX) implementation for trading ERC20 BALLOONS ($BAL) ↔ STRK on Starknet. The project includes:

- **Smart Contracts** (Cairo): DEX.cairo and Balloons.cairo
- **Backend API** (Express.js): REST API for contract interactions
- **Frontend** (React + TypeScript): Modern web interface with Material-UI
- **Deployment Scripts**: Automated deployment to devnet/testnet

## 🏗️ Architecture

```
dex-challenge/
├── contracts/          # Cairo smart contracts
│   ├── src/
│   │   ├── dex.cairo          # Main DEX contract (AMM)
│   │   ├── balloons.cairo     # ERC20 token contract
│   │   └── lib.cairo          # Module declarations
│   └── Scarb.toml             # Cairo project config
├── backend/            # Express.js API server
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env                   # Environment variables
├── frontend/           # React TypeScript app
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # React contexts (Wallet, Contracts)
│   │   └── App.tsx            # Main app component
│   ├── package.json
│   └── .env                   # Frontend config
├── scripts/            # Deployment scripts
│   ├── deploy.js              # Contract deployment
│   └── package.json
└── package.json        # Root package.json
```

## 🚀 Quick Start

### Prerequisites

Before starting, ensure you have:

- **Node.js** (≥ v18.17)
- **npm** (comes with Node.js)
- **Git**
- **Rust** (for Cairo compilation)
- **Cairo** (v2.11.4)
- **Scarb** (v2.11.4)
- **Starknet-devnet** (v0.4.0)

### Installation

1. **Clone and setup the project:**
```bash
cd "c:\\Users\\huyoi\\Blockchain\\dex-challenge"
npm run install:all
```

2. **Start Starknet devnet** (Terminal 1):
```bash
npm run chain
```
This starts a local Starknet devnet on `http://localhost:5050`

3. **Compile and deploy contracts** (Terminal 2):
```bash
# First, compile Cairo contracts
cd contracts
scarb build

# Then deploy contracts
cd ..
npm run deploy
```

4. **Start the development servers** (Terminal 3):
```bash
npm run dev
```
This starts both backend (port 5001) and frontend (port 3000)

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## 📋 Features Implemented

### ✅ Smart Contracts

- **balloons.cairo**: ERC20 token contract
  - Mints 1000 $BAL tokens to deployer
  - Standard ERC20 functions (transfer, approve, balance_of)
  - Additional mint function for testing

- **dex.cairo**: Automated Market Maker (AMM)
  - **Reserves tracking**: `total_liquidity`, `liquidity[address]`
  - **AMM formula**: `x * y = k` with 0.3% fee
  - **Trading functions**: `strk_to_token()`, `token_to_strk()`
  - **Liquidity functions**: `deposit()`, `withdraw()`
  - **Initialization**: `init()` function
  - **Price calculation**: Uses fee formula `xInputWithFee = xInput * 997`

### ✅ Backend API (Express.js)

- **Contract management**: Dynamic contract address loading
- **Balance queries**: Token and STRK balance checking
- **Reserve monitoring**: Real-time pool reserve tracking
- **Swap calculations**: AMM price calculations
- **Network info**: Chain ID and RPC configuration

API Endpoints:
- `GET /api/health` - Health check
- `GET /api/contracts` - Get contract addresses
- `POST /api/balance` - Get token balances
- `GET /api/reserves` - Get DEX reserves
- `POST /api/calculate-swap` - Calculate swap output

### ✅ Frontend (React + TypeScript)

- **Wallet Integration**: 
  - Starknet wallet connection (Argent X, Braavos)
  - Account management and display
  - Transaction signing

- **Trading Interface**:
  - Token swap interface ($BAL ↔ STRK)
  - Real-time price calculation
  - Slippage visualization
  - Price impact warnings

- **Liquidity Management**:
  - Add liquidity (proportional deposits)
  - Remove liquidity (LP token redemption)
  - LP position tracking
  - Initial pool creation

- **Balance Display**:
  - Real-time $BAL and STRK balances
  - Auto-refresh functionality
  - Formatted number display

- **Pool Statistics**:
  - Reserve amounts (STRK/BAL)
  - Current price ratio
  - Total liquidity tracking
  - Price impact calculations

## 🎮 Usage Instructions

### 1. Connect Wallet
- Install Argent X or Braavos wallet extension
- Click "Connect Wallet" in the top-right corner
- Approve the connection in your wallet

### 2. Get Test Tokens
- The deployer account automatically receives 1000 $BAL tokens
- Use Starknet devnet faucet for STRK tokens
- Or use the mock balances for testing

### 3. Initialize Liquidity Pool
- Go to "Liquidity" tab
- Enter STRK amount (e.g., 10 STRK)
- BAL amount will auto-calculate (e.g., 100 BAL for 1:10 ratio)
- Click "Add Liquidity" to initialize the pool

### 4. Trade Tokens
- Go to "Swap" tab
- Enter amount to swap
- Review price impact and slippage
- Click "Swap" to execute trade
- Approve token spending when prompted

### 5. Manage Liquidity
- Add more liquidity proportionally
- Remove liquidity by redeeming LP tokens
- Monitor your position and earnings

## 🧪 Testing

### Manual Testing Checklist

1. **Wallet Connection**:
   - [ ] Connect wallet successfully
   - [ ] Display correct address
   - [ ] Disconnect wallet

2. **Contract Deployment**:
   - [ ] Deploy contracts successfully
   - [ ] Verify contract addresses
   - [ ] Check initial token balances

3. **Liquidity Management**:
   - [ ] Initialize pool with init()
   - [ ] Add proportional liquidity
   - [ ] Remove liquidity and receive tokens
   - [ ] Track LP token balance

4. **Token Swapping**:
   - [ ] Swap STRK → BAL
   - [ ] Swap BAL → STRK
   - [ ] Verify slippage calculations
   - [ ] Check balance updates

5. **AMM Formula**:
   - [ ] Verify 0.3% fee application
   - [ ] Check x*y=k invariant
   - [ ] Test price impact calculations

## 🌐 Deployment to Testnet

### Sepolia Testnet Deployment

1. **Configure environment**:
```bash
# Create .env file with your testnet credentials
ACCOUNT_ADDRESS=your_testnet_address
PRIVATE_KEY=your_private_key
```

2. **Get testnet tokens**:
   - Get STRK tokens from Starknet Sepolia faucet
   - Fund your deployment account

3. **Deploy to testnet**:
```bash
npm run deploy:sepolia
```

4. **Update frontend config**:
   - Update RPC URL to Sepolia endpoint
   - Update contract addresses in frontend

## 📝 Additional Features

### Side Quests Completed

- ✅ **Event Handling**: All major contract events are emitted
- ✅ **Error Handling**: Comprehensive error handling and user feedback
- ✅ **Fee Implementation**: 0.3% trading fee correctly implemented
- ✅ **Slippage Protection**: Visual slippage warnings and calculations
- ✅ **LP Token Mechanics**: Proper liquidity provider token system

### Future Enhancements

- [ ] Advanced price charts and analytics
- [ ] Multi-pair support
- [ ] Governance token and voting
- [ ] Yield farming and staking
- [ ] MEV protection mechanisms

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install:all

# Start local blockchain
npm run chain

# Deploy contracts (local)
npm run deploy

# Deploy contracts (testnet)
npm run deploy:sepolia

# Start development servers
npm run dev

# Start backend only
npm run backend:dev

# Start frontend only
npm run frontend:dev

# Build for production
npm run build

# Compile Cairo contracts
cd contracts && scarb build
```

## 🔍 Troubleshooting

### Common Issues

1. **Contracts not found**:
   - Ensure contracts are compiled: `cd contracts && scarb build`
   - Deploy contracts: `npm run deploy`

2. **Wallet connection fails**:
   - Install Argent X or Braavos extension
   - Refresh the page and try again
   - Check browser console for errors

3. **Transaction failures**:
   - Ensure sufficient balance for gas
   - Check token approvals
   - Verify contract addresses

4. **Balance not updating**:
   - Click "Refresh Balances" button
   - Check if transactions are confirmed
   - Verify wallet connection

## 📚 Resources

- [Starknet Documentation](https://docs.starknet.io/)
- [Cairo Book](https://book.cairo-lang.org/)
- [Scaffold-Stark](https://scaffoldstark.com/)
- [Material-UI Documentation](https://mui.com/)

## 🎉 Congratulations!

You now have a fully functional DEX with:
- ✅ Wallet connection
- ✅ Token balance viewing
- ✅ AMM-based token swapping
- ✅ Liquidity provision/removal
- ✅ Real-time price calculations
- ✅ Modern React interface
- ✅ Smart contract deployment

The DEX is ready for testing, trading, and further development! 🚀
