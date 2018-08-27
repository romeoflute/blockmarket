# BlockMarket

BlockMarket is a marketplace proof of concept POC consisting of a set of smart contracts written in Solidity and a ReactJS web frontend. It is my project for the 2018 Consensys Developer program. - Romeo (rflauta@codedisruptors.com)

## Important

The current website will only run properly if you have the following: 
- truffle for deploying the contracts
- a running Ganache server 
- Metamask extension in Chrome with at least four (4) accounts imported from Ganache.The accounts should contain eth 
- open the website in Chrome (or another with Metamask extension)
- an IPFS server for the store and product images as well as descriptions

Follow the instructions in the **Installation** section. 

## Basic Flow

  1. Upon deployment of the contracts, the Ethereum address of the deployer becomes the Platform Owner. A Platform Owner can add Administrators (Admins). 
  2. An Admin can register a Store Owner. 
  3. A Store Owner can register stores and products. Each product is added to a store. The idea is to treat each product as a unique entity, such as when selling pre-loved (second-hand) products where each product is unique.
  4. A store can have an associated picture and description. These are saved in IPFS (see https://ipfs.io/) as files. IPFS is a distributed file system.
  5. A user who is not the Platform Owner or an Admin can buy a product.
  6. When a user buys a product, an Escrow contract is generated and the payment is stored in the escrow. An admin is also picked automatically from the pool of Admins and assigned as arbiter for the escrow. 
  7. The Escrow keeps track of the addresses of the buyer, seller (Store Owner), and the Admin arbiter. 
  8. Any of the three above, would be able to request the transfer of the fund from the contract to the Store Owner, or from the contract to the buyer as a refund.
  9. When two requests are made, either for the release of the escrowed fund to the Store Owner, or a refund to the buyer, then the fund is disbursed. 

## Using the Front-end ReactJS website

The ReactJS front-end website contains two navigation views:
  - **SETUP**: The setup view handles items 2-4 of the Basic Flow above: adding Admins, Store Owners, stores, and products.
  - **STORES**: This view initially displays the registered stores in the platform. When a user taps **Browse Products** then the set of products for that store is displayed.  
  - From here, the user may tap **Buy** to buy a product. The amount, equivalent to the price, will be transferred from the user account to a newly generated escrow contract with an arbiter picked from the set of Admins and assigned to this escrow.
  - The previous _Buy_ button will now become the _Display Escrow_ button. The Store Owner, buyer, and the assigned Admin arbiter may view the escrow and request for either _Refund to Buyer_ or _Release Fund to Seller_ in order to disburse the fund from the contract. Each of the three can only request once. Fund transfer will happen, either to release or refund, after the escrow contract receives a total of two requests from the Admin, Store Owner, or buyer. 

## Technologies

BlockMarket uses a number of technologies:

* IPFS - decentralized storage of files for saving images and texts
* Solidity - language for smart contracts 
* Truffle - development suite
* Ganache - for creating sample accounts and running a local blockchain
* Metamask - for logging in into accounts and connecting to the local Ganache network
* Chrome - hosting the Metamask extension
* npm - for installing the package dependencies
* ReactJS - for the frontend website

## Installation

BlockMarket has only been tested on [Node.js](https://nodejs.org/) v9.4.0.

1.Install Truffle (https://truffleframework.com/docs/truffle/getting-started/installation)

```sh
$ npm install -g truffle
```

2.Install and run Ganache. 
(https://truffleframework.com/docs/ganache/quickstart)
(https://github.com/trufflesuite/ganache-cli)

```sh
$ npm install -g ganache-cli
$ ganache-cli -l 7984452
```
Keep Ganache running at all times. If you need to use the Terminal, use another tab. Take note of the 10 generated accounts, the mnemonic, and the private keys. 

3.Open Chrome and install the Metamask extension (https://metamask.io/).

If you have Chrome installed, log out from your current accounts. Import the first four accounts from Ganache. It is important that the first account in Ganache will be one of the four as that would be the default account in Ganache. When we deploy the contracts in Ganache, the first account will become the Platform Owner. The three others would be used as Admin, Store Owner, and User (who will buy). 

Import accounts by copy-pasting the private keys of the Ganache accounts into Metamask. 

4.Download, install, initialize then run the IPFS server for saving images and files. The image and description for the stores and products are saved and stored through IPFS. In production, the IPFS server can be served from Amazon Web Server and other hosting sites though the files are saved in a distributed system.
(https://ipfs.io/docs/install/)
(https://ipfs.io/docs/getting-started/)

After downloading and installing IPFS, initialize the local IPFS node: 

```sh
$ cd go-ipfs
$ ./ipfs init
```
Set the configurations then run the server: 

```sh
$ ./ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
$ ./ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods "[\"PUT\", \"POST\", \"GET\"]"
$ ./ipfs daemon
```
If you are unable to install IPFS, then you can still test but without adding images and descriptions to stores and products.

5.Clone or download the BlockMarket code from the repository and open the root folder in your IDE (I use Visual Studio Code but you may have a different IDE such as Sublime or Atom). 

6.Deploy the contracts using Truffle. 

In the Terminal: 

```sh
$ cd blockmarket
$ truffle compile
$ truffle migrate --reset
```
The contracts are now deployed. 

**Note:** It is important that you clone the code first, then compile and deploy contracts, before running the web server. In other words, _step 5, then 6, before 7_. 

7.Install the dependencies and devDependencies and start the server.

Back in the Terminal,

```sh
$ cd blockmarket
$ npm install
$ npm start
```
If the site does not open in Chrome, open the website in Chrome with Metamask extension installed and the first 4 Ganache accounts imported to it. 
 In MetaMask select the first account in Ganache (shown in the Terminal when you run: ganache-cli -l 7984452. Also, BE SURE to **connect MetaMask to localhost 8545** by selecting that in the dropdown in the MetaMask extension. 

In the top of the website, your account address is displayed with the role of Marketplace Owner. You may proceed to Testing the Website. 

## Testing the Basic Flow in the Website

Follow the Installation section before testing the website in Chrome. 

1.For easy access, copy the four Ethereum accounts from Ganache that you passed to Metamask to an easily accessible file. Be sure that the first account is listed also as the first in your list. This is the Marketplace Owner. This was used as the default account in Ganache during deployment (when you did truffle migrate);
2.Tap **SETUP** in the top right if it is not selected.
3.Note that at the top part of the website, you must be logged in with the role of Marketplace Owner. If not, change your account in MetaMask so you are the Marketplace Owner.
4.Add an Admin by tapping **+ Administrator** 
-Copy the next account number in your list and paste as Admin in the modal form.
-After tapping Save, allow the transaction to proceed in Metamask. 
5.Change to that Admin account in Metamask. 
6.Add a Store Owner by tapping **+ Store Owner**.
-Copy the next account number in your list and paste as Store Owner in the form.
-After tapping Save, allow the transaction to proceed in Metamask. 
7.Add a Store by tapping **+ Store**.
-If you add an image and description, be sure that your IPFS server is running (see Installation). 
-After tapping Save, allow the transaction to proceed in Metamask.
8.Add a Product by tapping **+ Product**.
-If you add an image and description, be sure that your IPFS is running. 
-After tapping Save, allow the transaction to proceed in Metamask.
9.You may add more stores and products. _Be sure_ to allow the transactions in MetaMask.
10.Change to another account in MetaMask, not the Platform Owner, Admin, or Store Owner.
11.Tap **STORES** in the top right if it is not selected.
12.Select a store by tapping its **BROWSE PRODUCTS** button. The products of that store will be displayed. 
13.Buy a product by tapping its **Buy** button. Then allow in MetaMask.
14.Wait until the Buy button becomes something like **Show Escrow**. Tap to view the Escrow. 
15.From the dropdown at the bottom, select **Release fund to Seller**. This in effect is a request from the buyer (if the logged in account is the buyer) to release the amount to the seller, perhaps after accepting the product. Again, allow the transaction to proceed in MetaMask.
16.In MetaMask, change to the Store Owner account (or alternatively, the Admin) that is displayed in the Escrow.
17.Display the Escrow again if it is not open (tap the Show Escrow at the bottom of the product), then select **Release fund to Seller**. The release count in the escrow should now be two and the funds will be released. Be sure to allow the transaction in MetaMask. 

## Running the unit tests

Important: You must have Ganache running and at least 4 accounts from Ganache imported to Metamask in Chrome. You must have previously deployed the contracts by following the Installation section above (e.g. truffle compile, truffle migrate).

Run the unit tests by going back to the Terminal: 

```sh
$ cd blockmarket
$ truffle test
```

## Feedback

Thank you very much for checking my project. This is a proof of concept (POC) webste. If you want to provide helpful feedback, please email: meoflauta@gmail.com

### Todos

 -Install IPFS in Amazon Web Service (AWS)

### License
I'm still researching licenses.
