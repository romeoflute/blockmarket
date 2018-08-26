pragma solidity ^0.4.24;

import {UsersStorage} from "./UsersStorage.sol";
import {AdminUsersStorage} from "./AdminUsersStorage.sol";
import {StoreOwnerUsersStorage} from "./StoreOwnerUsersStorage.sol";
import {StoresStorage} from "./StoresStorage.sol";
import {ProductsStorage} from "./ProductsStorage.sol";
import {Escrow} from "./Escrow.sol";

import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";
import "../installed_contracts/zeppelin/contracts/lifecycle/Pausable.sol";
import "../installed_contracts/zeppelin/contracts/math/SafeMath.sol";


/** @title BlockMarket. */
contract BlockMarket is Ownable, Pausable {

    using SafeMath for uint256;    

    event AddAdmin(
        address indexed adminAddress       
    );

    event AddStoreOwner(
        address indexed storeOwnerAddress       
    );

    event AddStore(
        address storeOwner, 
        string name, 
        string email, 
        string imageLink, 
        string descLink      
    );

    event AddProduct(
        uint indexed storeId,
        string name
    );

    event BuyProduct(
        uint indexed productId
    );

    event ReleaseAmountToStoreOwner(
        uint indexed productId
    );

    event RefundAmountToBuyer(
        uint indexed productId
    );

    UsersStorage usersStorage;
    AdminUsersStorage adminUsersStorage;
    StoreOwnerUsersStorage storeOwnerUsersStorage;
    StoresStorage storesStorage;
    ProductsStorage productsStorage;

    bool allowBuyerToWithdraw;

    enum Role { Admin, StoreOwner, User }

    // mapping of product id to escrow
    mapping(uint => address) private productEscrows;

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
      * @param  _storesStorage Ethereum address of instance of StoresStorage contract.
      * @param  _productsStorage Ethereum address of instance of ProductsStorage contract.
      */
    constructor (
        address _usersStorage,
        address _adminUsersStorage,
        address _storeOwnerUsersStorage,
        address _storesStorage, 
        address _productsStorage
    ) public {
        usersStorage = UsersStorage(_usersStorage);
        adminUsersStorage = AdminUsersStorage(_adminUsersStorage);
        storeOwnerUsersStorage = StoreOwnerUsersStorage(_storeOwnerUsersStorage);
        storesStorage = StoresStorage(_storesStorage);
        productsStorage = ProductsStorage(_productsStorage);
    }

    /** @dev Fallback function. */
    function() public payable {
        // nothing to do
    }

    /** @dev Function to retrieve the platform owner. 
      * @return owner Ethereum address.
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
        if (_role == Role.StoreOwner) {
            assert(adminUsersStorage.verifyActiveAdmin(msg.sender));
        }
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
    function checkIfActiveStoreOwner(address _storeOwnerAddress) public view whenNotPaused returns (bool) {
        return storeOwnerUsersStorage.verifyActiveStoreOwner(_storeOwnerAddress);
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
    
    /** @dev This function will let a store owner register a store.
      * @param _name Name of store.
      * @param _email Email of store.
      * @param _imageLink The ipfs link of the store's small image.
      * @param _descLink The ipfs link of the store's description.
      */
    function createStore(
        string _name, 
        string _email, 
        string _imageLink, 
        string _descLink
    ) public restrictedToStoreOwner whenNotPaused {
        //only active store owners can create a store
        require(
            storeOwnerUsersStorage.verifyActiveStoreOwner(msg.sender) == true,
            "Only an active store owner can register a store."
        );

        storesStorage.addStore(msg.sender, _name, _email, _imageLink, _descLink);
        emit AddStore(msg.sender, _name, _email, _imageLink, _descLink);
    }

    /** @dev Get the total number of stores.
      * @return count total number of stores.
      */
    function getStoresCount() public view returns (uint count) {
        count = storesStorage.getStoresCount();
        return count;
    }

    /** @dev Function to fetch the details of a store.
      * @param _storeId Id of the store.
      * @return storeId Id of the store.
      * @return storeOwnerAddress Store owner's ethereum address
      * @return name Name of the store. 
      * @return email Email of the store. 
      * @return imageLink Ipfs link of the image of the product.
      * @return descLink Ipfs link of the description of the product.
      */
    function getStoreDetails(uint _storeId) 
        public view returns (
            uint storeId, 
            address storeOwnerAddress, 
            string name, 
            string email, 
            string imageLink,
            string descLink
    ) {
        ( 
            storeId, 
            storeOwnerAddress, 
            name, 
            email, 
            imageLink, 
            descLink
        ) = storesStorage.getStore(_storeId);

        return (
            storeId, 
            storeOwnerAddress, 
            name, 
            email, 
            imageLink, 
            descLink
        );
    }

    /** @dev Function to get the store id of all stores owned by the store owner.
      * @param _storeOwnerAddress Ethereum address of storm owner.
      * @return _stores An array of store id.
      */
    function getStoresOfOwner(address _storeOwnerAddress) public view returns(uint[] _stores){
        _stores = storesStorage.getStoresOfOwner(_storeOwnerAddress);
        return (_stores);
    }

    /** @dev Verify if id is that of an active store.
      * @param _storeId Key in the list of active stores.
      * @return isActive True if the address is that of an active store.
      */
    function checkIfActiveStore(uint _storeId) public view returns (bool isActive) {
        isActive = storesStorage.verifyActiveStore(_storeId);
    }

    /** @dev Activate or deactivate a store.
      * @param _storeId Id of the store.
      * @param _activate True if the store is to be activated, false to deactivate.
      */
    function activateStore(uint _storeId, bool _activate) public whenNotPaused {
        return storesStorage.activateStore(_storeId, _activate, msg.sender);
    }
    
    /** @dev Function that lets a store owner register a product.
      * @param _storeId Id of the associated store.
      * @param _storeOwnerAddress Ethereum ddress of the store owner.
      * @param _name Name of the product.
      * @param _price Price of the product.
      * @param _imageLink Ipfs link of the image of the product.
      * @param _descLink Ipfs link of the description of the product.
      */
    function addProduct(
        uint _storeId, 
        address _storeOwnerAddress, 
        string _name, 
        uint _price, 
        string _imageLink, 
        string _descLink
    ) public restrictedToStoreOwner whenNotPaused {
        productsStorage.addProduct(
            _storeId, 
            _storeOwnerAddress, 
            _name, 
            _price, 
            _imageLink, 
            _descLink
        );
        emit AddProduct(_storeId, _name);
    }
    
    /** @dev Verify if id is that of an active product.
      * @return isActive True if the product is active.
      */
    function checkIfActiveProduct(uint _productId) public view returns (bool _isActive) {
        _isActive = productsStorage.verifyActiveProduct(_productId);
    }
    
    /** @dev Function to fetch the details of a product.
      * @param _productId Id of the product.
      * @return productId Id of the product.
      * @return storeOwnerAddress Store owner's ethereum address
      * @return name Name of the product. 
      * @return price Price of the product. 
      * @return imageLink Ipfs link of the image of the product.
      * @return descLink Ipfs link of the description of the product.
      * @return status Status whether Sale, Reserved, Sold, Refunded 
      * @return buyerAddress Ethereum address of the buyer
      */
    function getProductDetails(uint _productId) 
        public view returns (
            uint productId, 
            address storeOwnerAddress, 
            string name, 
            uint price, 
            string imageLink,
            string descLink, 
            uint status, 
            address buyerAddress
    ) {
        ( 
            productId, 
            storeOwnerAddress, 
            name, 
            price, 
            imageLink, 
            descLink, 
            status, 
            buyerAddress
        ) = productsStorage.getProduct(_productId);

        return (
            productId, 
            storeOwnerAddress, 
            name, 
            price, 
            imageLink, 
            descLink, 
            status, 
            buyerAddress
        );
    }

    /** @dev Function that retrieve a store's array of product id's .
      * @param _storeId Id of the store.
      * @return _productIDs array of product id's.
      */
    function getProductsOfStore(uint _storeId) public view returns(uint[] _productIDs) {
        _productIDs = productsStorage.getProductsOfStore(_storeId);
        return _productIDs;
    }
    
    /** @dev Function to buy a product and create a corresponding escrow.
      * @param _productId Id of the product.
      */
    function buy(uint _productId) public payable whenNotPaused {

        require(
            msg.sender != owner, 
            "Platform owners are not allowed to buy as they can influence administrator arbiters."
        );
        bool isAdmin = checkIfActiveAdmin(msg.sender);
        require(
            isAdmin == false, 
            "Administrators may act as arbiters in an escrow so they are not allowed to buy."
        );

        address storeOwnerAddress;
        uint price;
        (storeOwnerAddress, price) = productsStorage.getProductOwnerAndPrice(_productId);
        //check if with enough money to pay
        require(
            msg.value >= price, 
            "Ether must be at least equal to the price."
        );
        
        //pick an admin from the active
        address adminArbiterAddress = adminUsersStorage.pickAdmin();
                
        productsStorage.updateProductStatus(_productId, uint(ProductsStorage.ProductStatus.Reserved));
        productsStorage.updateBuyer(_productId, msg.sender);

        string memory productName;
        (, , productName, , , , , ) = getProductDetails(_productId);
        
        Escrow escrow = (new Escrow).value(msg.value)(
            owner,
            _productId,
            productName, 
            msg.sender, 
            storeOwnerAddress, 
            adminArbiterAddress
        );

        productEscrows[_productId] = escrow; 
        emit BuyProduct(_productId);
    }
    
    /** @dev Function to fetch the details of an escrow.
      * @param _productId Id of the associated product.
      * @return string name Name of the product.
      * @return address buyerAddress Address of the buyer, 
      * @return address storeOwnerAddress Address of the store owner, 
      * @return address adminArbiterAddress Address of the assigned admin arbiter, 
      * @return bool fundsDisbursed True if funds has been disbursed to the seller or buyer, 
      * @return uint releaseCount Count of votes to release fund to the seller, 
      * @return uint refundCount Count of votes to refund, 
      * @return uint amount Price of the product which is equal to amount in escrow
      */ 
    function getEscrowInfo( uint _productId ) public view returns (
            string productName,
            address buyerAddress, 
            address storeOwnerAddress, 
            address adminArbiterAddress, 
            bool fundsDisbursed, 
            uint releaseCount, 
            uint refundCount, 
            uint amount
    ) {
        (   
            productName,
            buyerAddress, 
            storeOwnerAddress, 
            adminArbiterAddress, 
            fundsDisbursed, 
            releaseCount, 
            refundCount, 
            amount
        ) = Escrow(productEscrows[_productId]).getEscrowDetails();

        return (
            productName,
            buyerAddress, 
            storeOwnerAddress, 
            adminArbiterAddress, 
            fundsDisbursed, 
            releaseCount, 
            refundCount, 
            amount
        );
    }
    
    
    /** @dev Function to release the amount in escrow to the store owner.
      * @param _productId Id of the associated product.
      */ 
    function releaseAmountToStoreOwner( uint _productId ) public whenNotPaused {
        productsStorage.updateProductStatus(_productId, uint(ProductsStorage.ProductStatus.Sold));
        Escrow(productEscrows[_productId]).releaseAmountToSeller(msg.sender);
        emit ReleaseAmountToStoreOwner(_productId);
    }
    
    /** @dev Function to refund the amount in escrow to the buyer.
      * @param _productId Id of the associated product.
      */
    function refundAmountToBuyer ( uint _productId ) public whenNotPaused {
        productsStorage.updateProductStatus(_productId, uint(ProductsStorage.ProductStatus.Refunded));
        Escrow(productEscrows[_productId]).refundAmountToBuyer(msg.sender);
        emit RefundAmountToBuyer(_productId);
    }
    
    /** @dev Function to enable the platform owner to allow buyers to withdraw amount in escrow when contract is paused.
      * @param allow True if allowed, false if not.
      */
    function allowBuyerWithdrawal(bool allow) public onlyOwner whenPaused {
        allowBuyerToWithdraw = allow;
    }

    /** @dev Function to enable the buyer to withdraw the money in escrow, when contract is paused.
      * @param _productId Id of the product that was bought.
      */
    function buyerWithdraw( uint _productId ) public whenPaused {
        require(
            allowBuyerToWithdraw == true,
            "The platform owner must have allowed buyers to withdraw."
        );
        Escrow(productEscrows[_productId]).emergencyRefundToBuyer(msg.sender);
    }

    /** @dev Function to fetch the release and refund counts of an escrow.
      * @param _productId Id of the product that was bought and associated in the escrow.
      */
    function getReleaseRefundCounts(uint _productId) public view returns(uint, uint) {
        uint releaseCount = Escrow(productEscrows[_productId]).releaseCount();
        uint refundCount = Escrow(productEscrows[_productId]).refundCount();
        return(releaseCount, refundCount);
    }

    /** @dev Function to total amount disbursed to seller in the whole project. Uses SafeMath library
      * @return sum total of funds successfully received by store owners.

      */
    function getAmountDisbursedToSeller() public view onlyOwner returns(uint256 sum) {
        sum = 0;
        uint totalProducts = productsStorage.getProductsCount();

        bool fundsDisbursed;
        uint releaseCount; 
        uint refundCount; 
        uint amount;
        for(uint productId = 0; productId < totalProducts; productId++){
            (,,,,fundsDisbursed,releaseCount,refundCount,amount) = getEscrowInfo(productId);
            if(releaseCount == 2 && fundsDisbursed == true){
                sum = sum.add(amount);
            }
        }
        return sum;
    }
}

