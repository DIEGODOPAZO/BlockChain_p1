import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { abis, addresses } from "../contracts";
import LotteryCard from "./LotteryCard";
import CreateLotteryModal from "./CreateLotteryModal";

export default function MyLotteries() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Load provider + contract
  useEffect(() => {
    async function init() {
      if (!window.ethereum) return alert("MetaMask no detectado");

      // Solicita conexión
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const address = accounts[0];

      const providerTmp = new ethers.providers.Web3Provider(window.ethereum);
      const signer = providerTmp.getSigner();
      const contractTmp = new ethers.Contract(
        addresses.lottery,
        abis.lottery,
        signer
      );

      setProvider(providerTmp);
      setContract(contractTmp);
      setUserAddress(address);

      fetchUserLotteries(contractTmp, address);
    }

    init();
  }, []);

  const fetchUserLotteries = async (contractInstance, address) => {
    if (!contractInstance || !address) return;
    setLoading(true);

    try {
      const ids = await contractInstance.getLotteriesByCreator(address);
      const arr = [];

      for (let id of ids) {
        const info = await contractInstance.getLotteryInfo(id);
        arr.push(info);
      }

      setLotteries(arr);
    } catch (err) {
      console.error(err);
      setLotteries([]);
    }

    setLoading(false);
  };

  return (
    <div style={{ width: "100%", padding: "40px", boxSizing: "border-box" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "900px",
          gap: "8px",
          maxHeight: "500px",
          overflowY: "auto",
          paddingRight: "2px",
          margin: "0 auto",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
            }}
          >
            <div
              style={{
                border: "4px solid #ddd",
                borderTop: "4px solid #3b82f6",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        ) : (
          lotteries.map((lottery, idx) => (
            <LotteryCard key={idx} data={lottery} />
          ))
        )}
        <button
          onClick={() => setShowModal(true)}
          style={{
            position: "fixed",
            bottom: "25px",
            right: "25px",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#3b82f6",
            color: "white",
            fontSize: "32px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
        >
          +
        </button>

        {/* --- MODAL --- */}
        {showModal && (
          <CreateLotteryModal
            contract={contract}
            onClose={() => setShowModal(false)}
          />
        )}
      </div>
    </div>
  );
}
