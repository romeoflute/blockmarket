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
  FormText
} from 'reactstrap';

const ipfsAPI = require('ipfs-api');

export default class StoreFormModal extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      modal: false,
      name:"",
      email:"",
      imageFile:null,
      added_file_hash: null,
      desc: "No description"
    };

    this.ipfsApi = ipfsAPI('localhost', '5001');
    this.toggle = this.toggle.bind(this);
    this.save = this.save.bind(this);
    this.renderIfUnauthorized = this.renderIfUnauthorized.bind(this);
    this.renderIfStoreOwner = this.renderIfStoreOwner.bind(this);
    this.addStoreToBlockchain = this.addStoreToBlockchain.bind(this);
  }

  captureDesc = (event) => {
    event.stopPropagation();
    event.preventDefault();

    const theDescription = event.target.value.trim();
    if (theDescription === ""){
        return;
    }
    this.setState({desc: theDescription});
}

saveDescToIpfs = async () => {
  const {setLoading} = this.props;
    const buffer = Buffer.from(this.state.desc, 'utf-8');
    try {
        const response = await this.ipfsApi.add(buffer);
        return response[0].hash;
      } catch (error) {
        console.log("Error when saving desc in ipfs: ", error);
        setLoading(false);
        return error;
      }
}

captureFile = (event) => {
    event.stopPropagation()
    event.preventDefault()
    const file = event.target.files[0]
    let reader = new window.FileReader()
    reader.onloadend = () => this.saveImageToIpfs(reader)
    reader.readAsArrayBuffer(file)
  }

saveImageToIpfs = (reader) => {
    let ipfsId
    const buffer = Buffer.from(reader.result)
    this.ipfsApi.add(buffer)
    .then((response) => {
        ipfsId = response[0].hash
        this.setState({added_file_hash: ipfsId})
    }).catch((err) => {
        console.error(err)
    })
}

arrayBufferToString = (arrayBuffer) => {
    return String.fromCharCode.apply(null, new Uint16Array(arrayBuffer))
}

handleSubmit = (event) => {
    event.preventDefault()
}

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
  }

  async save() {
    this.toggle();
    const {web3, activeAccount, setLoading} = this.props;

    if(web3 === null){
      console.log('There is no web3 connection');
      return;
    }
    if(!web3.isAddress(activeAccount)){
        console.log("no active account");
      return;
    }else{
      setLoading(true);
      
      let descLinkHash;
      try {
        descLinkHash = await this.saveDescToIpfs();
        this.addStoreToBlockchain(descLinkHash);
      } catch (error) {
        console.log("Error when saving description in ipfs: ", error);
        setLoading(false);
        return;
      }
    }
  }

  async addStoreToBlockchain(descLinkHash) {
    const {storesblockmarket, activeAccount, checkRole, setLoading} = this.props;
    const {name, email} = this.state;
    const imageLinkHash = this.state.added_file_hash ? this.state.added_file_hash : "NoImageLink";

    try {
      setLoading(true);
      await storesblockmarket.createStore.sendTransaction(name, email, imageLinkHash, descLinkHash,  {gas: 500000, from: activeAccount});

      storesblockmarket.AddStore(function(error, result) {
        if (!error){
            console.log("result of watching Add Store event", result);
            checkRole();
            setLoading(false);
        }else{
            alert("There was an error while watching add store event.");
            setLoading(false);
        }
      });
    } catch (error) {
      console.log("Error when adding new store to the blockchain: ", error);
      setLoading(false);
    }
  }

  renderIfUnauthorized(){
    return (
        <div>
            <ModalHeader toggle={this.toggle}>You are Unauthorized</ModalHeader>
            <ModalBody>
                <Label>Only a Store Owner is authorized to add Stores.</Label>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={this.toggle}>OK</Button>
            </ModalFooter>
        </div>
    );
  }

  renderIfStoreOwner(){
    const {name, email} = this.state;
    const {activeAccount} = this.props;
    return(
      <div>
        <ModalHeader toggle={this.toggle}>New Store Form</ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="storeOwnerAddress">Store Owner Ethereum Address</Label>
              <Input 
                name="storeOwnerAddress" 
                id="storeOwnerAddress" 
                value={activeAccount}
                readOnly
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
                placeholder="Name of store" 
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
            <FormGroup>
              <Label for="imageFile">Image File</Label>
              <Input 
                type="file" 
                name="imageFile" 
                id="imageFile" 
                onChange={this.captureFile}
              />
              <FormText color="muted">
                You may optionally provide an image for this store.
                <br/>
                Ideal image is 318 x 180 pixels and below 250kb for faster loading.
              </FormText>
            </FormGroup>
            <FormGroup>
              <Label for="desc">Description</Label>
              <Input 
                type="textarea" 
                name="desc" 
                id="desc" 
                placeholder="Describe this store"
                rows={"5"}
                onChange={this.captureDesc}
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
          {this.props.role==="Store Owner" ? this.renderIfStoreOwner() : this.renderIfUnauthorized()}
        </Modal>
      </div>
    );
  }
}