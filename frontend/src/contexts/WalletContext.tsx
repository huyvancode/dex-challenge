import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AccountInterface } from 'starknet';

interface WalletContextType {
  account: AccountInterface | null;
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Check if window.starknet exists (injected by wallet)
      if (typeof window !== 'undefined' && (window as any).starknet) {
        const starknet = (window as any).starknet;
        
        // Enable the wallet
        const accounts = await starknet.enable();
        
        if (accounts && accounts.length > 0) {
          setAccount(starknet.account);
          setAddress(accounts[0]);
          setIsConnected(true);
          
          console.log('Wallet connected:', accounts[0]);
        } else {
          throw new Error('No accounts found');
        }
      } else {
        throw new Error('Starknet wallet not found. Please install Argent X or Braavos wallet extension.');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setAddress(null);
    setIsConnected(false);
    console.log('Wallet disconnected');
  };

  const value: WalletContextType = {
    account,
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
