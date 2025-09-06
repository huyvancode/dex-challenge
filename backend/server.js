const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Provider, Contract, Account, ec, json, CallData } = require('starknet');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Starknet provider
const provider = new Provider({
  sequencer: {
    baseUrl: process.env.STARKNET_RPC_URL || 'http://localhost:5050'
  }
});

// Contract addresses (will be updated after deployment)
let contractAddresses = {
  dex: process.env.DEX_CONTRACT_ADDRESS || '',
  balloons: process.env.BALLOONS_CONTRACT_ADDRESS || ''
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get contract addresses
app.get('/api/contracts', (req, res) => {
  res.json(contractAddresses);
});

// Update contract addresses (for development)
app.post('/api/contracts', (req, res) => {
  const { dex, balloons } = req.body;
  if (dex) contractAddresses.dex = dex;
  if (balloons) contractAddresses.balloons = balloons;
  res.json({ success: true, contracts: contractAddresses });
});

// Get token balance
app.post('/api/balance', async (req, res) => {
  try {
    const { tokenAddress, walletAddress } = req.body;
    
    if (!tokenAddress || !walletAddress) {
      return res.status(400).json({ error: 'Missing tokenAddress or walletAddress' });
    }

    // For now, return mock data - will be implemented with actual contract calls
    const balance = '0';
    
    res.json({ balance });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Get DEX reserves
app.get('/api/reserves', async (req, res) => {
  try {
    if (!contractAddresses.dex) {
      return res.status(400).json({ error: 'DEX contract not deployed' });
    }

    // For now, return mock data - will be implemented with actual contract calls
    const reserves = {
      strkReserve: '0',
      tokenReserve: '0',
      totalLiquidity: '0'
    };
    
    res.json(reserves);
  } catch (error) {
    console.error('Error getting reserves:', error);
    res.status(500).json({ error: 'Failed to get reserves' });
  }
});

// Calculate swap output (price)
app.post('/api/calculate-swap', async (req, res) => {
  try {
    const { inputAmount, isStrkToToken } = req.body;
    
    if (!inputAmount) {
      return res.status(400).json({ error: 'Missing inputAmount' });
    }

    // AMM formula: xInputWithFee = xInput * 997
    // yOutput = (yReserves * xInputWithFee) / (xReserves * 1000 + xInputWithFee)
    
    // For now, return mock calculation - will be implemented with actual reserves
    const outputAmount = '0';
    const priceImpact = '0';
    
    res.json({ outputAmount, priceImpact });
  } catch (error) {
    console.error('Error calculating swap:', error);
    res.status(500).json({ error: 'Failed to calculate swap' });
  }
});

// Get network info
app.get('/api/network', async (req, res) => {
  try {
    const chainId = await provider.getChainId();
    res.json({ 
      chainId,
      rpcUrl: process.env.STARKNET_RPC_URL || 'http://localhost:5050',
      networkName: chainId === '0x534e5f4d41494e' ? 'mainnet' : 'devnet'
    });
  } catch (error) {
    console.error('Error getting network info:', error);
    res.status(500).json({ error: 'Failed to get network info' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`DEX Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
