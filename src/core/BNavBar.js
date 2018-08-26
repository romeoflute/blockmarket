import React, {Component} from 'react';
// import AccountsModal from '../modals/AccountsModal';
import { Link } from 'react-router-dom'

import {
  Collapse,
  Nav,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  NavLink,
  NavItem
  } from 'reactstrap';

export default class BNavBar extends Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);
    this.state = {
      isOpen: false,
      activeNav: "stores"
    };
  }
  toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    return (
      <div>
        <Navbar color="light" light expand="md">
          <NavbarBrand href="/">blockmarket</NavbarBrand>
          <NavbarToggler onClick={this.toggle} />
          <Collapse isOpen={this.state.isOpen} navbar>
            <Nav className="ml-auto" navbar>
              <NavItem>
                <NavLink 
                  onClick={()=>{
                    this.setState({activeNav:"setup"})
                  }} 
                  tag={Link} 
                  to="/setup" 
                  active={this.state.activeNav === "setup" ? true : false}
                  activeclassname="active" 
                >
                  Setup
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  onClick={()=>{
                    this.setState({activeNav:"stores"})
                  }} 
                  tag={Link} 
                  to="/stores" 
                  active={this.state.activeNav === "stores" ? true : false}
                  activeclassname="active"
                >
                  Stores
                </NavLink>
              </NavItem>
            </Nav>
          </Collapse>
        </Navbar>
      </div>
    );
  }
}