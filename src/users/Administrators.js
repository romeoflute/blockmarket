import React from 'react';
import { 
    Container
} from 'reactstrap';
import AdminSetup from '../setup/AdminSetup';
import StoreOwnerSetup from '../setup/StoreOwnerSetup';
import StoresList from '../setup/StoresList';
import ProductsList from '../setup/ProductsList';
import { ClipLoader } from 'react-spinners';

/*const centerStyle = {
    display:"flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    descContent: null
};*/
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

export default class Administrators extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
          loading: false
        };
        this.setLoading = this.setLoading.bind(this);
    }

    setLoading(loading){
        this.setState({loading: loading});
    }

    componentDidMount() {
        if(this.props.usersblockmarket === null){
            this.props.instantiateContract();
        }
    }
  
    render() {

        const {
            web3, 
            usersblockmarket,
            storesblockmarket,
            activeAccount, 
            role,
            stores,
            checkRole,
            instantiateContract
        } = this.props;

        return (
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
                    <AdminSetup
                        web3={web3} 
                        usersblockmarket={usersblockmarket}
                        storesblockmarket={storesblockmarket}
                        activeAccount={activeAccount}
                        role={role}
                        instantiateContract={instantiateContract}
                        setLoading={this.setLoading}
                    />
                    <StoreOwnerSetup
                        web3={web3} 
                        usersblockmarket={usersblockmarket}
                        storesblockmarket={storesblockmarket}
                        activeAccount={activeAccount}
                        instantiateContract={instantiateContract}
                        role={role}
                        setLoading={this.setLoading}
                    />
                    <StoresList
                        web3={web3} 
                        usersblockmarket={usersblockmarket}
                        storesblockmarket={storesblockmarket}
                        activeAccount={activeAccount}
                        role={role}
                        stores={stores}
                        checkRole={checkRole}
                        setLoading={this.setLoading}
                    />
                    <ProductsList
                        web3={web3} 
                        usersblockmarket={usersblockmarket}
                        storesblockmarket={storesblockmarket}
                        activeAccount={activeAccount}
                        role={role}
                        stores={stores}
                        setLoading={this.setLoading}
                    />
                </Container>

            </div>
        );
    }
}