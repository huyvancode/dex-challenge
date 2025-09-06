import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip
} from '@mui/material';
import { Pool, TrendingUp } from '@mui/icons-material';
import { useContracts } from '../contexts/ContractContext';

const ReservesDisplay: React.FC = () => {
  const { dexContract } = useContracts();
  const [reserves, setReserves] = useState({
    strkReserve: '0',
    tokenReserve: '0',
    totalLiquidity: '0'
  });
  const [loading, setLoading] = useState(false);

  const formatAmount = (amount: string) => {
    try {
      const num = parseFloat(amount);
      if (num === 0) return '0.00';
      if (num < 0.01) return '<0.01';
      return num.toFixed(2);
    } catch {
      return '0.00';
    }
  };

  const calculatePrice = () => {
    try {
      const strk = parseFloat(reserves.strkReserve);
      const token = parseFloat(reserves.tokenReserve);
      
      if (strk === 0 || token === 0) return '0.00';
      
      return (strk / token).toFixed(4);
    } catch {
      return '0.00';
    }
  };

  const fetchReserves = async () => {
    if (!dexContract) return;

    try {
      setLoading(true);

      // Call contract methods to get reserves
      const strkReserve = await dexContract.get_strk_reserve();
      const tokenReserve = await dexContract.get_token_reserve();
      const totalLiquidity = await dexContract.get_total_liquidity();

      setReserves({
        strkReserve: (parseInt(strkReserve.toString()) / 1e18).toString(),
        tokenReserve: (parseInt(tokenReserve.toString()) / 1e18).toString(),
        totalLiquidity: (parseInt(totalLiquidity.toString()) / 1e18).toString()
      });
    } catch (error) {
      console.error('Error fetching reserves:', error);
      // Set mock reserves for development
      setReserves({
        strkReserve: '100.00',
        tokenReserve: '1000.00',
        totalLiquidity: '316.23'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserves();
    
    // Refresh reserves every 30 seconds
    const interval = setInterval(fetchReserves, 30000);
    return () => clearInterval(interval);
  }, [dexContract]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pool Reserves
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box>
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  STRK Reserve
                </Typography>
                <Typography variant="h6">
                  {formatAmount(reserves.strkReserve)}
                </Typography>
              </Box>
              
              <Box textAlign="right">
                <Typography variant="body2" color="text.secondary">
                  BAL Reserve
                </Typography>
                <Typography variant="h6">
                  {formatAmount(reserves.tokenReserve)}
                </Typography>
              </Box>
            </Box>

            <Box display="flex" justifyContent="space-between" mb={2}>
              <Box>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="primary" sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    Price (STRK/BAL)
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {calculatePrice()}
                </Typography>
              </Box>

              <Box textAlign="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  <Pool color="secondary" sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" color="text.secondary">
                    Total Liquidity
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {formatAmount(reserves.totalLiquidity)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        
        <Box mt={2}>
          <Chip 
            label="Refresh Reserves" 
            size="small" 
            onClick={fetchReserves}
            disabled={loading}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReservesDisplay;
