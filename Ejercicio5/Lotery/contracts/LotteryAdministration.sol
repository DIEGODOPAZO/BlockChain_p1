//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./LoteryUserFunctionalities.sol";

/**
 * @title LoteryAdministration
 * @dev Funciones administrativas para crear y gestionar loterías
 */
contract LotteryAdministration is LotteryUserFunctionalities {
    
    /**
     * @notice Crea una nueva lotería
     * @param _name Nombre de la lotería
     * @param _ticketPrice Precio por ticket en wei
     * @param _maxTickets Límite de tickets (0 = sin límite)
     * @param _endTime Timestamp de cierre (0 = manual)
     * @param _commissionPercent Porcentaje de comisión (0 = usar default, base 10000)
     * @return ID de la lotería creada
     */
    function createLottery(
        string memory _name,
        uint256 _ticketPrice,
        uint256 _maxTickets,
        uint256 _endTime,
        uint256 _commissionPercent
    ) external returns (uint256) {
        require(_ticketPrice > 0, "El precio del ticket debe ser mayor a 0");
        require(
            _endTime == 0 || _endTime > block.timestamp,
            "endTime debe ser futuro o 0 para cierre manual"
        );
        
        // Usar comisión custom o default
        uint256 commission = _commissionPercent == 0 ? defaultCommissionPercent : _commissionPercent;
        require(commission <= MAX_COMMISSION_PERCENT, "Comision excede el maximo (10%)");
        
        uint256 lotteryId = nextLotteryId;
        
        Lottery storage newLottery = lotteries[lotteryId];
        newLottery.id = lotteryId;
        newLottery.creator = msg.sender;
        newLottery.name = _name;
        newLottery.ticketPrice = _ticketPrice;
        newLottery.maxTickets = _maxTickets;
        newLottery.ticketsSold = 0;
        newLottery.startTime = block.timestamp;
        newLottery.endTime = _endTime;
        newLottery.commissionPercent = commission;
        newLottery.closed = false;
        newLottery.winner = address(0);
        newLottery.pot = 0;
        
        nextLotteryId++;
        
        emit LotteryCreated(lotteryId, msg.sender);
        
        return lotteryId;
    }
    
    /**
     * @notice Modifica la comisión por defecto del contrato
     * @param _newPercent Nuevo porcentaje (base 10000, ej: 200 = 2%)
     */
    function setDefaultCommissionPercent(uint256 _newPercent) external onlyOwner {
        require(_newPercent <= MAX_COMMISSION_PERCENT, "Comision excede el maximo (10%)");
        defaultCommissionPercent = _newPercent;
    }
    
    /**
     * @notice Modifica la comisión de una lotería antes de cerrarla
     * @param _lotteryId ID de la lotería
     * @param _newPercent Nuevo porcentaje (base 10000)
     */
    function setLotteryCommission(uint256 _lotteryId, uint256 _newPercent) 
        external 
        onlyCreatorOrOwner(_lotteryId)
        lotteryExists(_lotteryId)
        lotteryOpen(_lotteryId)
    {
        require(_newPercent <= MAX_COMMISSION_PERCENT, "Comision excede el maximo (10%)");
        
        uint256 oldPercent = lotteries[_lotteryId].commissionPercent;
        lotteries[_lotteryId].commissionPercent = _newPercent;
        
        emit CommissionChanged(_lotteryId, oldPercent, _newPercent);
    }
    
    /**
     * @notice Obtiene IDs de loterías creadas por un usuario
     * @param _creator Dirección del creador
     * @return Array con IDs de sus loterías
     */
    function getLotteriesByCreator(address _creator) external view returns (uint256[] memory) {
        // Contar loterías del creador
        uint256 count = 0;
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (lotteries[i].creator == _creator) {
                count++;
            }
        }
        
        // Crear y llenar array
        uint256[] memory creatorLotteries = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (lotteries[i].creator == _creator) {
                creatorLotteries[index] = i;
                index++;
            }
        }
        
        return creatorLotteries;
    }
    
    /**
     * @notice Obtiene IDs de loterías activas (abiertas)
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
        uint256[] memory activeLotteries = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nextLotteryId; i++) {
            if (!lotteries[i].closed && 
                (lotteries[i].endTime == 0 || block.timestamp < lotteries[i].endTime)) {
                activeLotteries[index] = i;
                index++;
            }
        }
        
        return activeLotteries;
    }
    
    /**
     * @notice Verifica si una lotería puede cerrarse
     * @param _lotteryId ID de la lotería
     * @return true si puede cerrarse
     */
    function canCloseLottery(uint256 _lotteryId) external view lotteryExists(_lotteryId) returns (bool) {
        Lottery storage lottery = lotteries[_lotteryId];
        
        if (lottery.closed || lottery.ticketsSold == 0) {
            return false;
        }
        
        // Puede cerrarse si alcanzó maxTickets o expiró tiempo
        if (lottery.maxTickets > 0 && lottery.ticketsSold >= lottery.maxTickets) {
            return true;
        }
        
        if (lottery.endTime > 0 && block.timestamp >= lottery.endTime) {
            return true;
        }
        
        return true; // Siempre puede cerrarse manualmente
    }
    
    // Implementación requerida por herencia
    function _autoCloseLottery(uint256 _lotteryId) internal virtual override {
        revert("Debe ser implementada por contrato final");
    }
}
