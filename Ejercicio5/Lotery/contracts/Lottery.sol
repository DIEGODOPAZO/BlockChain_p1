// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./LotteryStorage.sol";
import "./GetRandom.sol";

/**
 * @title Lottery
 * @dev Contrato principal con toda la lógica del sistema de lotería
 * @notice Este es el contrato que debe desplegarse
 */
contract Lottery is LotteryStorage, GetRandom {
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    // Constructor para inicializar el owner
    constructor() {
        owner = msg.sender;
        nextLotteryId = 0;
        // corrección
        activeLotteriesCount = 0;
    }
    
    // ============================================
    // FUNCIONES DE CREACIÓN Y ADMINISTRACIÓN
    // ============================================
    
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

        // corrección
        activeLotteriesCount++;
        
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
    
    // ============================================
    // FUNCIONES DE USUARIOS
    // ============================================

    // corrección, quitar safemath
    function buyTickets(uint256 lotteryId, uint256 quantity) external payable{
        Lottery storage lot = lotteries[lotteryId];
    
        uint256 totalPrice = quantity * lot.ticketPrice;

        require(!lot.closed, "Lottery is closed");
        require(quantity > 0, "Quantity must be greater than 0");
        require(msg.value == totalPrice, "Invalid amount of ETH sent");

        // corrección
        // Asignar cada ticket individual al comprador
        uint256 startTicketId = lot.ticketsSold;
        for (uint256 i = 0; i < quantity; i++) {
            lot.ticketOwner[startTicketId + i] = msg.sender;
        }

        // Actualizar tickets vendidos
        lot.ticketsSold = lot.ticketsSold + quantity;

        // Actualizar tickets del participante
        lot.ticketsByAddress[msg.sender] = lot.ticketsByAddress[msg.sender] + quantity;

        // Agregar a participantes si es la primera vez
        if (lot.ticketsByAddress[msg.sender] == quantity) {
            lot.participants.push(msg.sender);
        }

        // Actualizar el pot
        lot.pot = lot.pot + msg.value;

        // Emitir evento
        emit TicketPurchased(lotteryId, msg.sender, quantity);

    }

    function getMyTickets(uint256 lotteryId, address participant) external view returns (uint256){
        return lotteries[lotteryId].ticketsByAddress[participant];
    }
    
    // ============================================
    // FUNCIONES DE CIERRE Y SELECCIÓN DE GANADOR
    // ============================================
    
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
    
    // corrección
    /**
     * @notice Permite al ganador reclamar su premio
     * @param lotteryId ID de la lotería
     */
    function claimPrize(uint256 lotteryId) external {
        Lottery storage lot = lotteries[lotteryId];
        
        require(lotteryId < nextLotteryId, "Lottery does not exist");
        require(lot.closed, "Lottery not closed yet");
        require(msg.sender == lot.winner, "Only winner can claim");
        require(pendingWithdrawals[msg.sender] > 0, "No prize to claim");
        
        uint256 amount = pendingWithdrawals[msg.sender];
        pendingWithdrawals[msg.sender] = 0;
        
        // corrección, usar .call en vez de .transfer
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Permite a cualquier usuario retirar sus fondos pendientes
     * @dev Patrón Pull: los usuarios retiran cuando quieran
     */
    // añadido
    function withdraw() external {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        // Checks-Effects-Interactions: primero actualizar estado
        pendingWithdrawals[msg.sender] = 0;
        
        // Luego transferir
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    // Cierra la lotería y selecciona ganador
    function _closeLottery(uint256 lotteryId) internal {
        Lottery storage lot = lotteries[lotteryId];
        
        lot.closed = true;
        // corrección
        if (activeLotteriesCount > 0) {
            activeLotteriesCount--;
        }
        emit LotteryClosed(lotteryId, msg.sender);
        
        _selectWinnerAndDistribute(lotteryId);
    }
    
    // corrección
    // Selecciona ganador y distribuye fondos
    function _selectWinnerAndDistribute(uint256 lotteryId) internal {
        Lottery storage lot = lotteries[lotteryId];
        
        // Generar número aleatorio entre 0 y total de tickets -1
        uint256 winningTicketNumber = getRandom(lot.ticketsSold);
        
        // Encontrar ganador en O(1) usando el mapping
        address winner = _findWinnerByTicketNumber(lotteryId, winningTicketNumber);
        lot.winner = winner;
        
        // Calcular distribución de fondos
        uint256 totalPot = lot.pot;
        uint256 totalCommission = (totalPot * lot.commissionPercent) / 10000;
        uint256 ownerCommission = totalCommission / 2;
        uint256 creatorCommission = totalCommission / 2;
        uint256 prize = totalPot - totalCommission;
        
        lot.pot = 0;
        
        // corrección, Pull (guardar saldos en vez de enviar)
        // En lugar de hacer transfer, acumulamos en pendingWithdrawals
        pendingWithdrawals[owner] += ownerCommission;
        
        if (lot.creator != owner) {
            pendingWithdrawals[lot.creator] += creatorCommission;
        } else {
            // Si creator = owner, sumar todo a owner
            pendingWithdrawals[owner] += creatorCommission;
        }
        
        pendingWithdrawals[winner] += prize;
        
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

        // corrección
        // Acceso directo O(1) al dueño del ticket
        address winner = lot.ticketOwner[ticketNumber];
        
        require(winner != address(0), "Invalid ticket number");
        
        return winner;
    }
    
    // ============================================
    // FUNCIONES VIEW (LECTURA)
    // ============================================
    
    // Devuelve la información de una loteria
    function getLotteryInfo(uint256 lotteryId) external view returns (LotteryView memory){
        Lottery storage lot = lotteries[lotteryId];

        return LotteryView({
            id: lot.id,
            creator: lot.creator,
            name: lot.name,
            ticketPrice: lot.ticketPrice,
            maxTickets: lot.maxTickets,
            ticketsSold: lot.ticketsSold,
            startTime: lot.startTime,
            endTime: lot.endTime,
            commissionPercent: lot.commissionPercent,
            closed: lot.closed,
            winner: lot.winner,
            pot: lot.pot,
            participants: lot.participants
        });
    }

    // Devuelve los participantes de una loteria
    function getParticipants(uint256 lotteryId) external view returns (address[] memory){
        return lotteries[lotteryId].participants;
    }
    
    // Devuelve el numero de tickets que tiene un usuario en una loteria
    function getTicketsOf(uint256 lotteryId, address user) external view returns (uint256) {
        return lotteries[lotteryId].ticketsByAddress[user];
    }
    
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
        return (
            nextLotteryId,
            // corrección
            activeLotteriesCount,
            owner,
            defaultCommissionPercent
        );
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


    /**
     * @notice Consulta el saldo pendiente de retiro de una dirección
     * @param account Dirección a consultar
     * @return Cantidad pendiente de retirar en wei
     */
    // añadido
    function getPendingWithdrawal(address account) external view returns (uint256) {
        return pendingWithdrawals[account];
    }
}