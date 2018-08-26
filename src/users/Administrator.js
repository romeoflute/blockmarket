import React from 'react';

export default class Administrator extends React.Component {

  render() {
    const {ethAddress, name, email} = this.props.admin;
    console.log("admin is: ", this.props.admin);
    return (
      <tr>
        <th scope="row">{ethAddress}</th>
        <td>{name}</td>
        <td>{email}</td>
      </tr>
    );
  }
}

