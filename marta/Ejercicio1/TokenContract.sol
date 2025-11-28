// SPDX-License-Identifier: Unlicenced
pragma solidity 0.8.30;
contract TokenContract {

 address public owner;
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

    // Función para comprar tokens con Ether
    // 1 token = 5 Ether
    function buyToken(uint256 _amount) public payable {
        // Calcular el costo total en Ether
        uint256 etherCost = _amount * 5 ether;
        
        // Verificar que el owner tenga suficientes tokens
        require(users[owner].tokens >= _amount, "El propietario no tiene suficientes tokens");
        
        // Verificar que se haya enviado suficiente Ether
        require(msg.value >= etherCost, "Ether insuficiente para comprar los tokens");
        
        // Transferir tokens del owner al comprador
        users[owner].tokens -= _amount;
        users[msg.sender].tokens += _amount;
        
        // Si se envió más Ether del necesario, devolver el exceso
        if (msg.value > etherCost) {
            payable(msg.sender).transfer(msg.value - etherCost);
        }
    }
    
    // Función para mostrar la cantidad de Ether en el contrato
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}