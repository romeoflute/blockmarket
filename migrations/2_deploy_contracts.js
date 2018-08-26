let UsersStorage = artifacts.require("./UsersStorage.sol");
let StoresStorage = artifacts.require("./StoresStorage.sol");
let ProductsStorage = artifacts.require("./ProductsStorage.sol");

module.exports = function(deployer) {
  deployer.deploy(UsersStorage);
  deployer.deploy(StoresStorage);
  deployer.deploy(ProductsStorage);
};
