import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';
import BStore from './BStore';


const titleStyle = {
  textAlign: 'center'
};

export default class BStores extends Component {

  state = {

  }

  componentWillMount(){
    this.props.refreshAccounts();
  }

  renderStores() {
    return this.props.stores.map(store => {
        return (
          <BStore store={store} key={store.storeid}/>
        );
      });
  }

  addStore(newStore) {
    this.setState((oldState) => {
      return(
        [newStore, ...oldState]
      )
    })
  }

  render() {
    return (
      <Container>
          <Row>
            <Col  xs="12" style={titleStyle}><h1>Stores</h1></Col>
          </Row>
          <div className="cardsContainer">
            {this.renderStores()}
          </div>
      </Container>
    );
  }
}

