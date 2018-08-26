pragma solidity ^0.4.24;

//pattern: https://vomtom.at/upgrade-smart-contracts-on-chain/
import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";

/** @title Stores storage. */
contract StoresStorage is Ownable {
    
    mapping(address => bool) private accessAllowed;

    struct StoreData {
        uint storeId;
        address storeOwnerAddress;
        string name;
        string email;
        string imageLink;
        string descLink;
    }
    uint private storesCount;
    mapping(uint => StoreData) private stores;
    mapping(uint => bool) private activeStores;

    mapping(address => uint[]) private ownerToStores;

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

    /** @dev Function to fetch the details of a store.
      * @param _storeId Store id of the store to be fetched.
      */
    function getStore(uint _storeId) public view platformOnly returns(uint, address, string, string, string, string){
        //*** protect this with non-existent, large storeId */
        require(
            _storeId < storesCount,
            "The id must be within the known range."
        );
        StoreData memory store = stores[_storeId];
        return (store.storeId, store.storeOwnerAddress, store.name, store.email, store.imageLink, store.descLink);
    }

    /** @dev This function will let a store owner register a store.
      * @param _storeOwnerAddress Ethereum address of store owner.
      * @param _name Name of store.
      * @param _email Email of store.
      * @param _imageLink The ipfs link of the store's small image.
      * @param _descLink The ipfs link of the store's description.
      */
    function addStore(
        address _storeOwnerAddress, 
        string _name, 
        string _email, 
        string _imageLink, 
        string _descLink
    ) public platformOnly {   
        StoreData memory store = StoreData(storesCount, _storeOwnerAddress, _name, _email, _imageLink, _descLink);
        stores[storesCount] = store;
        activeStores[storesCount] = true;

        //save in relation to store owner
        ownerToStores[_storeOwnerAddress].push(storesCount);
        storesCount++;
    }

    /** @dev Function to get the store id of all stores owned by the store owner.
      * @param _storeOwnerAddress Ethereum address of storm owner.
      * @return _stores An array of store id.
      */
    function getStoresOfOwner(address _storeOwnerAddress) public view platformOnly returns(uint[] _stores){
        return (ownerToStores[_storeOwnerAddress]);
    }

    /** @dev Function that retrieves the count of stores.
      * @return storesCount The total number of stores.
      */
    function getStoresCount() public view platformOnly returns(uint) {
        return storesCount;
    }

    /** @dev Function that checks if the store is active.
      * @param _storeid Id of the store.
      * @return isActive True if product is active.
      */
    function verifyActiveStore(uint _storeid) public view platformOnly returns(bool isActive) {
        isActive = activeStores[_storeid];
    }

    /** @dev Function that allows the store owner to activate or deactivate a store.
      * @param _storeId Id of the store.
      * @param _activate True to activate and false to deactivate.
      * @param caller The ethereum address of the user requesting the change of state; 
      * different from msg.sender as this is called from Blockmarket contract
      */
    function activateStore(uint _storeId, bool _activate, address caller) public platformOnly {
        StoreData memory store = stores[_storeId];
        
        //only the store owner can activate/deactivate the store
        require(
            store.storeOwnerAddress == caller,
            "Only the store owner can activate a store"
        );

        activeStores[_storeId] = _activate;
    }
}