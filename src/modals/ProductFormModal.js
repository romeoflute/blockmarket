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
  FormText,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  InputGroup,
  InputGroupText,
  InputGroupAddon
} from 'reactstrap';

const ipfsAPI = require('ipfs-api');

export default class ProductFormModal extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            modal: false,
            name:"",
            price: "",
            imageFile:null,
            selectedStore:null,
            dropdownOpen: false,
            added_file_hash: null,
            desc: "No description"
        };

        this.ipfsApi = ipfsAPI('localhost', '5001');
        this.toggle = this.toggle.bind(this);
        this.toggleDropdown = this.toggleDropdown.bind(this);
        this.save = this.save.bind(this);
        this.renderIfUnauthorized = this.renderIfUnauthorized.bind(this);
        this.renderIfStoreOwner = this.renderIfStoreOwner.bind(this);
        this.addProductToBlockchain = this.addProductToBlockchain.bind(this);
    }

    captureDesc = (event) => {
        event.stopPropagation();
        event.preventDefault();

        const theDescription = event.target.value.trim();
        console.log("the Description = ", theDescription);
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
            console.log(response)
            ipfsId = response[0].hash
            console.log(ipfsId)
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

    componentWillReceiveProps(nextProps) {
        if (this.props.stores.length === 0 &&  nextProps.stores.length > 0) {
            //stores have been fetched, select the first one as default store
            this.setState({selectedStore: nextProps.stores[0]});
        }
    }

    componentWillMount() {
        if (this.props.stores.length > 0){
            console.log("componentWillMount helped");
            this.setState({selectedStore: this.props.stores[0]});
        }
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

    async save() {
        console.log("will now add product, must check role");
        this.toggle();
        const {web3, activeAccount, setLoading} = this.props;
        const {selectedStore} = this.state;

        if(web3 === null){
            console.log('There is no web3 connection');
            return;
        }
        if(selectedStore === null){
            console.log("There is no store to add this product to");
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
                this.addProductToBlockchain(descLinkHash);
            } catch (error) {
                console.log("Error when saving description in ipfs: ", error);
                setLoading(false);
                return;
            }
        }
    }

    async addProductToBlockchain(descLinkHash) {
        const {storesblockmarket, activeAccount, stores, setLoading, getProducts} = this.props;
        const {name, price, selectedStore} = this.state;
        const imageLinkHash = this.state.added_file_hash ? this.state.added_file_hash : "NoImageLink";
    
        try {
            setLoading(true);
            await storesblockmarket.addProduct.sendTransaction(selectedStore.storeid, activeAccount, name, price, imageLinkHash, descLinkHash,  {gas: 500000, from: activeAccount});
        
            storesblockmarket.AddProduct(function(error, result) {
                if (!error){
                    getProducts(stores); 
                    setLoading(false);
                }else{
                    setLoading(false);
                    alert("There was an error while watching add product event.");
                }
        });
        } catch (error) {
          console.log("Error when adding new store to the blockchain: ", error);
          setLoading(false);
        }
      }

    renderIfUnauthorized(){
        console.log("role 1234 is: ", this.props.role);
        return (
            <div>
                <ModalHeader toggle={this.toggle}>You are Unauthorized</ModalHeader>
                <ModalBody>
                    <Label>Only a Store Owner is authorized to add products.</Label>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={this.toggle}>OK</Button>
                </ModalFooter>
            </div>
        );
    }

    renderIfStoreOwner(){
        const {name, price, selectedStore} = this.state;
        const {activeAccount, stores} = this.props;
        
        return(
        <div>
            <ModalHeader toggle={this.toggle}>New Product Form</ModalHeader>
            <ModalBody>
            <Form >
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
                    <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
                        <DropdownToggle caret>
                            {selectedStore !== null ? selectedStore.storeName : "You have no store"}
                        </DropdownToggle>
                        <DropdownMenu> 
                            <DropdownItem header>Choose Another Store</DropdownItem>
                            {stores.map((oneStore, index) => {
                                return (

                                    <div key={oneStore.storeid}>
                                        <DropdownItem onClick={
                                            () => {
                                                this.setState({selectedStore: oneStore});
                                            }}
                                        >
                                            {oneStore.storeName}
                                        </DropdownItem>
                                        <DropdownItem divider />
                                    </div>
                                )
                            })}
                        </DropdownMenu>
                    </Dropdown>
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
                    placeholder="Name of product" 
                />
                </FormGroup>
                <FormGroup>
                <Label for="price">Price</Label>
                <InputGroup>
                    <Input 
                        type="price" 
                        name="price"
                        value={price}
                        id="price"
                        onChange={(event)=>{
                            this.setState({price: event.target.value});
                        }}
                        placeholder="Price in wei" 
                    />
                    <InputGroupAddon addonType="append">
                        <InputGroupText>wei</InputGroupText>
                    </InputGroupAddon>
                </InputGroup>
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
                        You may optionally provide an image for this product. 
                        <br/>
                        Ideal image is 318 x 180 pixels and below 250kb for faster loading.
                    </FormText>
                </FormGroup>
                <FormGroup>
                    <Label for="desc">Description</Label>
                    <Input 
                        type="textarea" 
                        name="desc" id="desc" 
                        placeholder="Describe this product" 
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