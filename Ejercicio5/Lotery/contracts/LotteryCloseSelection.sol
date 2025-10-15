// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./LotteryUserFunctionalities.sol";

/**
 * @title LotteryCloseSelection
 * @dev Maneja el cierre de loterías y selección de ganadores
 */
contract LotteryCloseSelection is LotteryUserFunctionalities {
    
    /**
     * @notice Cierra una lotería y selecciona un ganador
     * @param lotteryId ID de la lotería a cerrar
     */
    function closeLottery(uint256 lotteryId) external {
        Lottery storage lot = lotteries[lotteryId];
        
        // Validaciones
        require(
            msg.sender == lot.creator || msg.sender == owner,
            "Only creator or owner can close"
        );
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        require(!lot.closed, "Lottery already closed");
        require(lot.ticketsSold > 0, "No tickets sold");
        
        _closeLottery(lotteryId);
    }
    
    /**
     * @notice Permite al ganador reclamar su premio
     * @param lotteryId ID de la lotería
     */
    function claimPrize(uint256 lotteryId) external {
        Lottery storage lot = lotteries[lotteryId];
        
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        require(lot.closed, "Lottery not closed yet");
        require(msg.sender == lot.winner, "Only winner can claim");
        require(lot.pot > 0, "Prize already claimed");
        
        uint256 prize = lot.pot;
        lot.pot = 0;
        
        payable(msg.sender).transfer(prize);
    }
    
    // Cierra la lotería y selecciona ganador
    function _closeLottery(uint256 lotteryId) internal {
        Lottery storage lot = lotteries[lotteryId];
        
        lot.closed = true;
        emit LotteryClosed(lotteryId, msg.sender);
        
        _selectWinnerAndDistribute(lotteryId);
    }
    
    // Selecciona ganador y distribuye fondos
    function _selectWinnerAndDistribute(uint256 lotteryId) internal {
        Lottery storage lot = lotteries[lotteryId];
        
        // Generar número aleatorio entre 0 y total de tickets
        uint256 winningTicketNumber = _generateRandomNumber(lot.ticketsSold);
        
        // Encontrar ganador basado en distribución ponderada
        address winner = _findWinnerByTicketNumber(lotteryId, winningTicketNumber);
        lot.winner = winner;
        
        // Calcular distribución de fondos
        uint256 totalPot = lot.pot;
        uint256 totalCommission = (totalPot * lot.commissionPercent) / 10000;
        uint256 ownerCommission = totalCommission / 2;
        uint256 creatorCommission = totalCommission / 2;
        uint256 prize = totalPot - totalCommission;
        
        lot.pot = 0;
        
        // Transferir comisiones
        payable(owner).transfer(ownerCommission);
        
        if (lot.creator != owner) {
            payable(lot.creator).transfer(creatorCommission);
        }
        
        // Transferir premio al ganador
        payable(winner).transfer(prize);
        
        emit WinnerSelected(lotteryId, winner, prize);
    }
    
    /**
     * @dev Encuentra el ganador usando selección ponderada
     * Cada ticket tiene igual probabilidad
     * 
     * Ejemplo: Alice (3 tickets), Bob (2 tickets)
     * Rango: [0-2] Alice, [3-4] Bob
     * Si número aleatorio = 1 → gana Alice
     */
    function _findWinnerByTicketNumber(uint256 lotteryId, uint256 ticketNumber) 
        internal 
        view 
        returns (address) 
    {
        Lottery storage lot = lotteries[lotteryId];
        uint256 cumulativeTickets = 0;
        
        for (uint256 i = 0; i < lot.participants.length; i++) {
            address participant = lot.participants[i];
            uint256 participantTickets = lot.ticketsByAddress[participant];
            
            cumulativeTickets += participantTickets;
            
            if (ticketNumber < cumulativeTickets) {
                return participant;
            }
        }
        
        revert("Error in winner selection");
    }
}
