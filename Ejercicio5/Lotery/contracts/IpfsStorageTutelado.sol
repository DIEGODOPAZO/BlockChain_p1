// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Guarda en blockchain el CID de la captura de pantalla (imagen) 
// que el usuario subió a tu nodo IPFS como comprobante de participación
contract LotteryIPFS {
    // Un usuario => CID de su imagen
    mapping(address => string) public participationImageCID;

    // Guarda la referencia IPFS de la imagen
    function setParticipationImageCID(string calldata cid) external {
        participationImageCID[msg.sender] = cid;
    }
}
