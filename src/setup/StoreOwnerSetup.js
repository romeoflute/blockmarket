import React, {Component} from 'react';
import { 
    Container, 
    Row,
    Button,
    Form, 
    FormGroup, 
    FormFeedback,
    Label, 
    Input,
    Col,
    Table
} from 'reactstrap';
import StoreOwnerFormModal from '../users/StoreOwnerFormModal';
import StoreOwner from '../users/StoreOwner';

export default class StoreOwnerSetup extends Component {

    constructor(props) {
        super(props);
        this.state={
            checkedStoreOwnerAddress: "",
            validStoreOwner: null,
            storeOwnersCount: "0",
            storeOwners: []
        }

        this.getTotalStoreOwners = this.getTotalStoreOwners.bind(this);
        this.getStoreOwners = this.getStoreOwners.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.usersblockmarket === null && nextProps.usersblockmarket !== null) {
            this.getTotalStoreOwners(nextProps.usersblockmarket);
        }
    }

    async getTotalStoreOwners(usersblockmarket) {

        if(usersblockmarket === undefined || usersblockmarket === null){
            this.props.instantiateContract();
            return;
        }
        
        const totalStoreOwners = await usersblockmarket.getTotalStoreOwners();
        console.log("totalStoreOwners: ", totalStoreOwners);
        this.setState({storeOwnersCount: totalStoreOwners.toString()})
        console.log("totalStoreOwners in state: ", this.state.totalStoreOwners);
        this.getStoreOwners(usersblockmarket);
    }

    async getStoreOwners(usersblockmarket) {

        if(usersblockmarket === undefined || usersblockmarket === null){
            return;
        }
        let storeOwners = [];
        for (let id = 0; id < this.state.storeOwnersCount; id++){
            let oneStoreOwnerAddress = await usersblockmarket.getStoreOwnerAddress(id);
            let oneUser = await usersblockmarket.getUser(oneStoreOwnerAddress);
            storeOwners.push({"ethAddress": oneStoreOwnerAddress, "name": oneUser[1], "email": oneUser[2]});
        
            if (id === this.state.storeOwnersCount - 1){
                this.setState({storeOwners: storeOwners});
                console.log("admins in StoreOwnerSetup: ", storeOwners);
                this.props.setLoading(false);
            }
        }
    }

    componentWillMount(){
        this.getTotalStoreOwners(this.props.usersblockmarket);
    }

    render(){
        const {
            web3, 
            usersblockmarket, 
            storesblockmarket,
            activeAccount, 
            role,
            setLoading
        } = this.props;
        const {storeOwners} = this.state;

        return(
            <Container>
                <Row style={{justifyContent: 'space-between'}}>
                    <div><h3>Store Owners</h3></div>
                    <div className="btn">
                        <StoreOwnerFormModal 
                            web3={web3} 
                            usersblockmarket={usersblockmarket}
                            storesblockmarket={storesblockmarket}
                            buttonLabel={"+ Store  Owner"}
                            activeAccount={activeAccount}
                            style={{width: 60}}
                            role={role}
                            setLoading={setLoading}
                            getTotalStoreOwners={this.getTotalStoreOwners} 
                        >+ StoreOwner
                        </StoreOwnerFormModal>
                    </div>
                </Row>
                <Row>
                    <Col sm={10}>
                        <Form>
                            <FormGroup row>
                                <Label for="storeOwnerEth" sm={2}>Validator:</Label>
                                <Col sm={6}>
                                    <Input 
                                        type="textinput" 
                                        name="storeOwnerEth" 
                                        id="storeOwnerEth"
                                        value={this.state.checkedStoreOwnerAddress}
                                        placeholder="Ethereum address to be checked if store owner"
                                        onChange={(event)=>{
                                            this.setState({checkedStoreOwnerAddress: event.target.value.trim()});
                                            this.setState({validStoreOwner: null});
                                        }}
                                        valid={this.state.validStoreOwner === true}
                                        invalid={this.state.validStoreOwner === false}

                                    />
                                    <FormFeedback valid>Account is a Store Owner</FormFeedback>
                                    <FormFeedback invalid>Account is NOT a Store Owner</FormFeedback>
                                </Col>
                                <Col sm={2}>
                                    <Button onClick={ async ()=> {
                                        if(!web3.isAddress(this.state.checkedStoreOwnerAddress)){
                                            this.setState({validStoreOwner: false});
                                            return;
                                        }
                                        const isStoreOwner = await usersblockmarket.checkIfActiveStoreOwner(this.state.checkedStoreOwnerAddress);
                                        if (isStoreOwner === true) {
                                            this.setState({validStoreOwner: true});
                                        }else{
                                            console.log("not store owner...");
                                            this.setState({validStoreOwner: false});
                                        }
                                    }}
                                    >Check If Store Owner</Button>   
                                </Col>
                            </FormGroup>
                            {' '}
                        </Form>
                    </Col>
                </Row>
                <Row>
                    <p>Store owners can create stores and add products.</p>
                </Row>
                <Row>
                    <Table>
                        <thead>
                        <tr>
                            <th>Ethereum Address</th>
                            <th>Name</th>
                            <th>Email</th>
                        </tr>
                        </thead>
                        <tbody>
                            {
                                storeOwners.map((oneStoreOwner) => {
                                    return <StoreOwner storeOwner={oneStoreOwner} key={oneStoreOwner.ethAddress} />
                                })
                            }
                        </tbody>
                    </Table>
                </Row>
            </Container>
        );
    }

}

