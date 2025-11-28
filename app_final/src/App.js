import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { create } from "kubo-rpc-client";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { addresses, abis } from "./contracts";

async function connectToSepolia() {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const network = await provider.getNetwork();

  if (network.chainId !== 11155111) {
    try {
      // Intentar cambiar a Sepolia
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // 11155111 en hex
      });
    } catch (switchError) {
      // Si Sepolia no está agregada, la añadimos
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia test network",
              nativeCurrency: {
                name: "Sepolia ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } else {
        console.error("Error cambiando de red:", switchError);
      }
    }
  }
}

await connectToSepolia();

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

let client;

// Conectar el proveedor de MetaMask
const defaultProvider = new ethers.providers.Web3Provider(window.ethereum);

// Pedir permiso al usuario para acceder a su wallet
await window.ethereum.request({ method: "eth_requestAccounts" });

// Obtener el signer y la dirección del usuario
const signer = defaultProvider.getSigner();
const userAddress = await signer.getAddress();

// Instanciar el contrato con el provider (solo lectura)
const ipfsContract = new ethers.Contract(
  addresses.ipfs,
  abis.ipfs,
  defaultProvider
);

const network = await defaultProvider.getNetwork();
console.log("Red actual:", network.name, "Chain ID:", network.chainId);

// Leer los archivos del usuario desde el contrato
async function readCurrentUserFile() {
  try {
    console.log("Leyendo archivos del usuario:", userAddress);
    console.log({ ipfsContract });
    const result = await ipfsContract.userFiles(userAddress);
    console.log({ result });
    return result;
  } catch (error) {
    console.error("Error leyendo archivos del usuario:", error);
  }
}
function App() {
  const [ipfsHash, setIpfsHash] = useState("");

  useEffect(() => {
    window.ethereum.enable();
  }, []);
  /*
  *
  let abi = JSON.parse('[{"inputs": [{"internalType": "string","name": "file","type":
  "string"}],"name": "setFileIPFS","outputs": [],"stateMutability":
  "nonpayable","type": "function"},{"inputs": [{"internalType": "address","name":
  "","type": "address"}],"name": "userFiles","outputs": [{"internalType":
  "string","name": "","type": "string"}],"stateMutability": "view","type":
  "function"}]')
  let address = "0x7d2C909F0b4d2fb2993b92CC343A6834585831BF";
  *
  */

  let [connected, setConnected] = useState(false);
  const [file, setFile] = useState(null);

  useEffect(() => {
    async function readFile() {
      try {
        const file = await readCurrentUserFile();
        // Si file es null/undefined/empty, no setear
        if (file && file !== ZERO_ADDRESS) setIpfsHash(file);
      } catch (err) {
        console.error("Error leyendo hash inicial:", err);
      }
    }
    readFile();
  }, []);

  async function setFileIPFS(hash) {
    const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
    console.log("TX contract");
    const tx = await ipfsWithSigner.setFileIPFS(hash);
    console.log({ tx });
    setIpfsHash(hash);
  }

  async function setFileIPFS(hash) {
    const ipfsWithSigner = ipfsContract.connect(defaultProvider.getSigner());
    console.log("TX contract");
    const tx = await ipfsWithSigner.setParticipationImageCID(hash);
    console.log({ tx });
    setIpfsHash(hash);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(file);
      // conectar a la instancia en local de ipfs
      const client = await create({ url: "http://127.0.0.1:5001" });
      // añadir le archivo a ipfs
      const result = await client.add(file);
      // añadir al fs del nodo ipfs en local para poder visualizarlo en el dashboard
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);

      console.log(result.cid);
      // añadir el CID de ipfs a ethereum a traves del smart contract
      await setFileIPFS(result.cid.toString());

      // copiar el CID al portapapeles
      // Copiar al portapapeles
      try {
        await navigator.clipboard.writeText(result.cid.toString());
        alert(`¡CID copiado al portapapeles! ${result.cid.toString()}`);
      } catch (err) {
        console.error("Error copiando al portapapeles:", err);
      }
    } catch (error) {
      alert(error.message);
      console.log(error.message);
    }
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(data);
    console.log(data);
    reader.onloadend = () => {
      console.log("Buffer data: ", Buffer(reader.result));
      setFile(Buffer(reader.result));
    };
    e.preventDefault();
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Upload an screenshot of your ticket purchases to store it on IPFS and
          have it as an immutable proof of purchase!
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <input type="file" name="data" onChange={retrieveFile} />
          <button type="submit" className="btn">
            Upload
          </button>
        </form>
      </header>    
    </div>
  );
}

export default App;
