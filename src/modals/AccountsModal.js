import React, {Component} from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import Account from './Account';

const centerStyle = {
  display:"flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center"
};
class AccountsModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modal: false
    };

    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState({
      modal: !this.state.modal
    });
    this.props.eraseTemporaryIndex();
  }

  
    
  renderAccounts(index) {
    return this.props.accounts.map((account, index) => {
      return (
        <Account 
          key={{account}}
          account={account}
          index={index}
          activeIndex={this.props.activeIndex}
          temporaryIndex={this.props.temporaryIndex}
          saveTemporaryIndex={this.props.saveTemporaryIndex}
        />
      )
    });
  }

  render() {
    
    return (
      <div style={centerStyle}>
        <Button color="primary" onClick={this.toggle}>{this.props.buttonLabel}</Button>
        <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
          <ModalHeader toggle={this.toggle}>Your Ethereum Accounts</ModalHeader>
          <ModalBody>
            {this.renderAccounts()}
          </ModalBody>
          <ModalFooter>
            <Button 
              color="primary" 
              onClick={()=>{
                this.props.saveFinalActiveIndex();
                this.toggle();
              }}
            >
                Use This Account</Button>
            <Button 
              color="secondary" 
              onClick={()=>{
                this.props.eraseTemporaryIndex();
                this.toggle();
              }}
              >
                Cancel
              </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default AccountsModal;