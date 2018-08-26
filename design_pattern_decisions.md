# BlockMarket

BlockMarket is a marketplace proof of concept POC consisting of a set of smart contracts written in Solidity and a ReactJS web frontend. It is my project for the 2018 Consensys Developer program. - Romeo (rflauta@codedisruptors.com)

This document discusses the design patterns that I did for BlockMarket. More patterns are discussed as part of the security topic in avoiding_common_attacks.md. 

## Upgradability by separating data contracts from logic contracts
The ten (10) contracts are all coded in Solidity. Except for the Migrations contract, the nine others can be divided into two categories: Logic contracts and Data contracts. Logic contracts contain the logic or business rules. The data contracts contain only data as well as setter and getter functions. This way, the logic contracts can be upgraded if there is a bug, without necessarily needing to update the data contracts. (https://vomtom.at/upgrade-smart-contracts-on-chain/)

At first, I coded all logic contracts as libraries. Libraries cannot save data so all data are saved in regular contracts. All the contracts were already done that way when I came to learn about upgradeable contracts. The problem with my first approach is that, if there is a bug in the logic of the app which is contained in a library, then when I need to upgrade that library, I will have to also upgrade the data contract as its pointer to the library would have changed. Thus, I changed the logic contracts to regular contracts instead of libraries. Now, if the logic contracts are updated, the data contracts need not be upgraded. There was much to learn in the short duration of the course and I am very grateful to Consensys. 

##### Data Contracts
-*UsersStorage.sol* contain data for all users
-*AdminUsersStorage.sol* contain additional data for Admins 
-*StoreOwnerUsersStorage.sol* contain additional data for Store Owners
-*StoresStorage.sol* contain data for stores
-*ProductsStorage.sol* contain data for products. The store id is contained in the data of the product.
-*Escrow.sol* An escrow is generated each time a purchase is made. It contains the addresses of the buyer, seller, and admin arbiter, as well as the data for the product. 

##### Logic Contracts
-*UsersBlockMarket.sol* contain logic for users (Platform Owner, Admin, Store Owner, User)
-*StoreBlockMarket.sol* contain logic for stores and products
-*EscrowBlockMarket.sol* contain logic for buying a product, generating escrows, picking an arbiter from the admins, and other escrow-related actions.

## Smaller contracts instead of 1 huge logic contract and another huge data contract
I learned the bitter way that a huge contract can result in "out of gas" error during deployment. So I learned to split huge contracts to several smaller ones. 

## Use of Library for Code Reuse
-Instead of recoding helper contracts, I made use of a publicly available Zepellin library, SafeMath. Code resability is just one aspect of it. The greater issue is its safety and security. 

## Use of Zepellin contracts to implement security
-More on this in avoiding_common_attacks.md
-In fact, in addition to upgradeability, security is also a main driver of design patterns. I will tackle that in avoiding_common_attacks.md.