// SPDX-License-Identifier: Unlicenced
pragma solidity 0.8.30;
contract TokenContract {

    address public owner;
    uint8 public tokenValue = 5;
    struct Receivers {
        string name;
        uint256 tokens;
    }
    mapping(address => Receivers) public users;

    modifier onlyOwner(){
        require(msg.sender == owner);
        _;
    }

    constructor(){
        owner = msg.sender;
        users[owner].tokens = 100;
    }

    function double(uint _value) public pure returns (uint){
        return _value*2;
    }

    function register(string memory _name) public{
        users[msg.sender].name = _name;
    }

    function giveToken(address _receiver, uint256 _amount) onlyOwner public{
        require(users[owner].tokens >= _amount);
        users[owner].tokens -= _amount;
        users[_receiver].tokens += _amount;
    }

    function updateTokenPrice(uint8 _ammount) onlyOwner public {
        tokenValue = _ammount;
    }

    function buyToken(uint128 _tokens) public payable {
        uint256 cost = _tokens * tokenValue;

        require(msg.value >= cost, "Fondos insuficientes");
        users[msg.sender].tokens += _tokens;

        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }else {
            payable(owner).transfer(cost);
        }

        
    }
}