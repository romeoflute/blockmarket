import React, {Component} from 'react';

class Account extends Component {

  render() {
    let {account, index, activeIndex, temporaryIndex} = this.props;

    let backgroundColor= (index === activeIndex ? "green" : (index === temporaryIndex ? "yellow" : "white"));
    let textColor= (index === activeIndex ? "white" : (index === temporaryIndex ? "black" : "grey"));

    return (
        <div 
            className="btn" 
            key={index} 
            onClick={()=> this.props.saveTemporaryIndex(index)}
            style={{
                background: backgroundColor,
                color: textColor
            }}
        >
        {account}
        </div>
    );
  }
}

export default Account;