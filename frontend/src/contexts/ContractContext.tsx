import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Contract, Provider, RpcProvider } from 'starknet';
import { useWallet } from './WalletContext';

interface ContractAddresses {
  dex: string;
  balloons: string;
}

interface ContractContextType {
  dexContract: Contract | null;
  balloonsContract: Contract | null;
  provider: Provider;
  contractAddresses: ContractAddresses | null;
  isLoading: boolean;
  loadContracts: () => Promise<void>;
}

const ContractContext = createContext<ContractContextType | undefined>(undefined);

interface ContractProviderProps {
  children: ReactNode;
}

// ABI definitions (simplified - in production, load from files)
const ERC20_ABI = [
  {
    "name": "balance_of",
    "type": "function",
    "inputs": [{"name": "account", "type": "felt"}],
    "outputs": [{"name": "balance", "type": "Uint256"}],
    "state_mutability": "view"
  },
  {
    "name": "transfer",
    "type": "function",
    "inputs": [
      {"name": "recipient", "type": "felt"},
      {"name": "amount", "type": "Uint256"}
    ],
    "outputs": [{"name": "success", "type": "felt"}],
    "state_mutability": "external"
  },
  {
    "name": "approve",
    "type": "function",
    "inputs": [
      {"name": "spender", "type": "felt"},
      {"name": "amount", "type": "Uint256"}
    ],
    "outputs": [{"name": "success", "type": "felt"}],
    "state_mutability": "external"
  }
];

const DEX_ABI = [
  {
    "name": "init",
    "type": "function",
    "inputs": [
      {"name": "tokens", "type": "Uint256"},
      {"name": "strk", "type": "Uint256"}
    ],
    "outputs": [{"name": "liquidity", "type": "Uint256"}],
    "state_mutability": "external"
  },
  {
    "name": "strk_to_token",
    "type": "function",
    "inputs": [{"name": "strk_amount", "type": "Uint256"}],
    "outputs": [{"name": "tokens_bought", "type": "Uint256"}],
    "state_mutability": "external"
  },
  {
    "name": "token_to_strk",
    "type": "function",
    "inputs": [{"name": "token_amount", "type": "Uint256"}],
    "outputs": [{"name": "strk_bought", "type": "Uint256"}],
    "state_mutability": "external"
  },
  {
    "name": "get_strk_reserve",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "reserve", "type": "Uint256"}],
    "state_mutability": "view"
  },
  {
    "name": "get_token_reserve",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "reserve", "type": "Uint256"}],
    "state_mutability": "view"
  },
  {
    "name": "price",
    "type": "function",
    "inputs": [
      {"name": "x_input", "type": "Uint256"},
      {"name": "x_reserve", "type": "Uint256"},
      {"name": "y_reserve", "type": "Uint256"}
    ],
    "outputs": [{"name": "y_output", "type": "Uint256"}],
    "state_mutability": "view"
  }
];

export const ContractProvider: React.FC<ContractProviderProps> = ({ children }) => {
  const [dexContract, setDexContract] = useState<Contract | null>(null);
  const [balloonsContract, setBalloonsContract] = useState<Contract | null>(null);
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { account } = useWallet();

  // Initialize provider
  const provider = new RpcProvider({
    nodeUrl: process.env.REACT_APP_STARKNET_RPC_URL || 'http://localhost:5050'
  });

  const loadContracts = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch contract addresses from backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001'}/api/contracts`);
      const addresses = await response.json();
      
      if (addresses.dex && addresses.balloons) {
        setContractAddresses(addresses);
        
        // Create contract instances
        const dex = new Contract(DEX_ABI, addresses.dex, account || provider);
        const balloons = new Contract(ERC20_ABI, addresses.balloons, account || provider);
        
        setDexContract(dex);
        setBalloonsContract(balloons);
        
        console.log('Contracts loaded:', addresses);
      } else {
        console.log('Contract addresses not available. Please deploy contracts first.');
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [account]);

  const value: ContractContextType = {
    dexContract,
    balloonsContract,
    provider,
    contractAddresses,
    isLoading,
    loadContracts,
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = (): ContractContextType => {
  const context = useContext(ContractContext);
  if (context === undefined) {
    throw new Error('useContracts must be used within a ContractProvider');
  }
  return context;
};
