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
  Alert
} from 'reactstrap';

export default class StoreOwnerFormModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      modal: false,
      ethAddress:"",
      name:"",
      email:"",
      imageFile:null,
      desc:"",
      showAlert: false
    };

    this.toggle = this.toggle.bind(this);
    this.toggleAlert = this.toggleAlert.bind(this);
    this.save = this.save.bind(this);
    this.renderIfUnauthorized = this.renderIfUnauthorized.bind(this);
    this.renderIfAdmin = this.renderIfAdmin.bind(this);
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }
  toggleAlert() {
    this.setState({
      showAlert: !this.state.showAlert
    });
  }

  renderIfUnauthorized(){

    return (
        <div>
            <ModalHeader toggle={this.toggle}>You are Unauthorized</ModalHeader>
            <ModalBody>
                <Label>Only a user with Admin role is authorized to add store owners.</Label>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={this.toggle}>OK</Button>
            </ModalFooter>
        </div>
    );
  }

  renderIfAdmin(){
    const {ethAddress, name, email} = this.state;

    return (
        <div>
            <ModalHeader toggle={this.toggle}>New Store Owner Form</ModalHeader>
            <ModalBody>
                <Form>
                    <FormGroup>
                    <Label for="ethAddress">Ethereum Address</Label>
                    <Alert color="danger" isOpen={this.state.showAlert} toggle={this.toggleAlert}>
                        The platform owner and admin cannot become store owners to prevent abuse in escrows. 
                    </Alert>
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

  async save() {
    //this.toggle();
    const {web3, usersblockmarket, setLoading, activeAccount, getTotalStoreOwners} = this.props;
    const {ethAddress, name, email} = this.state;

    if(web3 === null){
      console.log('There is no web3 connection');
      setLoading(false);
      return;
    }
    if(!web3.isAddress(ethAddress)){
      setLoading(false);
      return;
    }else{
      //check if this is the platform owner
      const platformOwner = await usersblockmarket.owner();
      console.log("platformOwner is: ", platformOwner);
      if(ethAddress === platformOwner){
        this.setState({showAlert: true});
        return;
      }

      const isAdmin = await usersblockmarket.checkIfActiveAdmin(ethAddress);
      if(isAdmin === true){
        this.setState({showAlert: true});
        return;
      }
      this.setState({showAlert: false});

      try {
        setLoading(true);
        this.toggle();
        await usersblockmarket.registerStoreOwner.sendTransaction(ethAddress, name, email, {gas: 300000, from: activeAccount});
  
        usersblockmarket.AddStoreOwner(function(error, result) {
          if (!error){
              console.log("result.args", result.args);
              getTotalStoreOwners(usersblockmarket); 
          }else{
              setLoading(false);
              alert("There was an error while watching add store owner event.");
          }
        });
      } catch (error) {
        console.log("Error when adding new store owner to the blockchain: ", error);
        setLoading(false);
      }
    }
  }

  render() {
    return (
      <div>
        <Button color="primary" onClick={this.toggle}>{this.props.buttonLabel}</Button>
        <Modal isOpen={this.state.modal} toggle={this.toggle} >
        {this.props.role==="Admin" ? this.renderIfAdmin() : this.renderIfUnauthorized()}
        </Modal>
      </div>
    );
  }
}