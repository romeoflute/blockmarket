pragma solidity ^0.4.24;

//pattern: https://vomtom.at/upgrade-smart-contracts-on-chain/
import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";

/** @title Products storage. */
contract ProductsStorage is Ownable {
    
    mapping(address => bool) private accessAllowed;
    enum ProductStatus { Sale, Reserved, Sold, Refunded }  
    struct ProductData {
        uint productId;
        address storeOwnerAddress;
        string name;
        uint price;
        string imageLink;
        string descLink;
        ProductStatus status;
        address buyer;
    }

    uint private productsCount;
    mapping(uint => ProductData) products;
    
    //used later to deactivate products
    mapping(uint => bool) private activeProducts;
    
    //save reference of store key to product keys
    mapping(uint => uint[]) private storeProducts;

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

    /** @dev Function that retrieves the count of products.
      * @return productsCount The total number of products.
      */
    function getProductsCount() public view platformOnly returns(uint) {
        return productsCount;
    }

    /** @dev Function that lets a store owner add a product.
      * @param _storeId Id of the associated store.
      * @param _storeOwnerAddress Ethereum address of the store owner.
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
    ) public platformOnly {
        ProductData memory oneProduct;
        oneProduct.productId = productsCount;
        productsCount++;

        oneProduct.storeOwnerAddress = _storeOwnerAddress;
        oneProduct.name = _name;
        oneProduct.price = _price;
        oneProduct.imageLink = _imageLink;
        oneProduct.descLink = _descLink;
        oneProduct.status = ProductStatus.Sale;

        products[oneProduct.productId] = oneProduct;
        activeProducts[oneProduct.productId] = true;
        storeProducts[_storeId].push(oneProduct.productId);
    }

    /** @dev Function that retrieve a store's array of product id's .
      * @param _storeId Id of the store.
      * @return _productIDs array of product id's.
      */
    function getProductsOfStore(uint _storeId) public view platformOnly returns(uint[] _productIDs) {
        _productIDs = storeProducts[_storeId];
        return _productIDs;
    }

    
    
    /** @dev Function that updates the product details.
      * @param _productId Id of the product.
      * @param _name Name of the product.
      * @param _price Price of the product.
      * @param _imageLink Ipfs link of the image of the product.
      * @param _descLink Ipfs link of the description of the product.
      */
    function updateProductsDetails(
        uint _productId,  
        string _name, 
        uint _price, 
        string _imageLink, 
        string _descLink
    ) public platformOnly {
        ProductData storage oneProduct = products[_productId];
        //if (keccak256(oneProduct.name) != keccak256(_name)){
        oneProduct.name = _name;
        //}
        //if (keccak256(oneProduct.imageLink) != keccak256(_imageLink)) {
        oneProduct.imageLink = _imageLink;
        //}
        //if (keccak256(oneProduct.imageLink) != keccak256(_imageLink)) {
        oneProduct.descLink = _descLink;
        //}
        //if (oneProduct.price != _price) {
        oneProduct.price = _price;
        //}
    }

    /** @dev Function that checks if the product is active.
      * @param _productId Id of the product.
      * @return isActive True if product is active.
      */
    function verifyActiveProduct(uint _productId) public platformOnly view returns (bool isActive) {
        isActive = activeProducts[_productId];
    }
    
    /** @dev Function that retrieves the details of a product.
      * @param _productId Id of the product.
      * @return productId Id of the product.
      * @return name Name of the product.
      * @return price Price of the product.
      * @return storeOwnerAddress Ethereum address of the store owner.
      * @return imageLink Ipfs link of the image of the product.
      * @return descLink Ipfs link of the description of the product.
      * @return status Status whether Sale, Sold, Refunded.
      * @return buyer Ethereum address of the buyer of this product.
      */
    function getProduct(uint _productId) 
        public view platformOnly returns (
            uint, 
            address, 
            string, 
            uint, 
            string, 
            string, 
            uint, 
            address) {
        ProductData memory product = products[_productId];
        return (
            product.productId, 
            product.storeOwnerAddress, 
            product.name, 
            product.price, 
            product.imageLink,
            product.descLink, 
            uint(product.status), 
            product.buyer );
    } 
    /** @dev Function to retrieve just the store owner and price of a product.
      * @param _productId Id of the product.
      * @return storeOwnerAddress Ethereum address of the store owner.
      * @return price Price of the product.
      */
    function getProductOwnerAndPrice(uint _productId) 
        public view platformOnly returns (address, uint) {
        ProductData memory product = products[_productId];
        return (product.storeOwnerAddress, product.price);
    }

    /** @dev Function to update the product status using either Sale, Reserved, Sold, or Refunded.
      * @param _productId Id of the product.
      * @param productStatus Status which can either be  Sale, Reserved, Sold, or Refunded.
      */
    function updateProductStatus(uint _productId, uint productStatus) 
        public platformOnly {
        ProductData storage product = products[_productId];
        
        product.status = ProductStatus(productStatus);
        products[_productId] = product;
    }

    /** @dev Function to update the buyer of the product.
      * @param _productId Id of the product.
      * @param buyer  Address of the buyer.
      */
    function updateBuyer(uint _productId, address buyer) 
        public platformOnly {
        ProductData storage product = products[_productId];
        
        product.buyer = buyer;
        products[_productId] = product;
    }

    /** @dev Function that allows the store owner to activate or deactivate a product.
      * @param _productId Id of the product.
      * @param _activate True to activate and false to deactivate.
      * @param caller The ethereum address of the user requesting the change of state; 
      * different from msg.sender as this is called from Blockmarket contract
      */
    function activateProduct(uint _productId, bool _activate, address caller) public platformOnly {
        ProductData memory product = products[_productId];
        //only the store owner can activate/deactivate the product
        require(
            product.storeOwnerAddress == caller,
            "Only the store owner can activate a product"
        );
        activeProducts[_productId] = _activate;
    }
}