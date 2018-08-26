import React from 'react';

export default class StoreOwner extends React.Component {

  render() {
    const {ethAddress, name, email} = this.props.storeOwner;
    console.log("storeOwner is: ", this.props.storeOwner);
    return (
      <tr>
        <th scope="row">{ethAddress}</th>
        <td>{name}</td>
        <td>{email}</td>
      </tr>
    );
  }
}

