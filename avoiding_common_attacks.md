# BlockMarket

BlockMarket is a marketplace proof of concept POC consisting of a set of smart contracts written in Solidity and a ReactJS web frontend. It is my project for the 2018 Consensys Developer program. - Romeo (rflauta@codedisruptors.com)

This document discusses the security implementations that I did for BlockMarket. 

## Limiting access

##### Use of Contract Owner

All contracts inherit from the Zeppelin contract Ownable. This passes on the owner contract variable to each contract. The owner variable is set during deployment when the instance of the contract is made. The deployer Ethereum account is saved as the owner of each contract. This is also becomes the Marketplace Owner account and is given privilege to access certain functions. Thus, whoever deploys the BlockMarket contract becomes the Marketplace Owner. 

##### Allowing only the logic contracts to save to the data contracts

At the end of the deployment script, in 7_deploy_contracts.js, the allowAccess(address contractAddress) function is called on each data contract, registering the addresses of the logic contracts to the limited addresses that can access the data contracts.  This is then used as the basis for modifiers that ensure that only the necessary logic contracts are given access to the data contracts. This is very stringent so that even during testing, the functions in the data contracts are only reached via the logic contracts. Here are the list of data and logic contracts:

1. Data Contracts
-*UsersStorage.sol* contain data for all users
-*AdminUsersStorage.sol* contain additional data for Admins 
-*StoreOwnerUsersStorage.sol* contain additional data for Store Owners
-*StoresStorage.sol* contain data for stores
-*ProductsStorage.sol* contain data for products. The store id is contained in the data of the product.
-*Escrow.sol* An escrow is generated each time a purchase is made. It contains data of the product, buyer, seller, and admin arbiter. 

2. Logic Contracts
-*UsersBlockMarket.sol* contain logic for users (Platform Owner, Admin, Store Owner, User)
-*StoreBlockMarket.sol* contain logic for stores and products
-*EscrowBlockMarket.sol* contain logic for buying a product, generating escrows, picking an arbiter from the admins, and other escrow-related actions.

You may review the deployment scripts in the Migrations folder. 

##### Use of modifiers and require statements in functions

Modifiers limit access and require statements limit access to the functions. Such modifiers include platformOnly, onlyOwner, restrictedToStoreOwner, restrictedToAdmin, etc. The data variables in the data contracts are labeled as private and are accessible only in function setters and getters that have these modifiers. 

## Circuit Breakers: Use of Pausable

If there is an ongoing attack, the contracts inherit from Pausable. Then, function modifiers are used so that certain functions can only be called if the contract is paused, while others can only be called when the contract is not paused. The contracts inherit from Zeppelin's Pausable.sol contract. 

## Use of Withdrawal Pattern

In the case that there is an attack and contracts are paused, then if the marketplace owner wants to return the money to the buyers, the contract does not loop though accounts to send ether to each one. Instead, each buyer has to withdraw the fund in the escrow, but only if allowed by the marketplace owner, and only if the contract has been paused. This is not yet implemented in the ReactJS website but the code is already in the contracts. 

## Use of SafeMath library for addition

I used the SafeMath library in order to provide safe addition. This should prevent integer overflow and underflow.

## Design that enables upgrades if a vulnerability is found

The design pattern separates logic contracts from data contracts. Thus, if there is a bug in the logic, the logic contract can be updated and then deployed without affecting the already deployed data contracts. As for deploying only one contract in the series, the truffle Terminal command can be found here: 
https://vomtom.at/upgrade-smart-contracts-on-chain/

## Avoiding the dependence on this.balance in Escrow.sol

Escrow.sol does not depend on this.balance in order to allow sending of Ether to either the buyer (refund) or the seller. This is important as another contract may send a small amount of unexpected ether (e.g. via self.desctuct call) to the Escrow contract and cause the balance-dependent code not to be called. 

## Avoiding saving of state after fund transfer. 

In Escrow.sol, internal state is saved first before initiating the transfer of funds. This should help mitigate attacks anchored on race conditions.

## Avoiding timestamp dependence

I have avoided the dependence on timestamp, especially in the Escrow contract. Timestamp can be manipulated. 
