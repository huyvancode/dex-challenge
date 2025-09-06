import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import { AccountBalance, Token } from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';

const BalanceDisplay: React.FC = () => {
  const { address, isConnected } = useWallet();
  const { balloonsContract, provider } = useContracts();
  const [balances, setBalances] = useState({
    bal: '0',
    strk: '0'
  });
  const [loading, setLoading] = useState(false);

  const formatBalance = (balance: string) => {
    try {
      const num = parseFloat(balance);
      if (num === 0) return '0.00';
      if (num < 0.01) return '<0.01';
      return num.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const fetchBalances = async () => {
    if (!isConnected || !address || !balloonsContract) return;

    try {
      setLoading(true);

      // Get BAL balance
      const balBalance = await balloonsContract.balance_of(address);
      
      // Get STRK balance (mock for now)
      // const strkBalance = await provider.getBalance(address);

      setBalances({
        bal: (parseInt(balBalance.balance.low) / 1e18).toString(),
        strk: '10.00' // Mock STRK balance
      });
    } catch (error) {
      console.error('Error fetching balances:', error);
      // Set mock balances for development
      setBalances({
        bal: '1000.00',
        strk: '10.00'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    
    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [isConnected, address, balloonsContract]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Balances
          </Typography>
          <Typography color="text.secondary">
            Connect wallet to view balances
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Your Balances
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box display="flex" justifyContent="space-between">
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Token color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  BAL
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatBalance(balances.bal)}
              </Typography>
            </Box>
            
            <Box textAlign="right">
              <Box display="flex" alignItems="center" mb={1}>
                <AccountBalance color="secondary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  STRK
                </Typography>
              </Box>
              <Typography variant="h6">
                {formatBalance(balances.strk)}
              </Typography>
            </Box>
          </Box>
        )}
        
        <Box mt={2}>
          <Chip 
            label="Refresh Balances" 
            size="small" 
            onClick={fetchBalances}
            disabled={loading}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default BalanceDisplay;
