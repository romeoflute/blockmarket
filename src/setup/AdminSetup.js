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
import AdminFormModal from '../users/AdminFormModal';
import Administrator from '../users/Administrator';

export default class AdminSetup extends Component {

    constructor(props) {
        super(props);
        this.state={
            adminCount: "0",
            checkedAdminAddress: "",
            validAdmin: null,
            admins: []
        }

        this.getTotalAdmins = this.getTotalAdmins.bind(this);
        this.getAdmins = this.getAdmins.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.usersblockmarket === null && nextProps.usersblockmarket !== null) {
            this.getTotalAdmins(nextProps.usersblockmarket);
        }
    }

    async getTotalAdmins(usersblockmarket) {

        console.log("get total admins");

        if(usersblockmarket === undefined || usersblockmarket === null){
            this.props.instantiateContract();
            return;
        }
        
        const totalAdmins = await usersblockmarket.getTotalAdmins();
        console.log("total admins: ", totalAdmins.toString());
        this.setState({adminCount: totalAdmins.toString()})
        this.getAdmins(usersblockmarket);
    }

    async getAdmins(usersblockmarket) {
        console.log("get admins");
        if(usersblockmarket === undefined || usersblockmarket === null){
            this.props.setLoading(false);
            return;
        }
        let administrators = [];
        for (let id = 0; id < this.state.adminCount; id++){
            let oneAdminAddress = await usersblockmarket.getAdminAddress(id);
            let oneUser = await usersblockmarket.getUser(oneAdminAddress);
            administrators.push({"ethAddress": oneAdminAddress, "name": oneUser[1], "email": oneUser[2]});
        }

        this.setState({admins: administrators});
        console.log("admins in AdminSetup: ", administrators);
        this.props.setLoading(false);
    }

    componentWillMount() {
        this.getTotalAdmins(this.props.usersblockmarket);
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
        const {admins} = this.state;


        return(
            <Container>
                <Row style={{justifyContent: 'space-between'}}>
                    <div><h3>Administrators: ({this.state.adminCount})</h3></div>
                    <div className="btn">
                        <AdminFormModal 
                            web3={web3} 
                            usersblockmarket={usersblockmarket}
                            storesblockmarket={storesblockmarket}
                            buttonLabel={"+ Administrator"}
                            activeAccount={activeAccount}
                            getTotalAdmins={this.getTotalAdmins}
                            style={{width: 60}}
                            role={role}
                            setLoading={setLoading}
                        >+ Admin
                        </AdminFormModal>
                    </div>
                </Row>
                <Row>
                    <Col sm={10}>
                        <Form>
                            <FormGroup row>
                                <Label for="adminEth" sm={2}>Validator:</Label>
                                <Col sm={6}>
                                    <Input 
                                        type="textinput" 
                                        name="adminEth" 
                                        id="adminEth"
                                        value={this.state.checkedAdminAddress}
                                        placeholder="Ethereum address to be checked if admin"
                                        onChange={(event)=>{
                                            const ethAddress = event.target.value.trim();
                                            if (ethAddress === ""){
                                                this.setState({checkedAdminAddress: ethAddress});
                                                this.setState({validAdmin: null});
                                                return;
                                            }
                                            this.setState({checkedAdminAddress: ethAddress});

                                        }}
                                        valid={this.state.validAdmin === true}
                                        invalid={this.state.validAdmin === false && this.state.checkedAdminAddress !== "" }
                                    />
                                    <FormFeedback valid>Account is an Admin</FormFeedback>
                                    <FormFeedback invalid>Account is NOT an Admin</FormFeedback>
                                </Col>
                                <Col sm={2}>
                                    <Button onClick={ async ()=> {
                                        if(!web3.isAddress(this.state.checkedAdminAddress)){
                                            this.setState({validAdmin: false});
                                            return;
                                        }
                                        const isAdmin = await usersblockmarket.checkIfActiveAdmin(this.state.checkedAdminAddress);
                                        if (isAdmin === true) {
                                            this.setState({validAdmin: true});
                                        }else{
                                            this.setState({validAdmin: false});
                                        }
                                    }}
                                    >Check If Admin</Button>   
                                </Col>
                            </FormGroup>
                            {' '}
                        </Form>
                    </Col>
                </Row>
                <Row>
                    <p>Admins create store owners and act as arbiters in escrows. You are required to have at least one admin.</p>
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
                                admins.map((oneAdmin) => {
                                    return <Administrator admin={oneAdmin} key={oneAdmin.ethAddress} />
                                })
                            }
                        </tbody>
                    </Table>
                </Row>
            </Container>
        );
    }
}

