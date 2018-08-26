
import React, {Component} from 'react';

export default class Product extends Component {

    render() {
        const {id, name, price, status, buyer } = this.props.product;
        console.log("yey product is: ", this.props.product);

        return (
            <tr>
                <th scope="row">{id}</th>
                <td>{name}</td>
                <td>{price}</td>
                <td>{status}</td>
                <td>{buyer}</td>
            </tr>
        );
    }
}