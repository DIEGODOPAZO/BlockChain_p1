// SPDX-License-Identifier: GPL-3.0

// La struct y las funciones para lectura y eventos
pragma solidity >=0.8.2 <0.9.0;

import "./GetRandom.sol";

/**
 * @title LotteryVariables
 * @dev Defines the struct Lottery, functionalities for retrievin info and events
 */
contract LoteryVariables is GetRandom{
    // Eventos

    /// @notice Se emite cuando se crea una nueva lotería
    event LotteryCreated(
        uint256 indexed lotteryId,
        address indexed creator
    );

    /// @notice Se emite cuando un usuario compra boletos
    event TicketPurchased(
        uint256 indexed lotteryId,
        address indexed buyer,
        uint256 quantity
    );

    /// @notice Se emite cuando se cierra una lotería
    event LotteryClosed(
        uint256 indexed lotteryId,
        address indexed closer
    );

    /// @notice Se emite cuando se selecciona un ganador
    event WinnerSelected(
        uint256 indexed lotteryId,
        address indexed winner,
        uint256 prize
    );

    /// @notice Se emite cuando se modifica la comisión de una lotería
    event CommissionChanged(
        uint256 indexed lotteryId,
        uint256 oldPercent,
        uint256 newPercent
    );


    struct Lottery {

        uint256 id;

        address creator;           // creador/organizador de esta lotería

        string name;               // nombre opcional

        uint256 ticketPrice;       // precio por ticket (en wei)

        uint256 maxTickets;        // 0 = sin límite en número, usar deadline si aplicable

        uint256 ticketsSold;       // número de tickets vendidos

        uint256 startTime;         // timestamp de inicio

        uint256 endTime;           // timestamp de cierre (0 = manual)

        mapping(address => uint256) ticketsByAddress; // nº de tickets por dirección (si se usa mapping, ver consideraciones)

        address[] participants;    // lista de participantes (guardando direcciones únicas)

        uint256 commissionPercent; // porcentaje como base de 10000 (ej. 200 = 2.00%)

        bool closed;

        address winner;

        uint256 pot;               // total acumulado 

    }

    // Usado solo para devolver info de loterias
    struct LotteryView {
        uint256 id;
        address creator;
        string name;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 startTime;
        uint256 endTime;
        uint256 commissionPercent;
        bool closed;
        address winner;
        uint256 pot;
        address[] participants;
    }

    // Variables globales
    uint256 public nextLotteryId;

    mapping(uint256 => Lottery) public lotteries;

    uint256 public defaultCommissionPercent = 200; // e.g., 200 = 2.00% (base 10000)

    address public owner; // administrador del contrato


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
}