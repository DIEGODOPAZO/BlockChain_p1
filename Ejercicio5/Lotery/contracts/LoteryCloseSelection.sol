//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./LoteryUserFunctionalities.sol";

/**
 * @title LoteryCloseSelection
 * @dev Maneja el cierre de loterías y selección de ganadores
 */
contract LoteryCloseSelection is LoteryUserFunctionalities {
    
    /**
     * @notice Cierra una lotería y selecciona un ganador
     * @param _lotteryId ID de la lotería a cerrar
     */
    function closeLottery(uint256 _lotteryId) 
        external 
        onlyCreatorOrOwner(_lotteryId)
        lotteryExists(_lotteryId)
        lotteryOpen(_lotteryId)
    {
        _closeLottery(_lotteryId);
    }
    
    /**
     * @notice Permite al ganador reclamar su premio
     * @param _lotteryId ID de la lotería
     */
    function claimPrize(uint256 _lotteryId) 
        external 
        lotteryExists(_lotteryId)
        lotteryClosed(_lotteryId)
    {
        Lottery storage lottery = lotteries[_lotteryId];
        
        require(msg.sender == lottery.winner, "Solo el ganador puede reclamar el premio");
        require(lottery.pot > 0, "El premio ya ha sido reclamado");
        
        uint256 prize = lottery.pot;
        lottery.pot = 0;
        
        payable(msg.sender).transfer(prize);
    }
    
    // Implementación de cierre automático
    function _autoCloseLottery(uint256 _lotteryId) internal override {
        _closeLottery(_lotteryId);
    }
    
    // Cierra la lotería y llama a la selección de ganador
    function _closeLottery(uint256 _lotteryId) internal {
        Lottery storage lottery = lotteries[_lotteryId];
        
        require(lottery.ticketsSold > 0, "No se han vendido tickets");
        require(!lottery.closed, "La loteria ya esta cerrada");
        
        lottery.closed = true;
        emit LotteryClosed(_lotteryId, msg.sender);
        
        _selectWinnerAndDistribute(_lotteryId);
    }
    
    // Selecciona ganador usando selección ponderada y distribuye fondos
    function _selectWinnerAndDistribute(uint256 _lotteryId) internal {
        Lottery storage lottery = lotteries[_lotteryId];
        
        // Generar número aleatorio entre 0 y total de tickets vendidos
        uint256 winningTicketNumber = _generateRandomNumber(lottery.ticketsSold);
        
        // Encontrar ganador basado en número de ticket
        address winner = _findWinnerByTicketNumber(_lotteryId, winningTicketNumber);
        lottery.winner = winner;
        
        // Calcular distribución: comisión owner, comisión creator, premio
        uint256 totalPot = lottery.pot;
        uint256 totalCommission = (totalPot * lottery.commissionPercent) / 10000;
        uint256 ownerCommission = totalCommission / 2;
        uint256 creatorCommission = totalCommission / 2;
        uint256 prize = totalPot - totalCommission;
        
        lottery.pot = 0;
        
        // Transferir fondos
        payable(owner).transfer(ownerCommission);
        
        if (lottery.creator != owner) {
            payable(lottery.creator).transfer(creatorCommission);
        }
        
        payable(winner).transfer(prize);
        
        emit WinnerSelected(_lotteryId, winner, prize);
    }
    
    /**
     * @dev Encuentra el ganador usando selección ponderada
     * Cada ticket tiene igual probabilidad, más tickets = más probabilidad de ganar
     * 
     * Ejemplo: Alice (3 tickets), Bob (2 tickets)
     * Rango: [0-2] Alice, [3-4] Bob
     * Si número aleatorio = 1 → gana Alice
     * Si número aleatorio = 4 → gana Bob
     */
    function _findWinnerByTicketNumber(uint256 _lotteryId, uint256 _ticketNumber) 
        internal 
        view 
        returns (address) 
    {
        Lottery storage lottery = lotteries[_lotteryId];
        uint256 cumulativeTickets = 0;
        
        for (uint256 i = 0; i < lottery.participants.length; i++) {
            address participant = lottery.participants[i];
            uint256 participantTickets = lottery.ticketsByAddress[participant];
            
            cumulativeTickets += participantTickets;
            
            if (_ticketNumber < cumulativeTickets) {
                return participant;
            }
        }
        
        revert("Error en seleccion de ganador");
    }
}
