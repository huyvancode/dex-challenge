#[starknet::contract]
mod Balloons {
    use starknet::{ContractAddress, get_caller_address};
    use openzeppelin::token::erc20::{ERC20Component, ERC20HooksEmptyImpl};
    use openzeppelin::token::erc20::ERC20Component::InternalTrait;

    component!(path: ERC20Component, storage: erc20, event: ERC20Event);

    // ERC20 Mixin
    #[abi(embed_v0)]
    impl ERC20MixinImpl = ERC20Component::ERC20MixinImpl<ContractState>;
    impl ERC20InternalImpl = ERC20Component::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        erc20: ERC20Component::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        ERC20Event: ERC20Component::Event,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        let name = "Balloons";
        let symbol = "BAL";
        
        self.erc20.initializer(name, symbol);
        
        // Mint 1000 BAL tokens to the deployer (owner)
        // 1000 * 10^18 = 1000000000000000000000
        let initial_supply: u256 = 1000000000000000000000;
        self.erc20.mint(owner, initial_supply);
    }

    #[abi(embed_v0)]
    impl BalloonsImpl of super::IBALLOONS<ContractState> {
        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            // Only allow minting for testing purposes
            self.erc20.mint(to, amount);
        }
    }
}

#[starknet::interface]
trait IBALLOONS<TContractState> {
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
}
