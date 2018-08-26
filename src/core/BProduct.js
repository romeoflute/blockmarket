import React, { Component } from 'react';
import { Card, CardImg, CardBody, CardTitle, CardSubtitle, CardText, Button} from 'reactstrap';
import EscrowModal from '../modals/EscrowModal';
import NotificationModal from '../modals/NotificationModal';
const ipfsAPI = require('ipfs-api');


const centerStyle = {
    display:"flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    descContent: null
};

export default class BProduct extends Component {

  constructor(props) {
    super(props);
    this.state={
        storesAndProducts: [],
        descContent: null
    }
    this.showEscrow = this.showEscrow.bind(this);
    this.showNotice = this.showNotice.bind(this);
    this.ipfsApi = ipfsAPI('localhost', '5001');
  }


  showEscrow(){
    const {web3, product, usersblockmarket, storesblockmarket, escrowsblockmarket, activeAccount} = this.props;
    return(
      <EscrowModal 
          web3={web3} 
          usersblockmarket={usersblockmarket}
          storesblockmarket={storesblockmarket}
          escrowsblockmarket={escrowsblockmarket}
          buttonLabel={"+ Show Escrow"}
          activeAccount={activeAccount}
          style={{width: 60}}
          product={product}
      >Show Escrow
      </EscrowModal>
    )
  }

  showNotice(){
    console.log("show Notice");
    return(
      <NotificationModal
          style={{width: 60}}
          title="Restricted from Buying"
          body="The escrow arrangement involves an admin as an arbiter. Because of this and to prevent abuse, platform owner and administrators are not allowed to purchase products."
      >Show Notice
      </NotificationModal>
    )
  }

  async componentWillMount() {
    const {product} = this.props;

    const descFile = await this.ipfsApi.cat(product.descLink);
    const descContent = descFile.toString();
    this.setState({descContent: descContent});
  }
    
  render() {
    const {
      web3, 
      product, 
      storesblockmarket,
      escrowsblockmarket,
      activeAccount, 
      getProducts, 
      role, 
      setLoading
    } = this.props;
    const imageLink = 
      product.imageLink !== "NoImageLink" ? 
      'https://ipfs.io/ipfs/' + product.imageLink : 
      "https://placeholdit.imgix.net/~text?txtsize=33&txt=318%C3%97180&w=318&h=180";

    const description = this.state.descContent ? this.state.descContent : "No available description";
    return (
        <Card className="product-card">
          <CardImg className="product-img" top width="100%" src={imageLink} alt="Product Image" />
          <CardBody style={centerStyle}>
            <CardTitle>{product.name}</CardTitle>
            <CardSubtitle>{product.price} wei</CardSubtitle>
            <CardText>{description}</CardText>
            
            <div style={centerStyle}>

              {((product.buyer === "") && (role === "Admin" || role === "Marketplace Owner")) ?
                (
                  <div className="btn">
                    <NotificationModal
                        buttonLabel={"Show Notice"}
                        style={{width: 60}}
                        title="Restricted from Buying"
                        body={`The escrow arrangement involves an admin
                        as an arbiter. Because of this and to
                        prevent abuse, the platform owner and administrators
                        are not allowed to purchase products.`}
                    >Show Notice
                    </NotificationModal>
                  </div>
                ) 
                  : 
                product.buyer === "" ?
                (
                  <Button color="primary" 
                    onClick={
                      async () => {
                        setLoading(true);
                        await escrowsblockmarket.buy.sendTransaction(product.id, {gas: 2000000, from: activeAccount, to: escrowsblockmarket.address, value: product.price});
                        escrowsblockmarket.BuyProduct(function(error, result) {
                          if (!error){
                              console.log("result of watching Add Store event", result);
                              getProducts(storesblockmarket);
                          }else{
                              setLoading(false);
                              alert("There was an error while watching add store event.");
                          }
                        });
                      }
                    }
                  >Buy
                  </Button>
                )  
                  : 
                (
                  <div className="btn">
                    <EscrowModal 
                        web3={web3} 
                        escrowsblockmarket={escrowsblockmarket}
                        buttonLabel={"Show Escrow"}
                        activeAccount={activeAccount}
                        style={{width: 60}}
                        product={product}
                    >Show Escrow
                    </EscrowModal>
                  </div>
                ) 
              }
            </div>
          </CardBody>
        </Card>
    );
  }
}

