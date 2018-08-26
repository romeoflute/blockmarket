let AdminUsersStorage = artifacts.require("./AdminUsersStorage.sol");
let StoreOwnerUsersStorage = artifacts.require("./StoreOwnerUsersStorage.sol");

module.exports = function(deployer) {
    deployer.deploy(AdminUsersStorage);
    deployer.deploy(StoreOwnerUsersStorage);
  };