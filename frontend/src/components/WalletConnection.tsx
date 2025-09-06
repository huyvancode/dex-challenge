import React, { useState } from 'react';
import {
  Button,
  Box,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { AccountBalanceWallet, ExitToApp } from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';

const WalletConnection: React.FC = () => {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      setError(null);
      await connectWallet();
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    handleMenuClose();
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <Box>
        <Button
          variant="outlined"
          onClick={handleMenuClick}
          startIcon={<AccountBalanceWallet />}
          sx={{ textTransform: 'none' }}
        >
          {formatAddress(address)}
        </Button>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => navigator.clipboard.writeText(address)}>
            Copy Address
          </MenuItem>
          <MenuItem onClick={handleDisconnect}>
            <ExitToApp sx={{ mr: 1 }} />
            Disconnect
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        variant="contained"
        onClick={handleConnect}
        disabled={isConnecting}
        startIcon={isConnecting ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
        sx={{ textTransform: 'none' }}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

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
    </Box>
  );
};

export default WalletConnection;
