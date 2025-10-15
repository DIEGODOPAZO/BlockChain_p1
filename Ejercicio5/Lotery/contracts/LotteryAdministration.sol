// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./LotteryUserFunctionalities.sol";

/**
 * @title LotteryAdministration
 * @dev Funciones administrativas para crear y gestionar loterías
 */
contract LotteryAdministration is LotteryUserFunctionalities {
    
    // Comisión máxima permitida (10%)
    uint256 public constant MAX_COMMISSION_PERCENT = 1000;
    
    // Constructor para inicializar el owner
    constructor() {
        owner = msg.sender;
        nextLotteryId = 0;
    }
    
    /**
     * @notice Crea una nueva lotería
     * @param name Nombre de la lotería
     * @param ticketPrice Precio por ticket en wei
     * @param maxTickets Límite de tickets (0 = sin límite)
     * @param endTime Timestamp de cierre (0 = manual)
     * @param commissionPercent Porcentaje de comisión (0 = usar default)
     * @return ID de la lotería creada
     */
    function createLottery(
        string memory name,
        uint256 ticketPrice,
        uint256 maxTickets,
        uint256 endTime,
        uint256 commissionPercent
    ) external returns (uint256) {
        require(ticketPrice > 0, "Ticket price must be > 0");
        require(
            endTime == 0 || endTime > block.timestamp,
            "Invalid end time"
        );
        
        // Usar comisión custom o default
        uint256 commission = commissionPercent == 0 
            ? defaultCommissionPercent 
            : commissionPercent;
        
        require(commission <= MAX_COMMISSION_PERCENT, "Commission too high");
        
        uint256 lotteryId = nextLotteryId;
        
        Lottery storage newLot = lotteries[lotteryId];
        newLot.id = lotteryId;
        newLot.creator = msg.sender;
        newLot.name = name;
        newLot.ticketPrice = ticketPrice;
        newLot.maxTickets = maxTickets;
        newLot.ticketsSold = 0;
        newLot.startTime = block.timestamp;
        newLot.endTime = endTime;
        newLot.commissionPercent = commission;
        newLot.closed = false;
        newLot.winner = address(0);
        newLot.pot = 0;
        
        nextLotteryId++;
        
        emit LotteryCreated(lotteryId, msg.sender);
        
        return lotteryId;
    }
    
    /**
     * @notice Modifica la comisión por defecto del contrato
     * @param newPercent Nuevo porcentaje (base 10000)
     */
    function setDefaultCommissionPercent(uint256 newPercent) external {
        require(msg.sender == owner, "Only owner");
        require(newPercent <= MAX_COMMISSION_PERCENT, "Commission too high");
        
        defaultCommissionPercent = newPercent;
    }
    
    /**
     * @notice Modifica la comisión de una lotería específica
     * @param lotteryId ID de la lotería
     * @param newPercent Nuevo porcentaje
     */
    function setLotteryCommission(uint256 lotteryId, uint256 newPercent) external {
        Lottery storage lot = lotteries[lotteryId];
        
        require(
            msg.sender == lot.creator || msg.sender == owner,
            "Only creator or owner"
        );
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        require(!lot.closed, "Lottery is closed");
        require(newPercent <= MAX_COMMISSION_PERCENT, "Commission too high");
        
        uint256 oldPercent = lot.commissionPercent;
        lot.commissionPercent = newPercent;
        
        emit CommissionChanged(lotteryId, oldPercent, newPercent);
    }
    
    /**
     * @notice Obtiene loterías creadas por un usuario
     * @param creator Dirección del creador
     * @return Array con IDs de sus loterías
     */
    function getLotteriesByCreator(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        // Contar loterías del creador
        uint256 count = 0;
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (lotteries[i].creator == creator) {
                count++;
            }
        }
        
        // Crear y llenar array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (lotteries[i].creator == creator) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Obtiene loterías activas (abiertas)
     * @return Array con IDs de loterías activas
     */
    function getActiveLotteries() external view returns (uint256[] memory) {
        // Contar activas
        uint256 count = 0;
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (!lotteries[i].closed && 
                (lotteries[i].endTime == 0 || block.timestamp < lotteries[i].endTime)) {
                count++;
            }
        }
        
        // Crear y llenar array
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (!lotteries[i].closed && 
                (lotteries[i].endTime == 0 || block.timestamp < lotteries[i].endTime)) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @notice Verifica si una lotería puede cerrarse
     * @param lotteryId ID de la lotería
     * @return true si puede cerrarse
     */
    function canCloseLottery(uint256 lotteryId) external view returns (bool) {
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        
        Lottery storage lot = lotteries[lotteryId];
        
        if (lot.closed || lot.ticketsSold == 0) {
            return false;
        }
        
        // Puede cerrarse si alcanzó maxTickets
        if (lot.maxTickets > 0 && lot.ticketsSold >= lot.maxTickets) {
            return true;
        }
        
        // Puede cerrarse si expiró tiempo
        if (lot.endTime > 0 && block.timestamp >= lot.endTime) {
            return true;
        }
        
        // Siempre puede cerrarse manualmente
        return true;
    }
    
    /**
     * @notice Obtiene el número total de loterías creadas
     * @return Total de loterías
     */
    function getTotalLotteries() external view returns (uint256) {
        return nextLotteryId;
    }
    
    /**
     * @notice Obtiene estadísticas de un participante
     * @param participant Dirección del participante
     * @return lotteriesParticipated Número de loterías participadas
     * @return totalTickets Total de tickets comprados
     * @return lotteriesWon Número de loterías ganadas
     */
    function getParticipantStats(address participant)
        external
        view
        returns (
            uint256 lotteriesParticipated,
            uint256 totalTickets,
            uint256 lotteriesWon
        )
    {
        for (uint256 i = 0; i < nextLotteryId; i++) {
            uint256 tickets = lotteries[i].ticketsByAddress[participant];
            if (tickets > 0) {
                lotteriesParticipated++;
                totalTickets += tickets;
            }
            if (lotteries[i].winner == participant) {
                lotteriesWon++;
            }
        }
        
        return (lotteriesParticipated, totalTickets, lotteriesWon);
    }
}
