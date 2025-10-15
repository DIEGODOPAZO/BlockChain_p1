// SPDX-License-Identifier: GPL-3.0

// Funciones de usuarios

pragma solidity >=0.8.2 <0.9.0;

import "./LotteryVariables.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract LotteryUserFunctionalities is LotteryVariables{
    using SafeMath for uint256;

    function buyTickets(uint256 lotteryId, uint256 quantity) external payable{
        Lottery storage lot = lotteries[lotteryId];
    
        uint256 totalPrice = quantity.mul(lot.ticketPrice);

        require(!lot.closed, "Lottery is closed");
        require(quantity > 0, "Quantity must be greater than 0");
        require(msg.value == totalPrice, "Invalid amount of ETH sent");

        // Actualizar tickets vendidos
        lot.ticketsSold = lot.ticketsSold.add(quantity);

        // Actualizar tickets del participante
        lot.ticketsByAddress[msg.sender] = lot.ticketsByAddress[msg.sender].add(quantity);

        // Agregar a participantes si es la primera vez
        if (lot.ticketsByAddress[msg.sender] == quantity) {
            lot.participants.push(msg.sender);
        }

        // Actualizar el pot
        lot.pot = lot.pot.add(msg.value);

        // Emitir evento
        emit TicketPurchased(lotteryId, msg.sender, quantity);

    }


    function getMyTickets(uint256 lotteryId, address participant) external view returns (uint256){
        return lotteries[lotteryId].ticketsByAddress[participant];
    }
}
