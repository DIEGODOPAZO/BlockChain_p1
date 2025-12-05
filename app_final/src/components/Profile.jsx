import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { abis, addresses } from "../contracts";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [withdrawable, setWithdrawable] = useState("0");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [myTickets, setMyTickets] = useState([]);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    lotteriesParticipated: 0,
    totalTickets: 0,
    lotteriesWon: 0,
  });

  // --- INIT WALLET + CONTRACT ---
  useEffect(() => {
    async function init() {
      if (!window.ethereum) return alert("MetaMask no detectado");

      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const addr = accounts[0];

        const providerTmp = new ethers.providers.Web3Provider(window.ethereum);
        const signer = providerTmp.getSigner();

        const contractTmp = new ethers.Contract(
          addresses.lottery,
          abis.lottery,
          signer
        );

        fetchParticipantStats(contractTmp, addr);

        setProvider(providerTmp);
        setContract(contractTmp);
        setUserAddress(addr);

        // Obtener tickets del usuario
        fetchUserTickets(contractTmp, addr);
        // cargar fondos reclamables
        fetchWithdrawable(contractTmp, addr);
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    }

    init();
  }, []);

  const fetchParticipantStats = async (contractInstance, user) => {
    if (!contractInstance || !user) return;

    try {
      const result = await contractInstance.getParticipantStats(user);
      // result es un array: [lotteriesParticipated, totalTickets, lotteriesWon]
      setStats({
        lotteriesParticipated: result[0].toNumber(),
        totalTickets: result[1].toNumber(),
        lotteriesWon: result[2].toNumber(),
      });
    } catch (err) {
      console.error("Error al obtener estadísticas del participante:", err);
    }
  };

  const fetchUserTickets = async (c, user) => {
    try {
      const total = await c.getTotalLotteries();
      const items = [];

      for (let id = 0; id <= total; id++) {
        const qty = await c.getMyTickets(id, user);
        if (qty > 0) {
          items.push({
            lotteryId: id,
            quantity: qty.toString(),
          });
        }
      }

      setMyTickets(items);
    } catch (err) {
      console.error("Error al cargar tickets del usuario:", err);
    }
  };

  const goToLottery = (id) => {
    navigate(`/lottery/${id}`);
  };

  // --- LOAD PENDING WITHDRAWAL ---
  const fetchWithdrawable = async (contractInstance, user) => {
    if (!contractInstance || !user) return;

    try {
      const amount = await contractInstance.getPendingWithdrawal(user);
      setWithdrawable(amount);
    } catch (err) {
      console.error("Error al obtener fondos reclamables:", err);
    }
  };

  // --- CLAIM PRIZE ---
  const claimPrize = async () => {
    if (!contract) return;

    setProcessing(true);

    try {
      const tx = await contract.withdraw();
      await tx.wait();

      alert("Premio reclamado correctamente");

      fetchWithdrawable(contract, userAddress);
    } catch (err) {
      console.error(err);
      alert("Error al reclamar");
    }

    setProcessing(false);
  };

  const formatEth = (wei) => ethers.utils.formatEther(wei || 0);

  return (
    <div style={{ padding: "40px" }}>
      {loading ? (
        <div style={{ textAlign: "center", marginTop: "80px" }}>
          <div
            style={{
              border: "4px solid #ccc",
              borderTop: "4px solid #3b82f6",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "auto",
            }}
          />
        </div>
      ) : (
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "25px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h1>Perfil</h1>
          <p>
            <strong>Address:</strong> {userAddress}
          </p>

          <h2 style={{ marginTop: "30px" }}>Mis Tickets</h2>

          {/* Tickets */}

          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              marginTop: "10px",
              paddingRight: "10px",
              border: "1px solid #ddd",
              borderRadius: "10px",
            }}
          >
            {myTickets.length === 0 && (
              <p style={{ padding: "10px" }}>No tienes tickets comprados.</p>
            )}
            {myTickets.map((t, index) => (
              <div
                key={index}
                onClick={() => goToLottery(t.lotteryId)}
                style={{
                  padding: "12px",
                  margin: "10px",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#eeeeee")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#f9f9f9")
                }
              >
                <p>
                  <strong>Lotería:</strong> #{t.lotteryId}
                </p>
                <p>
                  <strong>Cantidad:</strong> {t.quantity}
                </p>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: "30px" }}>Estadísticas del Jugador</h2>
          <p>
            <strong>Loterías participadas:</strong>{" "}
            {stats.lotteriesParticipated}
          </p>
          <p>
            <strong>Total de tickets:</strong> {stats.totalTickets}
          </p>
          <p>
            <strong>Loterías ganadas:</strong> {stats.lotteriesWon}
          </p>

          <h2 style={{ marginTop: "30px" }}>Premios</h2>
          <p>
            <strong>Disponible para retirar:</strong> {formatEth(withdrawable)}{" "}
            ETH
          </p>

          <button
            disabled={ethers.BigNumber.from(withdrawable).eq(0) || processing}
            onClick={claimPrize}
            style={{
              marginTop: "15px",
              padding: "12px 25px",
              background:
                ethers.BigNumber.from(withdrawable).eq(0) || processing
                  ? "#9ca3af"
                  : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                ethers.BigNumber.from(withdrawable).eq(0) || processing
                  ? "not-allowed"
                  : "pointer",
              width: "100%",
              opacity:
                ethers.BigNumber.from(withdrawable).eq(0) || processing
                  ? 0.6
                  : 1,
              transition: "all 0.2s",
            }}
          >
            {processing ? "Procesando..." : "Reclamar premios"}
          </button>
        </div>
      )}
    </div>
  );
}
