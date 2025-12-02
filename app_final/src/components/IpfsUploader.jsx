import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Buffer } from "buffer";
import { create } from "kubo-rpc-client";
import { abis, addresses } from "../contracts";

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export default function IpfsUploader() {
  const [file, setFile] = useState(null);
  const [ipfsHash, setIpfsHash] = useState("");
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [ipfsContract, setIpfsContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");

  // -----------------------------
  // 1. Conectar a metamask + contrato
  // -----------------------------
  useEffect(() => {
    async function init() {
      if (!window.ethereum) return alert("MetaMask no detectado");

      const providerTmp = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(providerTmp);

      await window.ethereum.request({ method: "eth_requestAccounts" });

      const signerTmp = providerTmp.getSigner();
      setSigner(signerTmp);

      const address = await signerTmp.getAddress();
      setUserAddress(address);

      const contractTmp = new ethers.Contract(
        addresses.ipfs,
        abis.ipfs,
        providerTmp
      );

      setIpfsContract(contractTmp);

      readCurrentUserFile(contractTmp, address);
    }

    init();
  }, []);

  // -----------------------------
  // 2. Leer el CID del usuario
  // -----------------------------
  async function readCurrentUserFile(contract, addr) {
    try {
      const result = await contract.userFiles(addr);

      if (result && result !== ZERO_ADDRESS) {
        setIpfsHash(result);
      }
    } catch (err) {
      console.error("Error leyendo archivo:", err);
    }
  }

  // -----------------------------
  // 3. Actualizar CID en el contrato
  // -----------------------------
  async function setFileIPFS(hash) {
    try {
      const contractWithSigner = ipfsContract.connect(signer);
      const tx = await contractWithSigner.setParticipationImageCID(hash);

      await tx.wait();
      setIpfsHash(hash);
    } catch (err) {
      console.error("Error en setFileIPFS:", err);
    }
  }

  // -----------------------------
  // 4. Upload a IPFS
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const client = create({ url: "http://127.0.0.1:5001" });

      const result = await client.add(file);
      await client.files.cp(`/ipfs/${result.cid}`, `/${result.cid}`);

      const cid = result.cid.toString();

      // Guardar en Ethereum
      await setFileIPFS(cid);

      // Copiar
      await navigator.clipboard.writeText(cid);
      alert(`CID copiado: ${cid}`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // -----------------------------
  // 5. Convert file to buffer
  // -----------------------------
  const retrieveFile = (e) => {
    const data = e.target.files[0];
    const reader = new FileReader();

    reader.readAsArrayBuffer(data);
    reader.onloadend = () => setFile(Buffer(reader.result));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Subir imagen a IPFS</h2>

      <p><strong>Tu CID actual:</strong> {ipfsHash || "Ninguno"}</p>

      <form onSubmit={handleSubmit}>
        <input type="file" onChange={retrieveFile} />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
