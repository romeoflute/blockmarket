pragma solidity ^0.4.24;

//pattern: https://vomtom.at/upgrade-smart-contracts-on-chain/
import "../installed_contracts/zeppelin/contracts/ownership/Ownable.sol";

/** @title Users storage. */
contract UsersStorage is Ownable {

    mapping(address => bool) private accessAllowed;

    //transfer to a library common to both this and BlockMarket
    struct UserData {
        address ethAddress;
        string name;
        string email;
        string imageLink;
        string descLink;
    }

    mapping(address => UserData) private users;

    /** @dev Restricts functions to allowed addresses only. */
    modifier platformOnly() {
        require(
            accessAllowed[msg.sender] == true,
            "This is restricted to allowed accounts only."
        );
        _;
    }

    /** @dev Constructor function. */
    constructor() public {
        accessAllowed[msg.sender] = true;
    }

    /** @dev Function that adds an allowed address.
      * @param _address Ethereum address of a user or a contract.
      */
    function allowAccess(address _address) public platformOnly {
        accessAllowed[_address] = true;
    }

    /** @dev Function that retrieves the details of a user.
      * @param userAddress Ethereum address of a user.
      * @return ethAddress Ethereum address of a user.
      * @return name Name of the user.
      * @return email Email of the user.
      * @return imageLink Ipfs link of the image of the user.
      * @return descLink Ipfs link of the description of the user.
      */
    function getUser(address userAddress) public view platformOnly returns(address, string, string, string, string){
        UserData memory user = users[userAddress];
        return (user.ethAddress, user.name, user.email, user.imageLink, user.descLink);
    }

    /** @dev Function that stores the details of the user in the blockchain.
      * @param _userAddress Ethereum address of the user.
      * @param _name Name of the user.
      * @param _email Email of the user.
      * @param _imageLink Ipfs link of the image of the user.
      * @param _descLink Ipfs link of the description of the user.
      */
    function setUser(address _userAddress, string _name, string _email, string _imageLink, string _descLink) public platformOnly  
    {   
        UserData memory user = UserData(_userAddress, _name, _email, _imageLink, _descLink);
        users[_userAddress] = user;
    }
}