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
  Input 
} from 'reactstrap';

export default class AdminFormModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      modal: false,
      ethAddress:"",
      name:"",
      email:"",
      imageFile:null,
      desc:""
    };

    this.toggle = this.toggle.bind(this);
    this.save = this.save.bind(this);
    this.renderIfUnauthorized = this.renderIfUnauthorized.bind(this);
    this.renderIfMarketplaceOwner = this.renderIfMarketplaceOwner.bind(this);
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  async save() {
    this.toggle();
    const {
      web3, 
      usersblockmarket,
      getTotalAdmins, 
      activeAccount, 
      setLoading
    } = this.props;
    const {ethAddress, name, email} = this.state;

    console.log('ethAddress: ', ethAddress);
    if(web3 === null){
      console.log('There is no web3 connection');
      return;
    }
    if(!web3.isAddress(ethAddress)){
      return;
    }else{
      try {
        setLoading(true);

        console.log("will be registering admin");
        await usersblockmarket.registerAdmin.sendTransaction(ethAddress, name, email, {gas: 500000, from: activeAccount});
        console.log("done registering admin");
        usersblockmarket.AddAdmin(function(error, result) {
          if (!error){
              console.log("result.args", result.args);
              getTotalAdmins(usersblockmarket); 
          }else{
              setLoading(false);
              alert("There was an error while watching add admin event.");
          }
        });
      } catch (error) {
        console.log("Error when registering a new admin to the blockchain: ", error);
        setLoading(false);
      }
    }
  }

  renderIfUnauthorized(){

    return (
        <div>
            <ModalHeader toggle={this.toggle}>You are Unauthorized</ModalHeader>
            <ModalBody>
                <Label>Only the Marketplace Owner is authorized to add Admin users.</Label>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={this.toggle}>OK</Button>
            </ModalFooter>
        </div>
    );
  }

  renderIfMarketplaceOwner(){
    const {ethAddress, name, email} = this.state;

    return(
      <div>
        <ModalHeader toggle={this.toggle}>New Admin Form</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="ethAddress">Ethereum Address</Label>
              <Input 
                type="text" 
                name="ethAddress" 
                id="ethAddress" 
                value={ethAddress}
                onChange={(event)=>{
                  this.setState({ethAddress: event.target.value});
                }}
                placeholder="Ethereum address" 
              />
            </FormGroup>
            <FormGroup>
              <Label for="name">Name</Label>
              <Input 
                type="text" 
                name="name" 
                id="name"
                value={name} 
                onChange={(event)=>{
                  this.setState({name: event.target.value});
                }}
                placeholder="Name of user" 
              />
            </FormGroup>
            <FormGroup>
              <Label for="email">Email</Label>
              <Input 
                type="email" 
                name="email"
                value={email}
                id="email"
                onChange={(event)=>{
                  this.setState({email: event.target.value});
                }}
                placeholder="Contact email" 
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.save}>Save</Button>{' '}
          <Button color="secondary" onClick={this.toggle}>Cancel</Button>
        </ModalFooter>
      </div>
    );
  }

  render() {
    return (
      <div>
        <Button color="primary" onClick={this.toggle}>{this.props.buttonLabel}</Button>
        <Modal isOpen={this.state.modal} toggle={this.toggle} >
          {this.props.role==="Marketplace Owner" ? this.renderIfMarketplaceOwner() : this.renderIfUnauthorized()}
        </Modal>
      </div>
    );
  }
}