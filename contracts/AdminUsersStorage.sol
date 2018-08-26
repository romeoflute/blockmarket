pragma solidity ^0.4.24;

//pattern: https://vomtom.at/upgrade-smart-contracts-on-chain/
import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";

/** @title Users storage. */
contract AdminUsersStorage is Ownable {

    mapping(address => bool) private accessAllowed;

    //using this mimics array, so we can loop; looping is expensive but we will not loop through all 
    mapping(uint => address) private adminsList;

    
    //will be used to pinpoint which admin will be picked for a particular escrow
    uint private chosenAdminIndex;
    
    //total count of administrators
    uint private adminCount;
    
    //for activating and deactivating admins
    mapping(address => bool) private activeAdmins;
    
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

    /** @dev Function that retrieves the Ethereum address of an administrator.
      * @param keyInt user id of the administrator.
      * @return adminAddress Ethereum address of the administrator.
      */
    function getAdminAddressFromList(uint keyInt) public view platformOnly returns(address adminAddress) {
        adminAddress = adminsList[keyInt];
    }

    /** @dev Function to store the Ethereum address of an administrator.
      * @param userAddress Ethereum address of the administrator.
      */
    function addAdminInList(address userAddress) public platformOnly {
        adminsList[adminCount] = userAddress;
        adminCount++;
    }

    /** @dev Function to retrieve the total number of administrators.
      * @return adminCount Total number of administrators.
      */
    function getAdminCount() public view platformOnly returns(uint) {
        return adminCount;
    }

    /** @dev Function to get the current admin index to use when picking 
      * an admin for the next escrow.
      * @return chosenAdminIndex Current admin index.
      */
    function getChosenAdminIndex() public view platformOnly returns(uint) {
        return chosenAdminIndex;
    }

    /** @dev Function to increment the admin index to use when picking 
      * an admin for the next escrow.
      */
    function incrementChosenAdminIndex() public platformOnly {
        chosenAdminIndex++;
    }

    /** @dev Function to set the admin index to use when assigning 
      * an admin for the next escrow.
      * Note: no longer used and may be deleted in next cleanup.
      */
    function setChosenAdminIndex(uint index) public platformOnly returns(bool) {
        chosenAdminIndex = index;
        return true;
    }

    /** @dev Function to check if admin is active 
      * @param adminAddress The ethereum address of the admin.
      * @return isActive True if active, false if inactive.
      */
    function verifyActiveAdmin(address adminAddress) public view platformOnly returns(bool isActive) {
        isActive = activeAdmins[adminAddress];
    }

    /** @dev Function to activate or deactivate an admin 
      * @param adminAddress The ethereum address of the admin.
      * @param activate True to activate, false to deactivate
      */
    function setActiveAdmin(address adminAddress, bool activate) public platformOnly {
        activeAdmins[adminAddress] = activate;
    }
   
    /** @dev Function to pick an admin, used when appointing admin to an escrow 
      * @return pickedAdminAddress Ethereum address of the selected admin
      */
    function pickAdmin() public platformOnly returns(address pickedAdminAddress){
        
        require(
            adminCount > 0,
            "There must be admins to pick from."
        );
        if (chosenAdminIndex + 1 < adminCount){
            incrementChosenAdminIndex();
        }else{
            setChosenAdminIndex(0);
        }
        pickedAdminAddress = adminsList[chosenAdminIndex]; 
    }
}