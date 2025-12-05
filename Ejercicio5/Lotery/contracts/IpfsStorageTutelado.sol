// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

contract LotteryIPFS {

    mapping(uint256 => string) public descriptionCID;

    event DescriptionStored(uint256 indexed lotteryId, string cid);

    function setDescription(uint256 lotteryId, string calldata cid) external {
        descriptionCID[lotteryId] = cid;
        emit DescriptionStored(lotteryId, cid);
    }

    function getDescription(uint256 lotteryId) external view returns (string memory) {
        return descriptionCID[lotteryId];
    }
}