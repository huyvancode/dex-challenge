#[starknet::contract]
mod DEX {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use starknet::syscalls::call_contract_syscall;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};

    #[storage]
    struct Storage {
        // Token contract address (Balloons)
        token: ContractAddress,
        // Total liquidity in the pool
        total_liquidity: u256,
        // Individual liquidity balances
        liquidity: LegacyMap<ContractAddress, u256>,
        // STRK reserves
        strk_reserve: u256,
        // Token reserves
        token_reserve: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        LiquidityAdded: LiquidityAdded,
        LiquidityRemoved: LiquidityRemoved,
        TokensPurchased: TokensPurchased,
        StrkPurchased: StrkPurchased,
    }

    #[derive(Drop, starknet::Event)]
    struct LiquidityAdded {
        #[key]
        provider: ContractAddress,
        strk_amount: u256,
        token_amount: u256,
        liquidity_minted: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct LiquidityRemoved {
        #[key]
        provider: ContractAddress,
        strk_amount: u256,
        token_amount: u256,
        liquidity_burned: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct TokensPurchased {
        #[key]
        buyer: ContractAddress,
        strk_amount: u256,
        token_amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct StrkPurchased {
        #[key]
        buyer: ContractAddress,
        token_amount: u256,
        strk_amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, token_address: ContractAddress) {
        self.token.write(token_address);
        self.total_liquidity.write(0);
        self.strk_reserve.write(0);
        self.token_reserve.write(0);
    }

    #[abi(embed_v0)]
    impl DEXImpl of super::IDEX<ContractState> {
        fn init(ref self: ContractState, tokens: u256, strk: u256) -> u256 {
            assert(self.total_liquidity.read() == 0, 'DEX: already initialized');
            assert(tokens > 0 && strk > 0, 'DEX: amounts must be > 0');

            let caller = get_caller_address();
            let token_contract = IERC20Dispatcher { contract_address: self.token.read() };

            // Transfer tokens from caller to this contract
            let success = token_contract.transfer_from(caller, get_contract_address(), tokens);
            assert(success, 'DEX: token transfer failed');

            // Store reserves
            self.strk_reserve.write(strk);
            self.token_reserve.write(tokens);

            // Initial liquidity = sqrt(strk * tokens)
            let initial_liquidity = sqrt(strk * tokens);
            self.total_liquidity.write(initial_liquidity);
            self.liquidity.write(caller, initial_liquidity);

            self.emit(LiquidityAdded {
                provider: caller,
                strk_amount: strk,
                token_amount: tokens,
                liquidity_minted: initial_liquidity
            });

            initial_liquidity
        }

        fn price(
            self: @ContractState,
            x_input: u256,
            x_reserve: u256,
            y_reserve: u256
        ) -> u256 {
            assert(x_input > 0, 'DEX: input must be > 0');
            assert(x_reserve > 0 && y_reserve > 0, 'DEX: invalid reserves');

            // Apply 0.3% fee: xInputWithFee = xInput * 997
            let x_input_with_fee = x_input * 997;
            
            // yOutput = (yReserves * xInputWithFee) / (xReserves * 1000 + xInputWithFee)
            let numerator = y_reserve * x_input_with_fee;
            let denominator = x_reserve * 1000 + x_input_with_fee;
            
            numerator / denominator
        }

        fn strk_to_token(ref self: ContractState, strk_amount: u256) -> u256 {
            assert(strk_amount > 0, 'DEX: STRK amount must be > 0');
            
            let strk_reserve = self.strk_reserve.read();
            let token_reserve = self.token_reserve.read();
            
            let tokens_bought = self.price(strk_amount, strk_reserve, token_reserve);
            assert(tokens_bought > 0, 'DEX: insufficient output');

            let caller = get_caller_address();
            let token_contract = IERC20Dispatcher { contract_address: self.token.read() };

            // Transfer tokens to buyer
            let success = token_contract.transfer(caller, tokens_bought);
            assert(success, 'DEX: token transfer failed');

            // Update reserves
            self.strk_reserve.write(strk_reserve + strk_amount);
            self.token_reserve.write(token_reserve - tokens_bought);

            self.emit(TokensPurchased {
                buyer: caller,
                strk_amount,
                token_amount: tokens_bought
            });

            tokens_bought
        }

        fn token_to_strk(ref self: ContractState, token_amount: u256) -> u256 {
            assert(token_amount > 0, 'DEX: token amount must be > 0');
            
            let strk_reserve = self.strk_reserve.read();
            let token_reserve = self.token_reserve.read();
            
            let strk_bought = self.price(token_amount, token_reserve, strk_reserve);
            assert(strk_bought > 0, 'DEX: insufficient output');

            let caller = get_caller_address();
            let token_contract = IERC20Dispatcher { contract_address: self.token.read() };

            // Transfer tokens from caller
            let success = token_contract.transfer_from(caller, get_contract_address(), token_amount);
            assert(success, 'DEX: token transfer failed');

            // Update reserves
            self.strk_reserve.write(strk_reserve - strk_bought);
            self.token_reserve.write(token_reserve + token_amount);

            self.emit(StrkPurchased {
                buyer: caller,
                token_amount,
                strk_amount: strk_bought
            });

            strk_bought
        }

        fn deposit(ref self: ContractState, strk_amount: u256) -> u256 {
            assert(strk_amount > 0, 'DEX: STRK amount must be > 0');

            let total_liquidity = self.total_liquidity.read();
            assert(total_liquidity > 0, 'DEX: no liquidity');

            let strk_reserve = self.strk_reserve.read();
            let token_reserve = self.token_reserve.read();

            // Calculate token amount to deposit proportionally
            let token_amount = (strk_amount * token_reserve) / strk_reserve;
            
            let caller = get_caller_address();
            let token_contract = IERC20Dispatcher { contract_address: self.token.read() };

            // Transfer tokens from caller
            let success = token_contract.transfer_from(caller, get_contract_address(), token_amount);
            assert(success, 'DEX: token transfer failed');

            // Calculate liquidity to mint
            let liquidity_minted = (strk_amount * total_liquidity) / strk_reserve;

            // Update storage
            self.strk_reserve.write(strk_reserve + strk_amount);
            self.token_reserve.write(token_reserve + token_amount);
            self.total_liquidity.write(total_liquidity + liquidity_minted);
            
            let current_liquidity = self.liquidity.read(caller);
            self.liquidity.write(caller, current_liquidity + liquidity_minted);

            self.emit(LiquidityAdded {
                provider: caller,
                strk_amount,
                token_amount,
                liquidity_minted
            });

            liquidity_minted
        }

        fn withdraw(ref self: ContractState, liquidity_amount: u256) -> (u256, u256) {
            assert(liquidity_amount > 0, 'DEX: liquidity must be > 0');

            let caller = get_caller_address();
            let user_liquidity = self.liquidity.read(caller);
            assert(user_liquidity >= liquidity_amount, 'DEX: insufficient liquidity');

            let total_liquidity = self.total_liquidity.read();
            let strk_reserve = self.strk_reserve.read();
            let token_reserve = self.token_reserve.read();

            // Calculate amounts to withdraw
            let strk_amount = (liquidity_amount * strk_reserve) / total_liquidity;
            let token_amount = (liquidity_amount * token_reserve) / total_liquidity;

            // Update storage
            self.liquidity.write(caller, user_liquidity - liquidity_amount);
            self.total_liquidity.write(total_liquidity - liquidity_amount);
            self.strk_reserve.write(strk_reserve - strk_amount);
            self.token_reserve.write(token_reserve - token_amount);

            // Transfer tokens to user
            let token_contract = IERC20Dispatcher { contract_address: self.token.read() };
            let success = token_contract.transfer(caller, token_amount);
            assert(success, 'DEX: token transfer failed');

            self.emit(LiquidityRemoved {
                provider: caller,
                strk_amount,
                token_amount,
                liquidity_burned: liquidity_amount
            });

            (strk_amount, token_amount)
        }

        // View functions
        fn get_strk_reserve(self: @ContractState) -> u256 {
            self.strk_reserve.read()
        }

        fn get_token_reserve(self: @ContractState) -> u256 {
            self.token_reserve.read()
        }

        fn get_total_liquidity(self: @ContractState) -> u256 {
            self.total_liquidity.read()
        }

        fn get_liquidity(self: @ContractState, account: ContractAddress) -> u256 {
            self.liquidity.read(account)
        }

        fn get_token_address(self: @ContractState) -> ContractAddress {
            self.token.read()
        }
    }

    // Helper function to calculate square root (simplified)
    fn sqrt(value: u256) -> u256 {
        if value == 0 {
            return 0;
        }
        
        let mut z = value;
        let mut x = value / 2 + 1;
        
        while x < z {
            z = x;
            x = (value / x + x) / 2;
        }
        
        z
    }
}

#[starknet::interface]
trait IDEX<TContractState> {
    fn init(ref self: TContractState, tokens: u256, strk: u256) -> u256;
    fn price(self: @TContractState, x_input: u256, x_reserve: u256, y_reserve: u256) -> u256;
    fn strk_to_token(ref self: TContractState, strk_amount: u256) -> u256;
    fn token_to_strk(ref self: TContractState, token_amount: u256) -> u256;
    fn deposit(ref self: TContractState, strk_amount: u256) -> u256;
    fn withdraw(ref self: TContractState, liquidity_amount: u256) -> (u256, u256);
    
    // View functions
    fn get_strk_reserve(self: @TContractState) -> u256;
    fn get_token_reserve(self: @TContractState) -> u256;
    fn get_total_liquidity(self: @TContractState) -> u256;
    fn get_liquidity(self: @TContractState, account: ContractAddress) -> u256;
    fn get_token_address(self: @TContractState) -> ContractAddress;
}
