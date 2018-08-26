
const assert = require('assert');
let UsersBlockMarket = artifacts.require("./UsersBlockMarket.sol");
let StoreBlockMarket = artifacts.require("./StoreBlockMarket.sol");
let EscrowBlockMarket = artifacts.require("./EscrowBlockMarket.sol");

    /** @dev Important: Be sure to deploy the contracts before running these tests by going to the console:
     * first, cd to the root directory of the project, 
     * then to set up the accounts server with maximum gas, run: ganache-cli -l 7984452
     * then to compile the contracts, run: truffle compile, 
     * then to deploy the contracts to the blockchain, run: truffle migrate --reset;
     * only then should you finally run: truffle test
     */
contract('BlockMarket Logic Contracts', function(accounts) {

    let usersBlockMarket;
    let storeBlockMarket;
    let escrowBlockMarket;
    const [firstAccount, secondAccount, thirdAccount, fourthAccount] = accounts;

    // console.log("firstAccount: ", firstAccount);
    // console.log("secondAccount: ", secondAccount);
    // console.log("thirdAccount: ", thirdAccount);
    // console.log("fourthAccount: ", fourthAccount);


    let price = 1000;

    /** @dev The first three contracts are those that contain the logic
    * and are accessed by the user via the web front-end:
    * 1. UsersBlockMarket (for all logic regarding users)
    * 2. StoreBlockMarket (for all logic regarding stores and products)
    * 3. EscrowBlockMarket (for all logic regarding buying the product and escrows)
    * Data are stored in storage contracts that are accessible only via the 
    * logic contracts (Note: Separation is an upgrade feature so that one need not upgrage data contracts
    * with bugs in the storage contracts. Exclusivity of access through logic contracts is
    * also a security feature).
    * So although we seem to test only the first three, the storage contracts are actually also 
    * tested because data storage is through them.
    */
    beforeEach('setup frontend contracts for each test', async function () {
        usersBlockMarket = await UsersBlockMarket.deployed();
        storeBlockMarket = await StoreBlockMarket.deployed();
        escrowBlockMarket = await EscrowBlockMarket.deployed();
    })
  
    /** @dev The first three contracts inherit from Zepellin contracts including
        * 1. Ownable (making each have owner property)
        * This saves the deployer address as the marketplace owner
        * The marketplace owner can create admins
    */
    describe ('Marketplace Owner', () => {
        it("sets address of deployer as owner of the UsersBlockMarket", async () => {
            let marketplaceOwner = await usersBlockMarket.owner();
            assert.equal(marketplaceOwner, firstAccount);
            });
        it("sets same address of deployer as owner of the StoreBlockMarket", async () => {
            let marketplaceOwner = await storeBlockMarket.owner();
            assert.equal(marketplaceOwner, firstAccount);
        });
        it("sets same address of deployer as owner of the EscrowBlockMarket", async () => {
            let marketplaceOwner = await escrowBlockMarket.owner();
            assert.equal(marketplaceOwner, firstAccount);
        });

        it("allows marketplace owner to add admin", async () => {
            await usersBlockMarket.registerAdmin(secondAccount, "Fia", "fia@gmail.com", {from: firstAccount});
            let count = await usersBlockMarket.getTotalAdmins({from:firstAccount});
            assert.equal(count.valueOf(), 1);
        });

        it("disallows others beside marketplace owner from adding admins", async () => {
            try{
                await usersBlockMarket.registerAdmin(thirdAccount, "Kinah", "kinah@gmail.com", {from: secondAccount});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });

        it("confirm that second account address is now an active admin", async () => {
            let isAdmin = await usersBlockMarket.checkIfActiveAdmin.call(secondAccount, {from: firstAccount});
            assert.equal(isAdmin, true);
        });
    
        it("disallows adding as admin an already existing admin account", async () => {
            try{
                await usersBlockMarket.registerAdmin(secondAccount, "Fia", "fia@gmail.com", {from: firstAccount});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });
    })  
    
    /** @dev The secondAccount is now an Admin. Admins can:
        * 1. Register store owners
        * 2. Later on, an admin is automatically picked as an arbiter when an escrow is generated
        * This section tests number 1, registering of store owners. 
    */
    describe ('Admin', async () => {
        it("allows admin to register a store owner", async () => {
            await usersBlockMarket.registerStoreOwner(thirdAccount, "Romeo", "rflauta@codedisruptors.com", {from: secondAccount});
            let isStoreOwner = await usersBlockMarket.checkIfActiveStoreOwner.call(thirdAccount, {from: secondAccount});
            assert.equal(isStoreOwner, true);
        });

        it("disallows others besides an Admin from adding store owners", async () => {
            try{//third account is not admin
                await usersBlockMarket.registerStoreOwner(fourthAccount, "Kinah", "kinah@gmail.com", {from: thirdAccount});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });
        /**@dev: This will prevent abuse of the escrow arrangement"*/
        it("disallows an admin from adding a current admin as store owner", async () => {
            try{//third account is admin
                await usersBlockMarket.registerStoreOwner(thirdAccount, "Kate", "kate@gmail.com", {from: thirdAccount});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });
        /**@dev: This will prevent abuse of the escrow arrangement"*/
        it("disallows an admin from adding the platform owner as store owner", async () => {
            try{//third account is admin
                await usersBlockMarket.registerStoreOwner(firstAccount, "Kate", "kate@gmail.com", {from: thirdAccount});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });
    })
    
    /** @dev The thirdAccount is now a Store Owner. Store owners can:
        * 1. Register stores
        * 2. Register products
    */
    describe ('Store owner', () => {
        it("Store owner can register stores", async () => {       
            await storeBlockMarket.createStore("Store A", "a@gmail.com", "imageLink", "descLink", {from: thirdAccount});
            let isActiveStore = await storeBlockMarket.checkIfActiveStore.call(0, {from: thirdAccount});
            assert.equal(isActiveStore, true);
        });
        
        it("allows Store owner to register products", async () => {
            let productName = "Vita Plus 500ml";
            await storeBlockMarket.addProduct(0, thirdAccount, productName, price, "imageLink", "desckLink", {from: thirdAccount});
            
            let tupleProduct = await storeBlockMarket.getProductDetails.call(0, {from: thirdAccount});
            assert.equal(tupleProduct[2], productName);
        }); 
        it("disallows others besides a store owner from adding a store", async () => {
            try{//fourth account is not a store owner
                await storeBlockMarket.createStore("Store A", "a@gmail.com", "imageLink", "descLink", {from: fourthAccount});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });
        it("disallows others besides a store owner from adding a product", async () => {
            try{//fourth account is not a store owner
                let productName = "Vita Plus 500ml";
                await storeBlockMarket.addProduct(0, fourthAccount, productName, price, "imageLink", "desckLink", {from: fourthAccount});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });
    })
  
    /** @dev As of now, we have the following accounts:
        * 1. Accounts[0] as the Marketplace Owner (firstAccount)
        * 2. Accounts[1] as an Admin (secondAccount)
        * 3. Accounts [2] as a Store Owner (thirdAccount)
        * A product can be bought by any account except Admin and Marketplace Owner to 
        * prevent abuse of the escrow arrangement
        * When bought, the product status changes from 0 (Sale) to 1 (Reserved)
    */
    describe ('Product', () => {
        it("A product would have an initial state of Sale", async () => {
            const tupleProductOriginal = await storeBlockMarket.getProductDetails.call(0, {from: fourthAccount});
            assert.equal(tupleProductOriginal[6].valueOf(), 0); //0 meaning Reserved
        });
        it("A product would initially have no buyer", async () => {
            const escrowInfo = await storeBlockMarket.getProductDetails.call(0, {from: fourthAccount});
            assert.equal(escrowInfo[7].toString(), "0x0000000000000000000000000000000000000000");
        });

        it("A product can be bought changing its state to Reserved", async () => {
            const tupleProductOriginal = await storeBlockMarket.getProductDetails.call(0, {from: fourthAccount});
            const productPrice = tupleProductOriginal[3];
            await escrowBlockMarket.buy(0, {from: fourthAccount, to: escrowBlockMarket.address, value: productPrice});
            let tupleProductUpdated = await storeBlockMarket.getProductDetails.call(0, {from: fourthAccount});
            assert.equal(tupleProductUpdated[6].valueOf(), 1); //1 meaning Reserved
        });
        it("A product, after being paid for, would have a buyer address", async () => {
            const escrowInfo = await storeBlockMarket.getProductDetails.call(0, {from: fourthAccount});
            assert.equal(escrowInfo[7], fourthAccount);
        });
    }) 

    /** @dev An escrow is a contract with 3 members, the buyer, seller, and admin arbiter:
        * 1. The money is transferred from the seller who bought the product to this escrow
        * 2. Each of the three members may request once to move the money either to the seller
        * as payment or to the buyer as refund 
        * 3. Two requests either for refund or release to buyer will transfer the money from the escrow
    */
    describe ('Escrow', () => {
        it("buying a product will create an escrow with the buyer address saved to the escrow", async () => {
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(0);
            assert.equal(escrowInfo[1], fourthAccount);
        });
        it("buying a product will create an escrow with the payment passed to the escrow", async () => {
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(0);
            assert.equal(escrowInfo[7].valueOf(), price);
        });
        it("buying a product will create an escrow with the admin arbiter encoded in the escrow", async () => {
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(0);
            assert.equal(escrowInfo[3], secondAccount);
        }); 
        it("buying a product will create an escrow with the seller encoded in the escrow", async () => {
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(0);
            assert.equal(escrowInfo[2], thirdAccount);
        });
        
        it("Two requests for payment to seller coming from the buyer, seller, or admin arbiter,  will release the amount to the seller", async () => {
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(0); //0 here is the product id
            let buyerAddress = escrowInfo[1];
            let storeOwnerAddress = escrowInfo[2];
            let adminArbiterAddress = escrowInfo[3];

            let initialSellerBalance = await web3.eth.getBalance(storeOwnerAddress).toString(10);
            
            //first request to release amount
            await escrowBlockMarket.releaseAmountToStoreOwner(0, {from: adminArbiterAddress});
            let releaseRefundTupple = await escrowBlockMarket.getReleaseRefundCounts(0); //0 here is the product id

            //second request to release amount
            await escrowBlockMarket.releaseAmountToStoreOwner(0, {from: buyerAddress});

            let finalSellerBalance = await web3.eth.getBalance(storeOwnerAddress).toString(10);

            if(finalSellerBalance > initialSellerBalance){
                assert(true);
            }else{
                assert(false);
            }
        });
    
        it("Two requests for refund to buyer coming from the buyer, seller, or admin arbiter, will refund the amount to the buyer", async () => {
            let productName = "Soya Plus 1000ml";
            let productPrice = 3000000000000000000;
            await storeBlockMarket.addProduct(0, thirdAccount, productName, productPrice, "imageLink", "desckLink", {from: thirdAccount}); //0 here is a store id     
            await escrowBlockMarket.buy(1, {from: fourthAccount, to: escrowBlockMarket.address, value: productPrice, gas: 2000000});// 1 is the product id
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(1);
            let buyerAddress = escrowInfo[1];
            let storeOwnerAddress = escrowInfo[2];
            let adminArbiterAddress = escrowInfo[3];

            let initialBuyerBalance = await web3.eth.getBalance(buyerAddress).toString(10);
            await escrowBlockMarket.refundAmountToBuyer(1, {from: adminArbiterAddress});
            await escrowBlockMarket.refundAmountToBuyer(1, {from: buyerAddress});
            let finalBuyerBalance = await web3.eth.getBalance(buyerAddress).toString(10);

            //assert(false);
            if(finalBuyerBalance > initialBuyerBalance){
                assert(true);
            }else{
                assert(false);
            }
        });

        it("two refund requests from the same account, example from the admin arbiter, will only be counted once", async () => {
            let productName = "Orange Drink Plus 1000ml";
            let productPrice = 3000000000000000000;
            await storeBlockMarket.addProduct(0, thirdAccount, productName, productPrice, "imageLink", "desckLink", {from: thirdAccount}); //0 here is a store id     
            await escrowBlockMarket.buy(2, {from: fourthAccount, to: escrowBlockMarket.address, value: productPrice, gas: 2000000});// 2 is the product id
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(2); //product id is 2
            let buyerAddress = escrowInfo[1];
            let storeOwnerAddress = escrowInfo[2];
            let adminArbiterAddress = escrowInfo[3];

            
            await escrowBlockMarket.refundAmountToBuyer(2, {from: adminArbiterAddress});
            await escrowBlockMarket.refundAmountToBuyer(2, {from: adminArbiterAddress});
            
            let escrowInfoFinal = await escrowBlockMarket.getEscrowInfo(2); //product id is 2
            assert.equal(escrowInfoFinal[6].valueOf(), 1); //refund count == 1
        });
        it("two release to seller requests from the same account, example from the admin arbiter, will only be counted once", async () => {
            let productName = "Bitter Drink Plus 1000ml";
            let productPrice = 4000000000000000000;
            await storeBlockMarket.addProduct(0, thirdAccount, productName, productPrice, "imageLink", "desckLink", {from: thirdAccount}); //0 here is a store id     
            await escrowBlockMarket.buy(3, {from: fourthAccount, to: escrowBlockMarket.address, value: productPrice, gas: 2000000});// 3 is the product id
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(3); //product id is 2
            let buyerAddress = escrowInfo[1];
            let storeOwnerAddress = escrowInfo[2];
            let adminArbiterAddress = escrowInfo[3];

            await escrowBlockMarket.releaseAmountToStoreOwner(3, {from: adminArbiterAddress});//3 is product id
            await escrowBlockMarket.releaseAmountToStoreOwner(3, {from: adminArbiterAddress});
            let escrowInfoFinal = await escrowBlockMarket.getEscrowInfo(3);
            assert.equal(escrowInfoFinal[5].valueOf(), 1); //release count == 1
        });
    })
  
      
    describe ('Pause, Unpause', () => {
        it("Pausing BlockMarket will disallow addProduct()", async () => {
            let productName = "Ancient Plus 1000ml";
            let price = 3000000000000000000;
            storeBlockMarket.pause();
            
            try{
                await storeBlockMarket.addProduct(0, thirdAccount, productName, price, "imageLink", "desckLink", {from: thirdAccount});      
                assert(false);
            } catch (err) {
                assert(err);
            }
        })

        it("Unpausing BlockMarket will allow addProduct() again", async () => {
            let productName = "Ancient Plus 1000ml";
            let price = 3000000000000000000;
            storeBlockMarket.unpause();
            try{
                await storeBlockMarket.addProduct(0, thirdAccount, productName, price, "imageLink", "desckLink", {from: thirdAccount});      
                assert(true);
            } catch (err) {
                assert(false);
            }
        })
        
        it("When unpaused, the buyer cannot simply withdraw the contract amount", async () => {
            let price = 3000000000000000000;
            await escrowBlockMarket.buy(4, {from: fourthAccount, to: escrowBlockMarket.address, value: price, gas: 2000000});
            try{
                await escrowBlockMarket.buyerWithdraw(4);
                assert(false);
            } catch (err) {
                assert(err);
            }
        })

        it("When paused, the buyer can withdraw the contract amount if allowed by owner", async () => {

            escrowBlockMarket.pause();
            escrowBlockMarket.allowBuyerWithdrawal(true);
            let escrowInfo = await escrowBlockMarket.getEscrowInfo(4);

            let initialBuyerBalance = await web3.eth.getBalance(fourthAccount).toString(10);

            //buyer tries to withdraw
            await escrowBlockMarket.buyerWithdraw(4, {from: escrowInfo[1], gas: 400000});

            let finalBuyerBalance = await web3.eth.getBalance(fourthAccount).toString(10);
            
            storeBlockMarket.unpause();
            assert(finalBuyerBalance.valueOf() > initialBuyerBalance.valueOf());
        })
    })
});

