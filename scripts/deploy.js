const { Provider, Account, Contract, json, CallData, RpcProvider, stark } = require('starknet');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deploy() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const isTestnet = args.includes('--network') && args[args.indexOf('--network') + 1] === 'sepolia';
        
        console.log(`Deploying to ${isTestnet ? 'Sepolia testnet' : 'local devnet'}...`);

        // Initialize provider
        const provider = isTestnet ? 
            new RpcProvider({ nodeUrl: 'https://starknet-sepolia.public.blastapi.io' }) :
            new RpcProvider({ nodeUrl: 'http://localhost:5050' });

        // Account setup
        let account;
        if (isTestnet) {
            if (!process.env.ACCOUNT_ADDRESS || !process.env.PRIVATE_KEY) {
                throw new Error('ACCOUNT_ADDRESS and PRIVATE_KEY must be set for testnet deployment');
            }
            account = new Account(provider, process.env.ACCOUNT_ADDRESS, process.env.PRIVATE_KEY);
        } else {
            // Use default devnet account
            const address = "0x517ececd29116499f4a1b64b094da79ba08dfd54a3edaa316134c41f8160973";
            const privateKey = "0x1800000000300000180000000000030000000000003006001800006600";
            account = new Account(provider, address, privateKey);
        }

        console.log('Account address:', account.address);

        // Read compiled contracts
        const contractsPath = path.join(__dirname, '..', 'contracts', 'target', 'dev');
        
        // Check if contracts are compiled
        if (!fs.existsSync(contractsPath)) {
            console.log('Contracts not compiled. Compiling...');
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);
            
            try {
                await execPromise('cd contracts && scarb build');
                console.log('Contracts compiled successfully');
            } catch (error) {
                console.error('Failed to compile contracts:', error);
                return;
            }
        }

        const balloonsContractPath = path.join(contractsPath, 'dex_challenge_Balloons.contract_class.json');
        const dexContractPath = path.join(contractsPath, 'dex_challenge_DEX.contract_class.json');

        if (!fs.existsSync(balloonsContractPath) || !fs.existsSync(dexContractPath)) {
            throw new Error('Contract files not found. Make sure to compile contracts first with: cd contracts && scarb build');
        }

        const balloonsContract = json.parse(fs.readFileSync(balloonsContractPath).toString('ascii'));
        const dexContract = json.parse(fs.readFileSync(dexContractPath).toString('ascii'));

        console.log('Deploying Balloons contract...');
        
        // Deploy Balloons contract
        const balloonsDeployResponse = await account.deployContract({
            classHash: balloonsContract.class_hash,
            constructorCalldata: CallData.compile({ owner: account.address })
        });

        console.log('Balloons contract deployed at:', balloonsDeployResponse.contract_address);

        // Wait for deployment
        await provider.waitForTransaction(balloonsDeployResponse.transaction_hash);
        console.log('Balloons deployment confirmed');

        console.log('Deploying DEX contract...');

        // Deploy DEX contract
        const dexDeployResponse = await account.deployContract({
            classHash: dexContract.class_hash,
            constructorCalldata: CallData.compile({ token_address: balloonsDeployResponse.contract_address })
        });

        console.log('DEX contract deployed at:', dexDeployResponse.contract_address);

        // Wait for deployment
        await provider.waitForTransaction(dexDeployResponse.transaction_hash);
        console.log('DEX deployment confirmed');

        // Save contract addresses
        const contractAddresses = {
            balloons: balloonsDeployResponse.contract_address,
            dex: dexDeployResponse.contract_address,
            network: isTestnet ? 'sepolia' : 'devnet',
            deployedAt: new Date().toISOString()
        };

        const addressesPath = path.join(__dirname, 'contract-addresses.json');
        fs.writeFileSync(addressesPath, JSON.stringify(contractAddresses, null, 2));

        console.log('\\n=== Deployment Summary ===');
        console.log('Balloons Contract:', contractAddresses.balloons);
        console.log('DEX Contract:', contractAddresses.dex);
        console.log('Network:', contractAddresses.network);
        console.log('Contract addresses saved to:', addressesPath);

        // Update backend .env if it exists
        const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
        if (fs.existsSync(backendEnvPath)) {
            let envContent = fs.readFileSync(backendEnvPath, 'utf8');
            envContent = envContent.replace(/DEX_CONTRACT_ADDRESS=.*/, `DEX_CONTRACT_ADDRESS=${contractAddresses.dex}`);
            envContent = envContent.replace(/BALLOONS_CONTRACT_ADDRESS=.*/, `BALLOONS_CONTRACT_ADDRESS=${contractAddresses.balloons}`);
            fs.writeFileSync(backendEnvPath, envContent);
            console.log('Backend .env updated with contract addresses');
        }

        console.log('\\n=== Next Steps ===');
        console.log('1. Fund your account with STRK tokens');
        console.log('2. Approve DEX contract to spend BAL tokens');
        console.log('3. Initialize liquidity pool with init() function');
        console.log('4. Start the frontend: npm run frontend:dev');

    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

deploy();
