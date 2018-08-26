pragma solidity ^0.4.24;

import {AdminUsersStorage} from "./AdminUsersStorage.sol";
import {StoreOwnerUsersStorage} from "./StoreOwnerUsersStorage.sol";
import {StoresStorage} from "./StoresStorage.sol";
import {ProductsStorage} from "./ProductsStorage.sol";
import {Escrow} from "./Escrow.sol";

import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";
import "../installed_contracts/zeppelin/contracts/lifecycle/Pausable.sol";
import "../installed_contracts/zeppelin/contracts/math/SafeMath.sol";


/** @title EscrowBlockMarket. */
contract EscrowBlockMarket is Ownable, Pausable {

    using SafeMath for uint256;    

    event BuyProduct(
        uint indexed productId
    );
    event ReleaseAmountToStoreOwner(
        uint indexed productId, uint releaseCount, bool fundsDisbursed
    );

    event RefundAmountToBuyer(
        uint indexed productId, uint refundCount, bool fundsDisbursed
    );

    AdminUsersStorage adminUsersStorage;
    StoreOwnerUsersStorage storeOwnerUsersStorage;
    StoresStorage storesStorage;
    ProductsStorage productsStorage;

    bool allowBuyerToWithdraw;

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
      * @param _adminUsersStorage Ethereum address of instance of AdminUserStorage contract.
      * @param _storeOwnerUsersStorage Ethereum address of instance of StoreOwnerUserStorage contract.
      * @param  _storesStorage Ethereum address of instance of StoresStorage contract.
      * @param  _productsStorage Ethereum address of instance of ProductsStorage contract.
      */
    constructor (
        address _adminUsersStorage,
        address _storeOwnerUsersStorage,
        address _storesStorage, 
        address _productsStorage
    ) public {
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
    
    /** @dev Function to buy a product and create a corresponding escrow.
      * @param _productId Id of the product.
      */
    function buy(uint _productId) public payable whenNotPaused {

        require(
            msg.sender != owner, 
            "Platform owners are not allowed to buy as they can influence administrator arbiters."
        );
        bool isAdmin = adminUsersStorage.verifyActiveAdmin(msg.sender);
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
        (, , productName, , , , , ) = productsStorage.getProduct(_productId);
        
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
        Escrow(productEscrows[_productId]).releaseAmountToSeller(msg.sender);
        bool _fundsDisbursed;
        uint _releaseCount;
        (, , , , _fundsDisbursed, _releaseCount, , ) = Escrow(productEscrows[_productId]).getEscrowDetails();
        if(_releaseCount == 2 && _fundsDisbursed == true){
            productsStorage.updateProductStatus(_productId, uint(ProductsStorage.ProductStatus.Sold));
        }
        emit ReleaseAmountToStoreOwner(_productId, _releaseCount, _fundsDisbursed);
    }
    
    /** @dev Function to refund the amount in escrow to the buyer.
      * @param _productId Id of the associated product.
      */
    function refundAmountToBuyer ( uint _productId ) public whenNotPaused {
        Escrow(productEscrows[_productId]).refundAmountToBuyer(msg.sender);
        bool _fundsDisbursed;
        uint _refundCount;
        (, , , , _fundsDisbursed, , _refundCount,) = Escrow(productEscrows[_productId]).getEscrowDetails();
        if(_refundCount == 2 && _fundsDisbursed == true){
            productsStorage.updateProductStatus(_productId, uint(ProductsStorage.ProductStatus.Refunded));
        }
        emit RefundAmountToBuyer(_productId, _refundCount, _fundsDisbursed);
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

