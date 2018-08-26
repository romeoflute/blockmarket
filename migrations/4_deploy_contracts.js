let UsersBlockMarket = artifacts.require("./UsersBlockMarket.sol");
let UsersStorage = artifacts.require("./UsersStorage.sol");
let AdminUsersStorage = artifacts.require("./AdminUsersStorage.sol");
let StoreOwnerUsersStorage = artifacts.require("./StoreOwnerUsersStorage.sol");

module.exports = async function(deployer) {
    await deployer.deploy(UsersBlockMarket, UsersStorage.address, 
        AdminUsersStorage.address, StoreOwnerUsersStorage.address);
    return true;
};  