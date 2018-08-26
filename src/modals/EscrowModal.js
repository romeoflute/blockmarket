import React from 'react';
import { 
  Button, 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle
} from 'reactstrap';
import { ClipLoader } from 'react-spinners';

const centerStyle = {
    display:"flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "blue",
    color: "white"
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

export default class EscrowModal extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            modal: false,
            productId: null,
            productName: null,
            buyerAddress: null, 
            storeOwnerAddress: null, 
            adminArbiterAddress: null, 
            fundsDisbursed: null, 
            releaseCount: null, 
            refundCount: null, 
            amount: null,
            dropdownOpen: false,
            loading: false
        };

        this.toggle = this.toggle.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.renderIfUnauthorized = this.renderIfUnauthorized.bind(this);
        this.renderIfAuthorized = this.renderIfAuthorized.bind(this);
        this.getEscrowDetails = this.getEscrowDetails.bind(this);
        this.renderDropdown = this.renderDropdown.bind(this);
        this.renderDisbursedLabel = this.renderDisbursedLabel.bind(this);
        this.setLoading = this.setLoading.bind(this);
    }

    setLoading(loading){
        this.setState({loading: loading});
    }

    async getEscrowDetails() {
        console.log("this.props.product.id: ", this.props.product.id);
        const escrowInfo = await this.props.escrowsblockmarket.getEscrowInfo(this.props.product.id);
        console.log("escrow info: ", escrowInfo);
        console.log("release info: ", parseInt(escrowInfo[5], 10));
        console.log("refundCount info: ", parseInt(escrowInfo[6], 10));
        
        this.setState({
            productId: this.props.product.id,
            productName: escrowInfo[0],
            buyerAddress: escrowInfo[1], 
            storeOwnerAddress: escrowInfo[2], 
            adminArbiterAddress: escrowInfo[3], 
            fundsDisbursed: escrowInfo[4], 
            releaseCount: parseInt(escrowInfo[5], 10), 
            refundCount: parseInt(escrowInfo[6], 10), 
            amount: parseInt(escrowInfo[7], 10)
        })
        this.setLoading(false);
        console.log("releaseCount: ", this.state.releaseCount);
    }

    componentWillMount() {
        console.log("component will mount");
        this.getEscrowDetails();
    }

    toggle() {
        this.setState({
            modal: !this.state.modal
        });
    }

    toggleDropdown() {
        this.setState(prevState => ({
            dropdownOpen: !prevState.dropdownOpen
        }));
    }
    renderIfUnauthorized(){
        return (
            <div>
                <ModalHeader toggle={this.toggle}>You are Unauthorized</ModalHeader>
                <ModalBody>
                    <Label>Only the store owner, assigned admin arbiter, and buyer are authorized to view the escrow.</Label>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>OK</Button>
                </ModalFooter>
            </div>
        );
    }

    renderDropdown(){
        const {productId} = this.state;
        const {activeAccount, escrowsblockmarket} = this.props;
        return(
            <Dropdown direction="up" isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
                <DropdownToggle caret color="success">
                    Funds Still in Escrow
                </DropdownToggle>
                <DropdownMenu> 
                    <DropdownItem header>Transfer Escrow Money:</DropdownItem>
                    <DropdownItem onClick={
                        async () => {
                            try {
                                this.setLoading(true);
                                await escrowsblockmarket.releaseAmountToStoreOwner.sendTransaction(productId, {gas: 2000000, from: activeAccount});
                                const self = this;

                                escrowsblockmarket.ReleaseAmountToStoreOwner(function(error, result) {
                                    if (!error){
                                        self.getEscrowDetails();
                                    }else{
                                        alert("There was an error while watching event to release amount to store owner.");
                                        self.setLoading(false);
                                    }
                                });
                              } catch (error) {
                                console.log("Error when requesting release of amount to store owner: ", error);
                                this.setLoading(false);
                              }
                        }}
                    >
                        Release to Seller
                    </DropdownItem>
                    <DropdownItem divider />

                    <DropdownItem onClick={
                        async () => {
                            try {
                                this.setLoading(true);
                                await escrowsblockmarket.refundAmountToBuyer.sendTransaction(productId, {gas: 2000000, from: activeAccount});
                                const self = this;

                                escrowsblockmarket.RefundAmountToBuyer(function(error, result) {
                                    if (!error){
                                        console.log("result of watching refund event", result);
                                        self.getEscrowDetails();
                                    }else{
                                        alert("There was an error while watching event of refund request.");
                                        self.setLoading(false);
                                    }
                                });
                              } catch (error) {
                                console.log("Error when requesting refund: ", error);
                                this.setLoading(false);
                              }
                        }}
                    >
                        Refund to Buyer
                    </DropdownItem>
                    <DropdownItem divider />
                </DropdownMenu>
            </Dropdown>
        );
    }

    renderDisbursedLabel(){
        return(
            <Label style={centerStyle}><h5>Escrowed fund has been disbursed</h5></Label>
        );
    }

    renderIfAuthorized(){
        const {
            productId,
            productName,
            buyerAddress, 
            storeOwnerAddress, 
            adminArbiterAddress, 
            fundsDisbursed, 
            releaseCount, 
            refundCount, 
            amount} = this.state;

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
            <ModalHeader toggle={this.toggle} style={centerStyle}>Escrow of Product {productId}: {productName}</ModalHeader>
            <ModalBody>
            <Form>
                <FormGroup>
                    <Label for="amount">Amount in Wei</Label>
                    <Input 
                        name="amount" 
                        id="amount" 
                        value={amount}
                        readOnly
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="buyerAddress">Buyer's Ethereum Address</Label>
                    <Input 
                        name="buyerAddress" 
                        id="buyerAddress" 
                        value={buyerAddress}
                        readOnly
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="storeOwnerAddress">Store Owner's Ethereum Address</Label>
                    <Input 
                        name="storeOwnerAddress" 
                        id="storeOwnerAddress" 
                        value={storeOwnerAddress}
                        readOnly
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="adminArbiterAddress">Admin Arbiter's Ethereum Address</Label>
                    <Input 
                        name="adminArbiterAddress" 
                        id="adminArbiterAddress" 
                        value={adminArbiterAddress}
                        readOnly
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="releaseCount">Vote Count: Release to Seller</Label>
                    <Input 
                        name="releaseCount" 
                        id="releaseCount" 
                        value={releaseCount}
                        readOnly
                    />
                </FormGroup>
                <FormGroup>
                    <Label for="refundCount">Vote Count: Refund to Buyer</Label>
                    <Input 
                        name="refundCount" 
                        id="refundCount" 
                        value={refundCount}
                        readOnly
                    />
                </FormGroup>

                <FormGroup className="text-center">
                    {fundsDisbursed === true ? this.renderDisbursedLabel() : this.renderDropdown()}
                </FormGroup>
            </Form>
            </ModalBody>
        </div>
        );
    }

    render() {
        const {buyerAddress, adminArbiterAddress, storeOwnerAddress} = this.state;
        const isAuthorized = 
            (this.props.activeAccount === buyerAddress ||
            this.props.activeAccount === adminArbiterAddress ||
            this.props.activeAccount === storeOwnerAddress) 
            ?
            true
            :
            false;
        return (
        <div>
            <Button color="primary" onClick={this.toggle}>{this.props.buttonLabel}</Button>
            <Modal isOpen={this.state.modal} toggle={this.toggle} >
            {isAuthorized ? this.renderIfAuthorized() : this.renderIfUnauthorized()}
            </Modal>
        </div>
        );
    }
}