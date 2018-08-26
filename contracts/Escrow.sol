pragma solidity ^0.4.24;

import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";
//import "../installed_contracts/zeppelin/contracts/lifecycle/Pausable.sol";

/** @title Escrow storage. */
contract Escrow is Ownable {

    event ReleaseCount(uint productId, uint count, bool fundsDisbursed);
    event RefundCount(uint productId, uint count, bool fundsDisbursed);
    
    mapping(address => bool) private accessAllowed;
    
    address platformOwnerAddress;
    address buyerAddress;
    address storeOwnerAddress;
    address adminArbiterAddress;
    uint private productId;
    uint public amount;
    string private productName;
    
    mapping(address => bool) releaseAmount;
    mapping(address => bool) refundAmount;
    uint public releaseCount;
    uint public refundCount;
    bool public fundsDisbursed;

    //pointer to the Agora instance that created this
    address motherContract;

    /** @dev Restricts functions to allowed addresses only. */
    modifier platformOnly() {
        require(
            accessAllowed[msg.sender] == true,
            "This is restricted to allowed accounts."
        );
        _;
    }
    
    /** @dev Constructor function.
      * @param _platformOwnerAddress address of owner of platform.
      * @param  _productId productId associated with this escrow.
      * @param  _buyerAddress address of buyer of the product.
      * @param  _storeOwnerAddress address of the store owner.
      * @param  _adminArbiterAddress address of the admin who is arbiter for this escrow.
      */
    constructor ( 
        address _platformOwnerAddress,
        uint _productId,
        string _productName,
        address _buyerAddress, 
        address _storeOwnerAddress, 
        address _adminArbiterAddress 
    ) public payable {
        //only the following can access: platform owner, buyer, seller, admin arbiter
        accessAllowed[_platformOwnerAddress] == true;
        accessAllowed[_buyerAddress] == true;
        accessAllowed[_storeOwnerAddress] == true;
        accessAllowed[_adminArbiterAddress] == true;

        platformOwnerAddress = _platformOwnerAddress;

        productId = _productId;
        productName = _productName;
        buyerAddress = _buyerAddress;
        storeOwnerAddress = _storeOwnerAddress;
        adminArbiterAddress = _adminArbiterAddress;
        fundsDisbursed = false;
        amount = msg.value;
        motherContract = msg.sender;
    }

    /** @dev Fallback function. */
    function () public payable { 
    }
    
    /** @dev Function that fetches the details of an escrow.*/
    function getEscrowDetails() public view returns (string, address, address, address, bool, uint, uint, uint) {
        return (productName, buyerAddress, storeOwnerAddress, adminArbiterAddress, fundsDisbursed, releaseCount, refundCount, amount);
    }
    
    /** @dev The function that requests the release of the escrow amount to the seller.
      * @param caller The ethereum address of the user requesting the release of the escrow amount to the seller.
      */
    function releaseAmountToSeller(address caller) public onlyOwner {        
        //check that funds has not yet been disbursed to storeOwner or refunded by buyer
        require(
            fundsDisbursed == false,
            "Money can only be released if the funds are still in the escrow."
        );
        
        //count the request for releasing the funds; buyer, storeOwner, and adminArbiter can request
        if (( caller == buyerAddress || caller == storeOwnerAddress || caller == adminArbiterAddress ) && releaseAmount[caller] != true )
        
        {
            releaseAmount[caller] = true;
            releaseCount += 1;
        }
        
        if ( releaseCount == 2 ) {
            fundsDisbursed = true;
            storeOwnerAddress.transfer(amount);
        } 

        emit ReleaseCount(productId, releaseCount, fundsDisbursed);
        //destroyContract();
    }
    
    /** @dev The function that requests the refund of the escrow amount to the buyer.
      * @param caller The ethereum address of the user requesting the refund of the escrow amount to the buyer.
      */
    function refundAmountToBuyer(address caller) public onlyOwner {
        //check that funds has not yet been disbursed to storeOwner or refunded by buyer
        require(
            fundsDisbursed == false,
            "Money can only be released if the funds are still in the escrow."
        );
        
        //count the request for releasing the funds; buyer, storeOwner, and adminArbiter can request
        if (( caller == buyerAddress || caller == storeOwnerAddress || caller == adminArbiterAddress ) && refundAmount[caller] != true )
        
        {
            refundAmount[caller] = true;
            refundCount += 1;
        }
        
        if ( refundCount == 2 ) {
            fundsDisbursed = true;
            buyerAddress.transfer(amount);
            
        }

        emit RefundCount(productId, refundCount, fundsDisbursed);
        
        //destroyContract();
    }
    
    /** @dev The function that requests the refund of the escrow amount to the buyer during a 
      * lockdown of the main contract; can only be called by the BlockMarket instance that created this account. 
      * @param caller The ethereum address of the user requesting the refund of the escrow amount to the buyer. 
      * This must be the buyer.
      */
    function emergencyRefundToBuyer(address caller) public onlyOwner {
        require(
            caller == buyerAddress,
            "Only the buyer can request a refund."
        );
        require(
            fundsDisbursed == false,
            "Money can only be released if the funds are still in the escrow."
        );
        fundsDisbursed = true;
        buyerAddress.transfer(amount);
        
        //destroyContract();
    }
    /*
    // remove contract
    function destroyContract() private {
        selfdestruct(platformOwnerAddress);
    }
    */

}