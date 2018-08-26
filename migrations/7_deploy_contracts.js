let UsersBlockMarket = artifacts.require("./UsersBlockMarket.sol");
let StoreBlockMarket = artifacts.require("./StoreBlockMarket.sol");
let EscrowBlockMarket = artifacts.require("./EscrowBlockMarket.sol");

let UsersStorage = artifacts.require("./UsersStorage.sol");
let AdminUsersStorage = artifacts.require("./AdminUsersStorage.sol");
let StoreOwnerUsersStorage = artifacts.require("./StoreOwnerUsersStorage.sol");
let StoresStorage = artifacts.require("./StoresStorage.sol");
let ProductsStorage = artifacts.require("./ProductsStorage.sol");

module.exports = async function(deploy) {
    //Storage contracts
    let instanceUsersStorage = await UsersStorage.deployed();
    let instanceAdminUsersStorage = await AdminUsersStorage.deployed();
    let instanceStoreOwnerUsersStorage = await StoreOwnerUsersStorage.deployed();
    let instanceStoresStorage = await StoresStorage.deployed();
    let instanceProductsStorage = await ProductsStorage.deployed();
    
    //UsersBlockMarket
    instanceUsersStorage.allowAccess(UsersBlockMarket.address);
    instanceAdminUsersStorage.allowAccess(UsersBlockMarket.address);
    instanceStoreOwnerUsersStorage.allowAccess(UsersBlockMarket.address);

    //StoreBlockMarket
    instanceStoreOwnerUsersStorage.allowAccess(StoreBlockMarket.address);
    instanceStoresStorage.allowAccess(StoreBlockMarket.address);
    instanceProductsStorage.allowAccess(StoreBlockMarket.address);

    //EscrowBlockMarket
    instanceAdminUsersStorage.allowAccess(EscrowBlockMarket.address);
    instanceStoreOwnerUsersStorage.allowAccess(EscrowBlockMarket.address);
    instanceStoresStorage.allowAccess(EscrowBlockMarket.address);
    return instanceProductsStorage.allowAccess(EscrowBlockMarket.address);
};