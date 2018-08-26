import React, {Component} from 'react';
import { 
    Table,
    Container,
    Row
} from 'reactstrap';
import Product from './Product.js';
import ProductFormModal from '../modals/ProductFormModal';

export default class ProductsList extends Component {

    constructor(props) {
        super(props);
        this.state={
            stores:null,
            storesAndProducts: []
        }
        this.ProductStatus = ["Sale", "Reserved", "Sold", "Refunded"];
        this.getProducts = this.getProducts.bind(this);
    }

    componentWillReceiveProps(nextProps){
        if(nextProps.stores.length > 0){
            console.log("nextprops.stores: ", nextProps.stores);
            this.getProducts(nextProps.stores);
        }
    }

    async getProducts(stores) {
        if (stores !== null && stores.length > 0) {
            console.log("componentWillReceiveProps in ProductsList.js");

            let allStoresAndProducts = [];
            for (let storeCounter = 0; storeCounter < stores.length; storeCounter++){
                //fetch the id's of the products of this store
                const oneStore = stores[storeCounter];
                let productsOfOneStore = [];
                const productIDs = await this.props.storesblockmarket.getProductsOfStore(oneStore.storeid);
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
                    productsOfOneStore.push(cleansedProduct);
                }
                allStoresAndProducts.push({"id": oneStore.storeid, "name": oneStore.storeName, "products": productsOfOneStore});
            }
            this.setState({storesAndProducts: allStoresAndProducts});
            console.log("this.state.storesAndProducts haa joimee", this.state.storesAndProducts);
        }
    }

    componentWillMount() {
        this.getProducts(this.props.stores);
    }

    render() {
        const {
            web3, 
            storesblockmarket, 
            activeAccount, 
            role,
            stores,
            setLoading
        } = this.props;

        const {storesAndProducts} = this.state;

        return (
            
            <Container>
                <Row style={{justifyContent: 'space-between'}}>
                    <div><h3>Products</h3></div>
                    <div className="btn">
                        <ProductFormModal 
                            web3={web3} 
                            storesblockmarket={storesblockmarket} 
                            buttonLabel={"+ Product"}
                            activeAccount={activeAccount}
                            style={{width: 60}}
                            role={role}
                            stores={stores}
                            getProducts={this.getProducts}
                            setLoading={setLoading}
                        >+ Product
                        </ProductFormModal>
                    </div>
                </Row>
                <Row>
                    <Table striped>
                        <thead>
                            <tr>
                                <th>Product Id</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Buyer</th>
                            </tr>
                        </thead>
                        
                            {   
                                    storesAndProducts.map((oneStore) => {
                                        return (
                                            <tbody key={oneStore.id}>
                                                <tr>
                                                    <th scope="row" key={oneStore.id}>
                                                        {`Store: ${oneStore.name}`}
                                                    </th>
                                                    <th></th>
                                                    <th></th>
                                                    <th></th>
                                                    <th></th>
                                                </tr>
                                                {oneStore.products.map((oneProduct) => {
                                                    return <Product product={oneProduct} key={oneProduct.id} />
                                                })}
                                            </tbody>
                                        );
                                    })
                                
                            }
                        
                    </Table>
                </Row>
          </Container>
        );
    }
}