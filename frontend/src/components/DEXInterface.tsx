import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { useWallet } from '../contexts/WalletContext';
import { useContracts } from '../contexts/ContractContext';
import SwapInterface from './SwapInterface';
import LiquidityInterface from './LiquidityInterface';
import BalanceDisplay from './BalanceDisplay';
import ReservesDisplay from './ReservesDisplay';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DEXInterface: React.FC = () => {
  const { isConnected, address } = useWallet();
  const { contractAddresses, isLoading } = useContracts();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading contracts...</Typography>
      </Box>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            Please connect your Starknet wallet to use the DEX.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!contractAddresses) {
    return (
      <Card>
        <CardContent>
          <Alert severity="warning">
            Contracts not deployed. Please run the deployment script first:
            <br />
            <code>npm run deploy</code>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            🎈 Balloons DEX
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Trade $BAL ↔ STRK with our automated market maker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connected: {address}
          </Typography>
        </CardContent>
      </Card>

      {/* Stats Section */}
      <Box display="flex" gap={3} sx={{ mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Box flex={1}>
          <BalanceDisplay />
        </Box>
        <Box flex={1}>
          <ReservesDisplay />
        </Box>
      </Box>

      {/* Main Interface */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="DEX tabs">
            <Tab label="Swap" />
            <Tab label="Liquidity" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <SwapInterface />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <LiquidityInterface />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default DEXInterface;
