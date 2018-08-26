pragma solidity ^0.4.24;

//pattern: https://vomtom.at/upgrade-smart-contracts-on-chain/
import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";

/** @title Users storage. */
contract StoreOwnerUsersStorage is Ownable {

    mapping(address => bool) private accessAllowed;

    mapping(uint => address) private storeOwnersList;

    uint private storeOwnersCount;
    
    mapping(address => bool) private activeStoreOwners;

    /** @dev Restricts functions to allowed addresses only. */
    modifier platformOnly() {
        require(
            accessAllowed[msg.sender] == true,
            "This is restricted to allowed accounts only."
        );
        _;
    }

    /** @dev Constructor function. */
    constructor() public {
        accessAllowed[msg.sender] = true;
    }

    /** @dev Function that adds an allowed address.
      * @param _address Ethereum address of a user or a contract.
      */
    function allowAccess(address _address) public platformOnly {
        accessAllowed[_address] = true;
    }

    /** @dev Function to verify if store owner is active 
      * @param storeOwnerAddress The ethereum address of the store owner.
      * @param isActive True if active, false if not active.
      */
    function verifyActiveStoreOwner(address storeOwnerAddress) public view platformOnly returns(bool isActive) {
        isActive = activeStoreOwners[storeOwnerAddress];
    }

    /** @dev Function to activate or deactivate a store owner 
      * @param storeOwnerAddress The ethereum address of the store owner.
      * @param activate True to activate, false to deactivate
      */
    function setActiveStoreOwner(address storeOwnerAddress, bool activate) public platformOnly {
        activeStoreOwners[storeOwnerAddress] = activate;
    }

    /** @dev Function that retrieves the Ethereum address of a store owner.
      * @param keyInt user id of the store owner.
      * @return storeOwnerAddress Ethereum address of the store owner.
      */
    function getStoreOwnerAddressFromList(uint keyInt) public view platformOnly returns(address storeOwnerAddress) {
        storeOwnerAddress = storeOwnersList[keyInt];
    }

    /** @dev Function to store the Ethereum address of a store owner.
      * @param userAddress Ethereum address of the store owner.
      */
    function addStoreOwnerInList(address userAddress) public platformOnly {
        storeOwnersList[storeOwnersCount] = userAddress;
        storeOwnersCount++;
    }

    /** @dev Function to retrieve the total number of store owners.
      * @return adminCount Total number of store owners.
      */
    function getStoreOwnersCount() public view platformOnly returns(uint) {
        return storeOwnersCount;
    }

}