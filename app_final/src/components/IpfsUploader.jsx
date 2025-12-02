import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { create } from "kubo-rpc-client";
import { abis, addresses } from "../contracts";

export default function IpfsUploader() {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000000000000000000000000000";
  
  const [ipfsHash, setIpfsHash] = useState("");
  const [connected, setConnected] = useState(false);
  const [file, setFile] = useState(null);
  const [ipfsContract, setIpfsContract] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [client, setClient] = useState(null);

  async function connectToSepolia() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const network = await provider.getNetwork();

    if (network.chainId !== 11155111) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }],
        });
      } catch (switchError) {
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
    return provider;
  }

  async function connectWallet() {
    try {
      // Conectar a Sepolia primero
      const provider = await connectToSepolia();
      
      // Pedir permiso al usuario
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Obtener el signer y dirección
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Instanciar contrato
      const contract = new ethers.Contract(
        addresses.ipfs,
        abis.ipfs,
        signer
      );

      // Conectar a IPFS
      const ipfsClient = await create({ url: "http://127.0.0.1:5001" });

      setSigner(signer);
      setUserAddress(address);
      setIpfsContract(contract);
      setClient(ipfsClient);
      setConnected(true);

      return { contract, address, provider };
    } catch (error) {
      console.error("Error conectando wallet:", error);
      throw error;
    }
  }

  async function readCurrentUserFile() {
    if (!ipfsContract || !userAddress) return null;
    
    try {
      console.log("Leyendo archivos del usuario:", userAddress);
      const result = await  ipfsContract.participationImageCID(userAddress);
      console.log({ result });
      return result;
    } catch (error) {
      console.error("Error leyendo archivos del usuario:", error);
      return null;
    }
  }

  async function setFileIPFS(hash) {
    if (!ipfsContract || !signer) {
      throw new Error("Contrato no inicializado o wallet no conectada");
    }
    
    console.log("Enviando transacción con hash:", hash);
    const tx = await ipfsContract.setParticipationImageCID(hash);
    console.log("Transacción enviada:", tx.hash);
    
    // Esperar confirmación
    await tx.wait();
    console.log("Transacción confirmada");
    
    setIpfsHash(hash);
    return tx;
  }

  useEffect(() => {
    async function initialize() {
      try {
        await window.ethereum.enable();
        
        // Conectar wallet y leer archivo existente
        const { contract, address } = await connectWallet();
        
        // Leer archivo del usuario
        const file = await contract.userFiles(address);
        if (file && file !== ZERO_ADDRESS && file !== "") {
          setIpfsHash(file);
        }
      } catch (err) {
        console.error("Error inicializando:", err);
      }
    }

    if (window.ethereum) {
      initialize();
    } else {
      console.error("MetaMask no detectado");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert("Por favor, selecciona un archivo primero");
      return;
    }

    if (!client || !ipfsContract) {
      alert("Por favor, conecta tu wallet primero");
      return;
    }

    try {
      console.log("Subiendo archivo:", file);
      
      // Añadir archivo a IPFS
      const result = await client.add(file);
      
      // Añadir al filesystem del nodo IPFS local
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);

      console.log("CID generado:", result.cid.toString());
      
      // Añadir el CID al smart contract
      await setFileIPFS(result.cid.toString());

      // Copiar al portapapeles
      try {
        await navigator.clipboard.writeText(result.cid.toString());
        alert(`¡CID copiado al portapapeles! ${result.cid.toString()}`);
      } catch (err) {
        console.error("Error copiando al portapapeles:", err);
        alert(`CID: ${result.cid.toString()}`);
      }
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    if (!data) return;
    
    const reader = new FileReader();
    reader.readAsArrayBuffer(data);
    
    reader.onloadend = () => {
      console.log("Archivo seleccionado:", data.name, data.size, "bytes");
      setFile(Buffer.from(reader.result));
    };
    
    e.preventDefault();
  };

  return (
    <div style={{ width: "100%", padding: "40px", boxSizing: "border-box", minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            paddingBottom: "20px",
            borderBottom: "1px solid #e5e5e5",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#1f2937" }}>
            Almacenar Prueba de Compra
          </h2>
          <p style={{ color: "#666", lineHeight: "1.6" }}>
            Sube una captura de pantalla de tus compras de tickets para almacenarla
            en IPFS y tenerla como prueba inmutable de tu compra.
          </p>
        </div>

        {!connected ? (
          <button
            onClick={connectWallet}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              background: "#3b82f6",
              color: "white",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
          >
            Conectar Wallet
          </button>
        ) : (
          <>
            <div
              style={{
                padding: "15px",
                background: "#c2e7ff",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 8px 0", color: "#0369a1", fontWeight: "600" }}>
                Conectado
              </p>
              <p style={{ margin: 0, color: "#0c4a6e", fontSize: "14px", fontFamily: "monospace" }}>
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </p>
            </div>

            {ipfsHash && (
              <div
                style={{
                  padding: "15px",
                  background: "#f0fdf4",
                  borderRadius: "8px",
                  borderLeft: "4px solid #22c55e",
                }}
              >
                <p style={{ margin: "0 0 8px 0", color: "#166534", fontWeight: "600" }}>
                  Hash IPFS Actual
                </p>
                <p
                  style={{
                    margin: 0,
                    color: "#15803d",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    wordBreak: "break-all",
                  }}
                >
                  {ipfsHash}
                </p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div
                style={{
                  padding: "20px",
                  border: "2px dashed #d1d5db",
                  borderRadius: "8px",
                  textAlign: "center",
                  backgroundColor: "#f9fafb",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.backgroundColor = "#eff6ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d1d5db";
                  e.currentTarget.style.backgroundColor = "#f9fafb";
                }}
              >
                <input
                  type="file"
                  name="data"
                  onChange={retrieveFile}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <p style={{ margin: "10px 0 0 0", color: "#999", fontSize: "14px" }}>
                  {file ? `Archivo: ${file.length} bytes` : "Selecciona un archivo..."}
                </p>
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: "#3b82f6",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
              >
                Subir Archivo
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}