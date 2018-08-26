import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';
import BProduct from './BProduct';
import { ClipLoader } from 'react-spinners';

const titleStyle = {
  textAlign: 'center'
};
const loaderStyle = {
    position: "fixed",
    display: "inline-grid",
    top: 0,
    left: "50%",
    textAlign: "center",
    alignContent: "center",
    height: "100%",
    width: "100%",
    transition: "all 0.25s ease",
    zIndex: "999"
}

export default class BProducts extends Component {

    constructor(props) {
        super(props);
        this.state={
            products: [],
            loading: false
        }
        this.ProductStatus = ["Sale", "Reserved", "Sold", "Refunded"];
        this.getProducts = this.getProducts.bind(this);
        this.setLoading = this.setLoading.bind(this);
    }

    setLoading(loading){
        this.setState({loading: loading});
    }

    componentWillReceiveProps(nextProps){
        
        if(this.props.storesblockmarket === null && nextProps.storesblockmarket !== null){
            this.getProducts(nextProps.storesblockmarket);
        }
    }

    async getProducts(storesblockmarket){
        const { storeid } = this.props.match.params

        if (storesblockmarket === null ){
            await this.props.instantiateContract();
            this.setLoading(false);
            return;
        }

        //fetch the id's of the products of this store
        let productsOfOneStore = [];
        const productIDs = await storesblockmarket.getProductsOfStore(storeid);
        console.log("component will mount in BProducts with productIDS", productIDs);
        for (let productCounter = 0; productCounter < productIDs.length; productCounter++){
            const oneProductID = parseInt(productIDs[productCounter], 10);

            const oneProduct = await this.props.storesblockmarket.getProductDetails(oneProductID);
            const theBuyer = oneProduct[7] === "0x0000000000000000000000000000000000000000" ? "" : oneProduct[7];
            const theStatus = this.ProductStatus[parseInt(oneProduct[6], 10)];
            const cleansedProduct = {
                id: parseInt(oneProduct[0], 10),
                storeOwnerAddress: oneProduct[1],
                name: oneProduct[2], 
                price: parseInt(oneProduct[3], 10),
                imageLink: oneProduct[4],
                descLink: oneProduct[5],
                status: theStatus, 
                buyer: theBuyer
            };
            console.log("cleansed product: ", cleansedProduct);
            //if(cleansedProduct.status === "Sale"){
                productsOfOneStore.push(cleansedProduct);
            //}
        }
        this.setState({products: productsOfOneStore});
        this.setLoading(false);
    }

    componentWillMount() {
        this.getProducts(this.props.storesblockmarket);
    }


  renderProducts() {
    const {usersblockmarket, storesblockmarket, escrowsblockmarket, activeAccount, role} = this.props;
    return this.state.products.map(product => {
        return (
            <BProduct 
                product={product} 
                key={product.id}
                usersblockmarket={usersblockmarket}
                storesblockmarket={storesblockmarket}
                escrowsblockmarket={escrowsblockmarket}
                activeAccount={activeAccount}
                getProducts={this.getProducts}
                role={role}
                setLoading={this.setLoading}
            />
        );
      });
  }

  render() {
      return(
        <div>
            {
                this.state.loading ? 
                <div className="overlay">
                    <div style={loaderStyle}>
                        <span style={{transform: "translateX(-50%)"}} className="text-danger mb-5">Please permit this transaction to proceed via Metamask then wait...</span>
                        <ClipLoader
                            loading={this.state.loading}
                            color={"red"}
                        />
                    </div>
                </div>
                :
                <div></div>
            }
            <Container>
                <Row>
                    <Col  xs="12" style={titleStyle}><h1>Products of Store {this.props.match.params.id}</h1></Col>
                </Row>
                <div className="cardsContainer">
                    {this.renderProducts()}
                </div>
            </Container>
        </div>
        
      );
  }
}

