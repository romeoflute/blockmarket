let StoreBlockMarket = artifacts.require("./StoreBlockMarket.sol");
let StoresStorage = artifacts.require("./StoresStorage.sol");
let ProductsStorage = artifacts.require("./ProductsStorage.sol");
let StoreOwnerUsersStorage = artifacts.require("./StoreOwnerUsersStorage.sol");

module.exports = async function(deployer) {
    await deployer.deploy(StoreBlockMarket, StoreOwnerUsersStorage.address, StoresStorage.address, 
        ProductsStorage.address, );
    return true;
}; 
