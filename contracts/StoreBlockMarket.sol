pragma solidity ^0.4.24;

import {StoreOwnerUsersStorage} from "./StoreOwnerUsersStorage.sol";
import {StoresStorage} from "./StoresStorage.sol";
import {ProductsStorage} from "./ProductsStorage.sol";
import {Escrow} from "./Escrow.sol";

import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";
import "../installed_contracts/zeppelin/contracts/lifecycle/Pausable.sol";


/** @title StoreBlockMarket. */
contract StoreBlockMarket is Ownable, Pausable {
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

    StoreOwnerUsersStorage storeOwnerUsersStorage;
    StoresStorage storesStorage;
    ProductsStorage productsStorage;

    enum Role { Admin, StoreOwner, User }

    // mapping of product id to escrow
    mapping(uint => address) private productEscrows;

    /** @dev Restricts functions for store owners only. */
    modifier restrictedToStoreOwner () {
        require(
            storeOwnerUsersStorage.verifyActiveStoreOwner(msg.sender) == true,
            "Restricted to store owners"
        );
        _;
    }

    /** @dev Constructor function.
      * @param _storeOwnerUsersStorage Ethereum address of instance of StoreOwnerUserStorage contract.
      * @param  _storesStorage Ethereum address of instance of StoresStorage contract.
      * @param  _productsStorage Ethereum address of instance of ProductsStorage contract.
      */
    constructor (
        address _storeOwnerUsersStorage,
        address _storesStorage, 
        address _productsStorage
    ) public {
        storeOwnerUsersStorage = StoreOwnerUsersStorage(_storeOwnerUsersStorage);
        storesStorage = StoresStorage(_storesStorage);
        productsStorage = ProductsStorage(_productsStorage);
    }

    /** @dev Fallback function. */
    function() public payable {
        // nothing to do
    }

    /** @dev Retrieves the platform owner's address. 
      * @return owner Ethereum address of user.
      */
    function getOwner() public view returns(address) {
        return owner;
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
    ) public  {
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
}

