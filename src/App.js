import React, { Component } from '../node_modules/react'
import UsersBlockMarket from '../build/contracts/UsersBlockMarket.json'
import StoreBlockMarket from '../build/contracts/StoreBlockMarket.json'
import EscrowBlockMarket from '../build/contracts/EscrowBlockMarket.json'
import getWeb3 from './utils/getWeb3'

import BNavBar from './core/BNavBar';
import BStores from './core/BStores';
import BProducts from './core/BProducts';

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'
import { Route, Redirect, Switch,} from 'react-router-dom';

import Administrators from './users/Administrators';
import { Tooltip } from 'reactstrap';
import q from 'q';

class App extends Component {
  
    constructor(props) {
        super(props)

        this.state = {
          web3: null,
          activeAccount: null,
          usersBlockMarketInstance: null,
          storeBlockMarketInstance: null,
          escrowBlockMarketInstance: null,
          role: "",
          roleDesc:"",
          accounts: [
          ],
          storesOfOwner:[],
          allStores: [],
          tooltipOpen: false,
          disbursedToSeller: 0
        }
      
        this.instantiateContract = this.instantiateContract.bind(this);
        this.refreshAccounts = this.refreshAccounts.bind(this);
        this.checkRole = this.checkRole.bind(this);
        this.toggleTooltip = this.toggleTooltip.bind(this);
        this.getStoresOfOwner = this.getStoresOfOwner.bind(this);
        this.getAllStores = this.getAllStores.bind(this);
        this.pollAccounts = this.pollAccounts.bind(this);
        this.setActiveAccount = this.setActiveAccount.bind(this);
        this.getAmountDisbursedToSellers = this.getAmountDisbursedToSellers.bind(this);
    }

    toggleTooltip() {
        this.setState({
          tooltipOpen: !this.state.tooltipOpen
        });
    }

    componentWillMount() {
        this.instantiateContract()
    }

    setActiveAccount(account) {
        this.setState({activeAccount: account});
    }

    pollAccounts() {
      
        setInterval(() => {
          const {web3, activeAccount} = this.state;
          let account = web3.eth.accounts[0];
          if (account !== activeAccount){//save this the first time app gets the account from web3
            
            this.setState({accounts: web3.eth.accounts});
            this.setState({activeAccount: account});
            const theWeb3 = this.state.web3;
            theWeb3.defaultAccount = this.state.activeAccount;
            this.setState({web3: theWeb3});
            this.checkRole();
          }
        }, 1000);
    }

    async refreshAccounts() {
        
        if( this.state.web3 === null){
            return;
        }
        // Get accounts.
        this.state.web3.eth.getAccounts((error, accounts) => {
            this.setState({accounts: accounts});
            this.setState({activeAccount: accounts[0]});
            const theWeb3 = this.state.web3;
            theWeb3.defaultAccount = this.state.activeAccount;
            this.setState({web3: theWeb3});
            if(this.state.usersBlockMarketInstance !== null && this.state.activeAccount !== null){
              this.checkRole();
            }
        });
    }

    instantiateContract() {
        
        getWeb3
        .then(results => {
            this.setState({
                web3: results.web3
            });

            // Instantiate contract once web3 provided.
            const contract = require('truffle-contract');
            const usersBlockMarket = contract(UsersBlockMarket);
            const storeBlockMarket = contract(StoreBlockMarket);
            const escrowBlockMarket = contract(EscrowBlockMarket);
            usersBlockMarket.setProvider(this.state.web3.currentProvider);
            storeBlockMarket.setProvider(this.state.web3.currentProvider);
            escrowBlockMarket.setProvider(this.state.web3.currentProvider);

            q.all([usersBlockMarket.deployed(), storeBlockMarket.deployed(),escrowBlockMarket.deployed()])
                .spread((usersBlockMarketInstance, storeBlockMarketInstance, escrowBlockMarketInstance)=> {
                    this.setState({usersBlockMarketInstance});
                    this.setState({storeBlockMarketInstance});
                    this.setState({escrowBlockMarketInstance});
                    this.pollAccounts();
                }
            );
        })
        .catch(() => {
          console.log('Error getting web3.')
        })
    }

  



    async checkRole(){
        
        const rolesDescDictionary = {
            platformOwner: "Empowers you to create admins. Admins become arbiters of escrows. Admins create store owners.",
            admin: "Enables you to create store owners. You may also be picked to become an arbiter of an escrow.",
            storeOwner: "You can create stores and products in the marketplace.",
            user: "You can buy products."
        }

        const {usersBlockMarketInstance, escrowBlockMarketInstance} = this.state;

        if(usersBlockMarketInstance === null){
            this.instantiateContract();
            return;
        }
        this.getAllStores();
        let marketplaceOwner = await usersBlockMarketInstance.owner();
        if (marketplaceOwner === this.state.activeAccount){
            this.setState({role: "Marketplace Owner"});
            this.setState({roleDesc: rolesDescDictionary["platformOwner"]})
            this.getAmountDisbursedToSellers(escrowBlockMarketInstance);
            return;
        }
        this.setState({disbursedToSeller: 0});

        let isAdmin = await usersBlockMarketInstance.checkIfActiveAdmin.call(this.state.activeAccount);
        if (isAdmin){
            this.setState({role: "Admin"});
            this.setState({roleDesc: rolesDescDictionary["admin"]})
            return;
        }
        let isStoreOwner = await usersBlockMarketInstance.checkIfActiveStoreOwner.call(this.state.activeAccount);
        if (isStoreOwner){
            this.setState({role: "Store Owner"});
            this.setState({roleDesc: rolesDescDictionary["storeOwner"]})
            this.getStoresOfOwner();
            
            return;
        }
        this.setState({role: "User"});
        this.setState({roleDesc: rolesDescDictionary["user"]})
    }

    async getAllStores() {
      const {storeBlockMarketInstance} = this.state;
      let theStores = [];
      let countOfStores = await storeBlockMarketInstance.getStoresCount();
      

      for (let counter = 0; counter < countOfStores; counter++){
          let oneStore = await storeBlockMarketInstance.getStoreDetails(counter);
          const myStore = {
              storeid: oneStore[0].toString(),
              ownerAddress: oneStore[1],
              storeName: oneStore[2],
              storeEmail: oneStore[3],
              imageLink: oneStore[4],
              descLink: oneStore[5]
          }
          theStores.push(myStore);
      };
      this.setState({allStores: theStores});
    }

    async getStoresOfOwner() {
          
      const {storeBlockMarketInstance, role} = this.state;
      console.log("role in getStores: ", role);
      
      if(storeBlockMarketInstance === null){
          //set web3 and contract instance first
          console.log("blockmarket is null...");
          //this.instantiateContract();
          
      }else{
          let theStores = [];

          if (role === "Store Owner"){ //show only stores owned
              let storeIds = await storeBlockMarketInstance.getStoresOfOwner(this.state.activeAccount);
              console.log("store ids of owner: ", storeIds);

              for ( let counter = 0; counter < storeIds.length; counter++){
                  let oneStore = await storeBlockMarketInstance.getStoreDetails(storeIds[counter]);
                  console.log("one store is: ", oneStore);
                  const myStore = {
                      storeid: oneStore[0].toString(),
                      ownerAddress: oneStore[1],
                      storeName: oneStore[2],
                      storeEmail: oneStore[3]
                  };
                  theStores.push(myStore);
              }
          }
          this.setState({storesOfOwner: theStores});
      }
    }

    async getAmountDisbursedToSellers(escrowBlockMarketInstance){
        const amountSold = await escrowBlockMarketInstance.getAmountDisbursedToSeller();

        console.log("amount sold: ", parseInt(amountSold, 10));
        this.setState({disbursedToSeller: parseInt(amountSold, 10)});
    }

    render() {

      let stores;
        if (this.state.role === "Store Owner"){
            stores = this.state.storesOfOwner;
        }else{
            stores = this.state.allStores;
        }

      return (
        <div className="App">
          <BNavBar />  
          <main className="container">
            <div style={{paddingBottom: 30}}>
              <h5>Your active Eth account: {this.state.activeAccount === null ? "" : this.state.activeAccount}</h5>
              <p>Your role: <span style={{textDecoration: "underline", color:"blue"}} id="roleValue" >{this.state.role}</span> </p>
              { this.state.disbursedToSeller > 0 ?
                <p>Successful Payments to Store Owners: {this.state.disbursedToSeller}</p>
                :
                <p></p>
              }

              <Tooltip placement="right" isOpen={this.state.tooltipOpen} target="roleValue" toggle={this.toggleTooltip}>
              {this.state.roleDesc}
              </Tooltip>
            </div>
            <div className="pure-g">
              <div className="pure-u-1-1">
                <Switch>
                  <Route
                    path='/setup'
                    render={
                      (props) => 
                        <Administrators {...props} 
                          web3={this.state.web3} 
                          usersblockmarket={this.state.usersBlockMarketInstance}
                          storesblockmarket={this.state.storeBlockMarketInstance}
                          activeAccount={this.state.activeAccount}
                          role={this.state.role}
                          storeCount={this.state.storeCount}
                          stores={stores}
                          checkRole={this.checkRole}
                          instantiateContract={this.instantiateContract}
                        />
                    }
                  />
                  <Route
                    exact path='/stores'
                    render={
                      (props) => 
                        <BStores 
                            {...props} 
                            refreshAccounts={this.refreshAccounts} 
                            web3={this.state.web3} 
                            activeAccount={this.state.activeAccount}
                            role={this.state.role}
                            stores={this.state.allStores}
                        />
                    }
                  />
                  <Route
                    exact path='/stores/:storeid'
                    render={
                        (props) => 
                            <BProducts 
                                {...props} 
                                refreshAccounts={this.refreshAccounts} 
                                web3={this.state.web3} 
                                usersblockmarket={this.state.usersBlockMarketInstance}
                                storesblockmarket={this.state.storeBlockMarketInstance} 
                                escrowsblockmarket={this.state.escrowBlockMarketInstance}
                                instantiateContract={this.instantiateContract}
                                activeAccount={this.state.activeAccount}
                                role={this.state.role}
                                stores={this.state.allStores}
                            />}
                  />
                  <Redirect exact from="/" to="/stores"/>
                </Switch>
              </div>
            </div>
          </main>
        </div>
      );
    }
  }

  export default App
