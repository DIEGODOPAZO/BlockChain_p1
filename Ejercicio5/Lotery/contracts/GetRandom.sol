// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract GetRandom {

    // This contract simulates the genration of a random file

    function getRandom(uint _totalTickets) internal view returns (uint) {
        require(_totalTickets > 0, "No tickets available");
        return uint256(
            keccak256(
                abi.encodePacked(block.prevrandao, block.timestamp, _totalTickets)
            )
        ) % _totalTickets;
    }

}