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
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`liquidity-tabpanel-${index}`}
      aria-labelledby={`liquidity-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const LiquidityInterface: React.FC = () => {
  const { account, isConnected, address } = useWallet();
  const { dexContract, balloonsContract } = useContracts();
  
  const [tabValue, setTabValue] = useState(0);
  const [strkAmount, setStrkAmount] = useState('');
  const [balAmount, setBalAmount] = useState('');
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [userLiquidity, setUserLiquidity] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchUserLiquidity = async () => {
    if (!dexContract || !address) return;

    try {
      const liquidity = await dexContract.get_liquidity(address);
      setUserLiquidity((parseInt(liquidity.toString()) / 1e18).toString());
    } catch (error) {
      console.error('Error fetching user liquidity:', error);
      setUserLiquidity('0');
    }
  };

  const calculateTokenAmount = async () => {
    if (!strkAmount || !dexContract || parseFloat(strkAmount) <= 0) {
      setBalAmount('');
      return;
    }

    try {
      const strkReserve = await dexContract.get_strk_reserve();
      const tokenReserve = await dexContract.get_token_reserve();
      
      const strkReserveNum = parseInt(strkReserve.toString()) / 1e18;
      const tokenReserveNum = parseInt(tokenReserve.toString()) / 1e18;
      
      if (strkReserveNum > 0) {
        const requiredTokens = (parseFloat(strkAmount) * tokenReserveNum) / strkReserveNum;
        setBalAmount(requiredTokens.toFixed(6));
      }
    } catch (error) {
      console.error('Error calculating token amount:', error);
      // Mock calculation for development
      setBalAmount((parseFloat(strkAmount) * 10).toString());
    }
  };

  const handleAddLiquidity = async () => {
    if (!account || !dexContract || !balloonsContract) {
      setError('Please connect your wallet and ensure contracts are loaded');
      return;
    }

    if (!strkAmount || !balAmount || parseFloat(strkAmount) <= 0 || parseFloat(balAmount) <= 0) {
      setError('Please enter valid amounts');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const strkAmountWei = (parseFloat(strkAmount) * 1e18).toString();
      const balAmountWei = (parseFloat(balAmount) * 1e18).toString();

      // First check if this is the initial liquidity provision
      const totalLiquidity = await dexContract.get_total_liquidity();
      
      if (parseInt(totalLiquidity.toString()) === 0) {
        // Initialize the pool
        await balloonsContract.approve(dexContract.address, balAmountWei);
        await dexContract.init(balAmountWei, strkAmountWei);
        setSuccess(`Successfully initialized pool with ${strkAmount} STRK and ${balAmount} BAL`);
      } else {
        // Add liquidity to existing pool
        await balloonsContract.approve(dexContract.address, balAmountWei);
        await dexContract.deposit(strkAmountWei);
        setSuccess(`Successfully added ${strkAmount} STRK and ${balAmount} BAL to the pool`);
      }

      // Reset form and refresh user liquidity
      setStrkAmount('');
      setBalAmount('');
      await fetchUserLiquidity();

    } catch (error: any) {
      console.error('Add liquidity failed:', error);
      setError(error.message || 'Failed to add liquidity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!account || !dexContract) {
      setError('Please connect your wallet and ensure contracts are loaded');
      return;
    }

    if (!liquidityAmount || parseFloat(liquidityAmount) <= 0) {
      setError('Please enter a valid liquidity amount');
      return;
    }

    if (parseFloat(liquidityAmount) > parseFloat(userLiquidity)) {
      setError('Insufficient liquidity balance');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const liquidityAmountWei = (parseFloat(liquidityAmount) * 1e18).toString();
      
      const result = await dexContract.withdraw(liquidityAmountWei);
      setSuccess(`Successfully removed ${liquidityAmount} liquidity from the pool`);

      // Reset form and refresh user liquidity
      setLiquidityAmount('');
      await fetchUserLiquidity();

    } catch (error: any) {
      console.error('Remove liquidity failed:', error);
      setError(error.message || 'Failed to remove liquidity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && dexContract) {
      fetchUserLiquidity();
    }
  }, [isConnected, dexContract, address]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateTokenAmount();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [strkAmount, dexContract]);

  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Please connect your wallet to manage liquidity.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Manage Liquidity
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Your Liquidity Position
          </Typography>
          <Typography variant="h6">
            {parseFloat(userLiquidity).toFixed(6)} LP Tokens
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Add Liquidity" />
          <Tab label="Remove Liquidity" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Add liquidity to earn 0.3% of all trades proportional to your share of the pool.
          </Typography>

          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              STRK Amount
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="0.0"
              value={strkAmount}
              onChange={(e) => setStrkAmount(e.target.value)}
              type="number"
            />
          </Box>

          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              BAL Amount (Auto-calculated)
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="0.0"
              value={balAmount}
              InputProps={{ readOnly: true }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleAddLiquidity}
            disabled={loading || !strkAmount || !balAmount}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Adding Liquidity...' : 'Add Liquidity'}
          </Button>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Remove your liquidity position and receive STRK and BAL tokens back.
          </Typography>

          <Box mb={3}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Liquidity Amount
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="0.0"
              value={liquidityAmount}
              onChange={(e) => setLiquidityAmount(e.target.value)}
              type="number"
              helperText={`Available: ${parseFloat(userLiquidity).toFixed(6)} LP tokens`}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleRemoveLiquidity}
            disabled={loading || !liquidityAmount || parseFloat(userLiquidity) === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <Remove />}
            color="secondary"
          >
            {loading ? 'Removing Liquidity...' : 'Remove Liquidity'}
          </Button>
        </Box>
      </TabPanel>

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

export default LiquidityInterface;
