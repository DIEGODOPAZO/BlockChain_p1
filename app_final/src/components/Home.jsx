import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { abis, addresses } from "../contracts";
import LotteryCard from "./LotteryCard";
import CreateLotteryModal from "./CreateLotteryModal";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [lotteries, setLotteries] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load provider + contract
  useEffect(() => {
    async function init() {
      if (!window.ethereum) return alert("MetaMask no detectado");

      const providerTmp = new ethers.providers.Web3Provider(window.ethereum);
      const signer = providerTmp.getSigner();
      const contractTmp = new ethers.Contract(
        addresses.lottery,
        abis.lottery,
        signer
      );

      setProvider(providerTmp);
      setContract(contractTmp);
    }

    init();
  }, []);

  // --- FETCH ALL LOTTERIES ---
  const fetchAllLotteries = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const total = await contract.getTotalLotteries();
      const arr = [];

      for (let i = 0; i < total; i++) {
        const info = await contract.getLotteryInfo(i);
        arr.push(info);
      }

      setLotteries(arr);
    } catch (err) {
      console.error(err);
    }
    setSearch("")
    setLoading(false);
  };

  // --- FETCH ACTIVE LOTTERIES ---
  const fetchActiveLotteries = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const ids = await contract.getActiveLotteries();
      const arr = [];

      for (let id of ids) {
        const info = await contract.getLotteryInfo(id);
        arr.push(info);
      }

      setLotteries(arr);
    } catch (err) {
      console.error(err);
    }
    setSearch("")
    setLoading(false);
  };

  // --- SEARCH BY CREATOR ---
  const searchByCreator = async () => {
    if (!contract || !search) return;
    setLoading(true);
    try {
      const ids = await contract.getLotteriesByCreator(search);
      const arr = [];

      for (let id of ids) {
        const info = await contract.getLotteryInfo(id);
        arr.push(info);
      }

      setLotteries(arr);
    } catch (err) {
      const arr = [];
      setLotteries(arr);
      console.error(err);
    }
    setSearch("")
    setLoading(false);
  };

  return (
    <div style={{ width: "100%", padding: "40px", boxSizing: "border-box" }}>
      {/* SEARCH BAR + FILTER BUTTONS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "30px",
        }}
      >
        <input
          type="text"
          placeholder="Buscar por creador (address)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "40%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
          }}
        />

        <button
          onClick={searchByCreator}
          disabled={search.trim() === ""}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: search.trim() === "" ? "not-allowed" : "pointer",
            background: search.trim() === "" ? "#ccc" : "#e5e5e5",
            color: search.trim() === "" ? "#777" : "black",
          }}
          onMouseEnter={(e) => {
            if (search.trim() !== "")
              e.currentTarget.style.background = "#d4d4d4";
          }}
          onMouseLeave={(e) => {
            if (search.trim() !== "")
              e.currentTarget.style.background = "#e5e5e5";
          }}
        >
          Buscar
        </button>

        <button
          onClick={fetchAllLotteries}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            background: "#ddd",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#c8c8c8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#ddd")}
        >
          All
        </button>

        <button
          onClick={fetchActiveLotteries}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            background: "#c2e7ff",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#aeddff")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#c2e7ff")}
        >
          Active
        </button>
      </div>

      {/* LOTTERY CARDS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "900px", // opcional para mantener buen layout
          gap: "8px", // ← menos espacio entre cards
          maxHeight: "500px",
          overflowY: "auto",
          paddingRight: "2px", // ← scrollbar más pegado
          margin: "0 auto", // centra el contenedor si quieres
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
      </div>
      {/* --- BOTÓN FLOTANTE + --- */}
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
  );
}
