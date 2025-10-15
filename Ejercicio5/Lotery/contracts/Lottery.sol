// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./LotteryCloseSelection.sol";
import "./LotteryAdministration.sol";

/**
 * @title Lottery
 * @dev Contrato principal que combina toda la funcionalidad
 * @notice Este es el contrato que debe desplegarse
 */
contract Lottery is LotteryCloseSelection, LotteryAdministration {
    
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
    
}
