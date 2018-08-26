let EscrowBlockMarket = artifacts.require("./EscrowBlockMarket.sol");
let AdminUsersStorage = artifacts.require("./AdminUsersStorage.sol");
let StoreOwnerUsersStorage = artifacts.require("./StoreOwnerUsersStorage.sol");
let StoresStorage = artifacts.require("./StoresStorage.sol");
let ProductsStorage = artifacts.require("./ProductsStorage.sol");

module.exports = async function(deployer) {
    await deployer.deploy(EscrowBlockMarket, AdminUsersStorage.address, 
        StoreOwnerUsersStorage.address, StoresStorage.address, ProductsStorage.address);
    return true;
}; 