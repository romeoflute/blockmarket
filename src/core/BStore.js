import React, { Component } from 'react';
import { Card, CardImg, CardBody, CardTitle, CardText, Button} from 'reactstrap';
import { Link } from 'react-router-dom';
const ipfsAPI = require('ipfs-api');

const centerStyle = {
    display:"flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
};

export default class BStore extends Component {
  constructor(props) {
    super(props);
    this.state={
      descContent: null
  }
    this.ipfsApi = ipfsAPI('localhost', '5001');
  }

  async componentWillMount() {
    const {store} = this.props;
    console.log("store in BStore: ", store);

    const descFile = await this.ipfsApi.cat(store.descLink);
    const descContent = descFile.toString();
    this.setState({descContent: descContent});
  }

  
    
  render() {
    const {storeid, storeName, imageLink} = this.props.store;
    console.log("in render of BStore, store is: ", this.props.store);

    console.log("in render of BStore, imageLink is: ", imageLink);
    const displayImageLink = 
      imageLink !== "NoImageLink" ? 
      'https://ipfs.io/ipfs/' + imageLink : 
      "https://placeholdit.imgix.net/~text?txtsize=33&txt=318%C3%97180&w=318&h=180";

    const displayDescription = this.state.descContent ? this.state.descContent : "No available description";

    return (
        <Card className="store-card">
          <CardImg 
            className="store-img"
            top 
            width="100%" 
            src={displayImageLink} 
            alt="Card image cap"
          />
          <CardBody>
            <CardTitle>{storeName}</CardTitle>
            <CardText>{displayDescription}</CardText>
            <div style={centerStyle}>
                <Link to={`/stores/${storeid}`}><Button color="primary">Browse Products</Button></Link>
            </div>
          </CardBody>
        </Card>
    );
  }
}

