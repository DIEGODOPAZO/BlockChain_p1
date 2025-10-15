// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./LotteryCloseSelection.sol";
import "./LotteryAdministration.sol";

/**
 * @title Lottery
 * @dev Contrato principal que combina toda la funcionalidad
 * @notice Este es el contrato que debe desplegarse
 */
contract LotteryDApp is LotteryCloseSelection, LotteryAdministration {
    
    /**
     * @notice Obtiene resumen del estado del contrato
     * @return totalLotteries Total de loterías creadas
     * @return activeLotteries Número de loterías activas
     * @return contractOwner Dirección del propietario
     * @return defaultCommission Comisión por defecto
     */
    function getContractSummary() 
        external 
        view 
        returns (
            uint256 totalLotteries,
            uint256 activeLotteries,
            address contractOwner,
            uint256 defaultCommission
        ) 
    {
        // Contar loterías activas
        uint256 activeCount = 0;
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (!lotteries[i].closed && 
                (lotteries[i].endTime == 0 || block.timestamp < lotteries[i].endTime)) {
                activeCount++;
            }
        }
        
        return (
            nextLotteryId,
            activeCount,
            owner,
            defaultCommissionPercent
        );
    }
    
    /**
     * @notice Calcula el coste de comprar N tickets
     * @param lotteryId ID de la lotería
     * @param quantity Cantidad de tickets
     * @return Coste total en wei
     */
    function calculateTicketCost(uint256 lotteryId, uint256 quantity)
        external
        view
        returns (uint256)
    {
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        return lotteries[lotteryId].ticketPrice * quantity;
    }
    
    /**
     * @notice Calcula la distribución de premios de una lotería
     * @param lotteryId ID de la lotería
     * @return ownerCommission Comisión para el owner
     * @return creatorCommission Comisión para el creator
     * @return winnerPrize Premio para el ganador
     */
    function calculatePrizeDistribution(uint256 lotteryId)
        external
        view
        returns (
            uint256 ownerCommission,
            uint256 creatorCommission,
            uint256 winnerPrize
        )
    {
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        
        Lottery storage lot = lotteries[lotteryId];
        uint256 totalCommission = (lot.pot * lot.commissionPercent) / 10000;
        
        ownerCommission = totalCommission / 2;
        creatorCommission = totalCommission / 2;
        winnerPrize = lot.pot - totalCommission;
        
        return (ownerCommission, creatorCommission, winnerPrize);
    }
    
    /**
     * @notice Verifica permisos de un usuario en una lotería
     * @param lotteryId ID de la lotería
     * @param user Dirección del usuario
     * @return isOwner true si es el owner del contrato
     * @return isCreator true si es el creator de la lotería
     */
    function checkPermissions(uint256 lotteryId, address user)
        external
        view
        returns (bool isOwner, bool isCreator)
    {
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        
        return (
            user == owner,
            user == lotteries[lotteryId].creator
        );
    }
}
