# DEX Challenge

A decentralized exchange (DEX) for trading ERC20 BALLOONS ($BAL) ↔ STRK on Starknet.

## Features

- Connect wallets (Argent X, Braavos)
- View token balances ($BAL and STRK)
- Swap $BAL and STRK using AMM formula (x * y = k)
- Add/remove liquidity
- 0.3% trading fee
- Slippage visualization

## Project Structure

```
dex-challenge/
├── contracts/          # Cairo smart contracts
│   ├── src/
│   │   ├── dex.cairo      # Main DEX contract
│   │   ├── balloons.cairo # ERC20 token contract
│   │   └── lib.cairo      # Module declarations
│   └── Scarb.toml         # Cairo project config
├── backend/           # Express.js API server
├── frontend/          # React.js web application
└── scripts/           # Deployment and utility scripts
```

## Prerequisites

- Node.js (≥ v18.17)
- npm
- Git
- Rust
- Cairo 1.0
- Starknet-devnet v0.4.0

## Quick Start

1. Install dependencies:
```bash
npm run install:all
```

2. Start local Starknet devnet:
```bash
npm run chain
```

3. Deploy contracts:
```bash
npm run deploy
```

4. Start development servers:
```bash
npm run dev
```

5. Open http://localhost:3000

## Deployment

### Local Devnet
```bash
npm run deploy
```

### Sepolia Testnet
```bash
npm run deploy:sepolia
```

## Usage

1. Connect your Starknet wallet
2. Get test tokens from faucet
3. Approve DEX contract to spend your tokens
4. Initialize liquidity pool
5. Start trading!

## AMM Formula

The DEX uses the constant product formula:
- `x * y = k` where x and y are reserve amounts
- 0.3% fee: `xInputWithFee = xInput * 997`
- Output: `yOutput = (yReserves * xInputWithFee) / (xReserves * 1000 + xInputWithFee)`

## License

MIT
