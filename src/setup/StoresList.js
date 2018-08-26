import React, {Component} from 'react';
import { 
    Table,
    Container,
    Row
} from 'reactstrap';
import Store from './Store.js';
import StoreFormModal from '../modals/StoreFormModal';

export default class StoresList extends Component {

    render() {
        const {
            web3, 
            storesblockmarket,
            activeAccount, 
            role,
            stores,
            checkRole,
            setLoading
        } = this.props;

        return (
            <Container>
                <Row style={{justifyContent: 'space-between'}}>
                    <div><h3>Stores</h3></div>
                    <div className="btn">
                        <StoreFormModal 
                            web3={web3}
                            storesblockmarket={storesblockmarket} 
                            buttonLabel={"+ Store"}
                            activeAccount={activeAccount}
                            style={{width: 60}}
                            role={role}
                            checkRole={checkRole}
                            setLoading={setLoading}
                        >+ Store
                        </StoreFormModal>
                    </div>
                </Row>
                <Row>
                    <Table>
                        <thead>
                        <tr>
                            <th>Store Id</th>
                            <th>Store Owner Address</th>
                            <th>Name</th>
                            <th>Email</th>
                        </tr>
                        </thead>
                        <tbody>
                            {
                                stores.map((oneStore) => {
                                    return <Store store={oneStore} key={oneStore.storeid} />
                                })
                            }
                        </tbody>
                    </Table>
                </Row>
          </Container>
        );
    }
}