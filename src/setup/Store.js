
import React, {Component} from 'react';

export default class Store extends Component {

    render() {
        const {storeid, storeName, ownerAddress, storeEmail} = this.props.store;

        return (
            <tr>
                <th scope="row">{storeid}</th>
                <td>{storeName}</td>
                <td>{ownerAddress}</td>
                <td>{storeEmail}</td>
            </tr>
        );
    }
}