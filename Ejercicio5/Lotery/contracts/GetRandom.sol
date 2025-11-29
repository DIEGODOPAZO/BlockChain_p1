// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

import "./Lottery.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/interfaces/IVRFCoordinatorV2Plus.sol";
import "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

contract GetRandom is VRFConsumerBaseV2Plus {

    // === CHAINLINK VRF 2.5 CONFIG ===
    address private constant vrfCoordinator = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B;

    bytes32 private constant keyHash =
        0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae;

    // Subscription ID VRF 2.5 (uint256)
    uint256 public constant subscriptionId =
        114153670109614787599335688760464154197518994332423782465060328721744434824731;

    uint32 private constant callbackGasLimit = 200000;
    uint16 private constant requestConfirmations = 3;
    uint32 private constant numWords = 1;

    address public lotteryContract;

    // último número del VRF
    uint256 private lastRandom;

    event RandomRequested(uint256 requestId);
    event RandomUpdated(uint256 newRandom);

    constructor() VRFConsumerBaseV2Plus(vrfCoordinator) {}

    function setLotteryContract(address _lottery) external {
        require(lotteryContract == address(0), "Already set");
        lotteryContract = _lottery;
    }

    function getRandom(uint _totalTickets) public view returns (uint) {
        require(_totalTickets > 0, "No tickets available");
        require(lastRandom != 0, "VRF random not ready yet");

        return lastRandom % _totalTickets;
    }

    function requestRandom() public returns (uint256 requestId) {
        VRFV2PlusClient.RandomWordsRequest memory req =
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: numWords,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
                )
            });

        requestId = IVRFCoordinatorV2Plus(vrfCoordinator).requestRandomWords(req);

        emit RandomRequested(requestId);
    }
    
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] calldata randomWords
    ) internal override {
        lastRandom = randomWords[0];
        emit RandomUpdated(lastRandom);

        if (lotteryContract != address(0)) {
            Lottery(lotteryContract).receiveRandom(requestId, lastRandom);
        }
    }
}