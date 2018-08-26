pragma solidity ^0.4.24;

import {UsersStorage} from "./UsersStorage.sol";
import {AdminUsersStorage} from "./AdminUsersStorage.sol";
import {StoreOwnerUsersStorage} from "./StoreOwnerUsersStorage.sol";

import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";
import "../installed_contracts/zeppelin/contracts/lifecycle/Pausable.sol";

/** @title UsersBlockMarket. */
contract UsersBlockMarket is Ownable, Pausable {

    event AddAdmin(
        address indexed adminAddress       
    );
    event AddStoreOwner(
        address indexed storeOwnerAddress       
    );


    UsersStorage usersStorage;
    AdminUsersStorage adminUsersStorage;
    StoreOwnerUsersStorage storeOwnerUsersStorage;

    enum Role { Admin, StoreOwner, User }

    /** @dev Restricts functions for admin only. */
    modifier restrictedToAdmin () {
        require(
            adminUsersStorage.verifyActiveAdmin(msg.sender) == true, 
            "Restricted to administrators"
        );
        _;
    }

    /** @dev Restricts functions for store owners only. */
    modifier restrictedToStoreOwner () {
        require(
            storeOwnerUsersStorage.verifyActiveStoreOwner(msg.sender) == true,
            "Restricted to store owners"
        );
        _;
    }

    /** @dev Constructor function.
      * @param _usersStorage Ethereum address of instance of UserStorage contract.
      * @param _adminUsersStorage Ethereum address of instance of AdminUserStorage contract.
      * @param _storeOwnerUsersStorage Ethereum address of instance of StoreOwnerUserStorage contract.
      */
    constructor (
        address _usersStorage,
        address _adminUsersStorage,
        address _storeOwnerUsersStorage
    ) public {
        usersStorage = UsersStorage(_usersStorage);
        adminUsersStorage = AdminUsersStorage(_adminUsersStorage);
        storeOwnerUsersStorage = StoreOwnerUsersStorage(_storeOwnerUsersStorage);
    }

    /** @dev Fallback function. */
    function() public payable {
        // nothing to do
    }

    /** @dev Function to retrieve the platform owner. 
      * @return owner Ethereum address of user.
      */

    function getOwner() public view returns(address) {
        return owner;
    }

    /** @dev This will register a user.
      * @param _ethAddress Ethereum address of user.
      * @param _name Name of user.
      * @param _email Email of user.
      * @param _role Role of user: admin, store owner, or user.
      */
    function registerUser( 
        address _ethAddress, 
        string _name, 
        string _email, 
        Role _role
    ) private whenNotPaused {
        if (_role == Role.Admin) {
            require(
                owner == msg.sender,
                "Only the platform owner can create admins"
            );
        }
        
        //only admins can create store owners
        // if (_role == Role.StoreOwner) {
        //     assert(adminUsersStorage.verifyActiveAdmin(msg.sender));
        // }
        usersStorage.setUser(_ethAddress, _name, _email, "imageLink", "descLink");
        
        if (_role == Role.Admin) {
            adminUsersStorage.addAdminInList(_ethAddress);
            adminUsersStorage.setActiveAdmin(_ethAddress, true);
            emit AddAdmin(_ethAddress);
        } else if (_role == Role.StoreOwner) {
            storeOwnerUsersStorage.addStoreOwnerInList(_ethAddress);
            storeOwnerUsersStorage.setActiveStoreOwner(_ethAddress, true);
            emit AddStoreOwner(_ethAddress);
        } else {
            _role == Role.User;
        }
    }

    /** @dev Function that retrieves the details of a user.
      * @param userAddress Ethereum address of a user.
      * @return ethAddress Ethereum address of a user.
      * @return name Name of the user.
      * @return email Email of the user.
      * @return imageLink Ipfs link of the image of the user.
      * @return descLink Ipfs link of the description of the user.
      */
    function getUser(address userAddress) 
        public view whenNotPaused  
        returns(
            address ethAddress, 
            string name, 
            string email, 
            string imageLink, 
            string descLink){

        (ethAddress, name, email, imageLink, descLink) = usersStorage.getUser(userAddress);
        
        return (ethAddress, name, email, imageLink, descLink);
    }

    /** @dev This function will let the platform owner register an administrator.
      * @param _ethAddress Ethereum address of user.
      * @param _name Name of user.
      * @param _email Email of user.
      */
    function registerAdmin(
        address _ethAddress, 
        string _name, 
        string _email
    ) public onlyOwner whenNotPaused {

        //first check if this is already an active admin
        require(
            adminUsersStorage.verifyActiveAdmin(_ethAddress) == false,
            "The address is already a registered admin"
        );
        
        registerUser(_ethAddress, _name, _email, Role.Admin);
    }

    /** @dev Get the total number of administrators.
      * @return count Total administrators.
      */
    function getTotalAdmins() public view returns (uint count) {
        count = adminUsersStorage.getAdminCount();
    }

    /** @dev Get the ethereum address of the administrator given a key in the list of admins.
      * @param _id Key in the list of admins.
      * @return _adminAddress Administrator's address.
      */
    function getAdminAddress(uint _id) public view onlyOwner returns (address _adminAddress) {
        _adminAddress = adminUsersStorage.getAdminAddressFromList(_id);
    }

    /** @dev Verify if ethereum address is that of an active administrator.
      * @param _adminAddress Key in the list of admins.
      * @return isActive True if the address is that of an active admin.
      */
    function checkIfActiveAdmin(address _adminAddress) public view whenNotPaused returns (bool isActive) {
        isActive = adminUsersStorage.verifyActiveAdmin(_adminAddress);
    }

    /** @dev Registers a store owner.
      * @param _ethAddress Ethereum address of user.
      * @param _name Name of user.
      * @param _email Email of user.
      */
    function registerStoreOwner(
        address _ethAddress, 
        string _name, 
        string _email
    ) public restrictedToAdmin whenNotPaused {
        require(
            adminUsersStorage.verifyActiveAdmin(_ethAddress) == false,
            "An admin can be an arbiter in escrows and so must not become a store owner to prevent abuse."
        );
        require(
            _ethAddress != owner,
            "The platform owner registers admins who become arbiters in escrows and so must not become a store owner to prevent abuse."
        );
        registerUser(_ethAddress, _name, _email, Role.StoreOwner);
    }

    /** @dev Verify if address is that of an active store owner.
      * @param _storeOwnerAddress Key in the list of store owners.
      * @return isActive True if the address is that of an active store owner.
      */
    function checkIfActiveStoreOwner(address _storeOwnerAddress) public view whenNotPaused returns (bool isActive) {
        isActive = storeOwnerUsersStorage.verifyActiveStoreOwner(_storeOwnerAddress);
        return isActive;
    }

     /** @dev Get the total number of store owners.
      * @return count Total store owners.
      */
    function getTotalStoreOwners() public view returns (uint count) {
        count = storeOwnerUsersStorage.getStoreOwnersCount();
    }

    /** @dev Get the ethereum address of the store owner given a key in the list of store owners.
      * @param _id Key in the list of store owners.
      * @return _storeOwnerAddress Store Owner's address.
      */
    function getStoreOwnerAddress(uint _id) public view returns (address _storeOwnerAddress) {
        _storeOwnerAddress = storeOwnerUsersStorage.getStoreOwnerAddressFromList(_id);
    }
}

