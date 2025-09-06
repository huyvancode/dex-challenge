import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import { WalletProvider } from './contexts/WalletContext';
import { ContractProvider } from './contexts/ContractContext';
import WalletConnection from './components/WalletConnection';
import DEXInterface from './components/DEXInterface';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WalletProvider>
        <ContractProvider>
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                  🎈 DEX Challenge - $BAL ↔ STRK
                </Typography>
                <WalletConnection />
              </Toolbar>
            </AppBar>
            
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
              <DEXInterface />
            </Container>
          </Box>
        </ContractProvider>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
