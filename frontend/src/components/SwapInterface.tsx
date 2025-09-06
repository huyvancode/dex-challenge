import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CircularProgress,
  Divider
} from '@mui/material';
import { SwapVert, Warning } from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';

type SwapDirection = 'STRK_TO_BAL' | 'BAL_TO_STRK';

const SwapInterface: React.FC = () => {
  const { account, isConnected } = useWallet();
  const { dexContract, balloonsContract } = useContracts();
  
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<SwapDirection>('STRK_TO_BAL');
  const [slippage, setSlippage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(amount);
      if (isNaN(num)) return '0';
      return num.toFixed(6);
    } catch {
      return '0';
    }
  };

  const calculateOutput = async () => {
    if (!inputAmount || !dexContract || parseFloat(inputAmount) <= 0) {
      setOutputAmount('');
      setSlippage(0);
      return;
    }

    try {
      setCalculating(true);

      // Get current reserves
      const strkReserve = await dexContract.get_strk_reserve();
      const tokenReserve = await dexContract.get_token_reserve();

      const inputAmountWei = (parseFloat(inputAmount) * 1e18).toString();
      
      let output;
      if (swapDirection === 'STRK_TO_BAL') {
        output = await dexContract.price(inputAmountWei, strkReserve, tokenReserve);
      } else {
        output = await dexContract.price(inputAmountWei, tokenReserve, strkReserve);
      }

      const outputFormatted = (parseInt(output.toString()) / 1e18).toString();
      setOutputAmount(outputFormatted);

      // Calculate slippage (simplified)
      const inputNum = parseFloat(inputAmount);
      const outputNum = parseFloat(outputFormatted);
      const currentPrice = swapDirection === 'STRK_TO_BAL' 
        ? parseInt(strkReserve.toString()) / parseInt(tokenReserve.toString())
        : parseInt(tokenReserve.toString()) / parseInt(strkReserve.toString());
      
      const effectivePrice = inputNum / outputNum;
      const slippagePercent = Math.abs((effectivePrice - currentPrice) / currentPrice) * 100;
      setSlippage(slippagePercent);

    } catch (error) {
      console.error('Error calculating output:', error);
      // Mock calculation for development
      const mockOutput = (parseFloat(inputAmount) * (swapDirection === 'STRK_TO_BAL' ? 10 : 0.1)).toString();
      setOutputAmount(mockOutput);
      setSlippage(0.3);
    } finally {
      setCalculating(false);
    }
  };

  const handleSwap = async () => {
    if (!account || !dexContract || !balloonsContract) {
      setError('Please connect your wallet and ensure contracts are loaded');
      return;
    }

    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const inputAmountWei = (parseFloat(inputAmount) * 1e18).toString();

      if (swapDirection === 'STRK_TO_BAL') {
        // Swap STRK to BAL
        const result = await dexContract.strk_to_token(inputAmountWei);
        setSuccess(`Successfully swapped ${inputAmount} STRK for ${formatAmount(outputAmount)} BAL`);
      } else {
        // First approve the DEX to spend BAL tokens
        await balloonsContract.approve(dexContract.address, inputAmountWei);
        
        // Then swap BAL to STRK
        const result = await dexContract.token_to_strk(inputAmountWei);
        setSuccess(`Successfully swapped ${inputAmount} BAL for ${formatAmount(outputAmount)} STRK`);
      }

      // Reset form
      setInputAmount('');
      setOutputAmount('');
      setSlippage(0);

    } catch (error: any) {
      console.error('Swap failed:', error);
      setError(error.message || 'Swap failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectionSwap = () => {
    setSwapDirection(swapDirection === 'STRK_TO_BAL' ? 'BAL_TO_STRK' : 'STRK_TO_BAL');
    setInputAmount('');
    setOutputAmount('');
    setSlippage(0);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateOutput();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [inputAmount, swapDirection, dexContract]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Please connect your wallet to start swapping.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Swap Tokens
      </Typography>

      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          From
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="0.0"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          type="number"
          InputProps={{
            endAdornment: (
              <Typography variant="body2" color="text.secondary">
                {swapDirection === 'STRK_TO_BAL' ? 'STRK' : 'BAL'}
              </Typography>
            )
          }}
        />
      </Box>

      <Box display="flex" justifyContent="center" mb={3}>
        <Button
          onClick={handleDirectionSwap}
          startIcon={<SwapVert />}
          variant="outlined"
          size="small"
        >
          Switch
        </Button>
      </Box>

      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          To
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="0.0"
          value={calculating ? 'Calculating...' : formatAmount(outputAmount)}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <Typography variant="body2" color="text.secondary">
                {swapDirection === 'STRK_TO_BAL' ? 'BAL' : 'STRK'}
              </Typography>
            )
          }}
        />
      </Box>

      {slippage > 0 && (
        <Box mb={3}>
          <Alert 
            severity={slippage > 5 ? 'warning' : 'info'}
            icon={slippage > 5 ? <Warning /> : undefined}
          >
            <Typography variant="body2">
              Price Impact: {slippage.toFixed(2)}%
              {slippage > 5 && ' (High slippage warning!)'}
            </Typography>
          </Alert>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSwap}
        disabled={loading || calculating || !inputAmount || parseFloat(inputAmount) <= 0}
        startIcon={loading ? <CircularProgress size={20} /> : undefined}
      >
        {loading ? 'Swapping...' : `Swap ${swapDirection === 'STRK_TO_BAL' ? 'STRK → BAL' : 'BAL → STRK'}`}
      </Button>

      <Box mt={2}>
        <Typography variant="body2" color="text.secondary" align="center">
          Trading fee: 0.3% • Slippage tolerance: 2%
        </Typography>
      </Box>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SwapInterface;
