import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { abis, addresses } from "../contracts";

export default function LotteryStats() {
  const { id } = useParams();
  const lotteryId = id;

  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buyAmount, setBuyAmount] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [processingBuy, setProcessingBuy] = useState(false);
  const [processingClose, setProcessingClose] = useState(false);
  const [myTickets, setMyTickets] = useState(0);

  // ---- UserTickets ---
  const fetchMyTickets = async (contractInstance, user) => {
    if (!contractInstance || !user) return;

    try {
      const tickets = await contractInstance.getMyTickets(lotteryId, user);
      setMyTickets(tickets.toString());
    } catch (err) {
      console.error("Error fetching my tickets:", err);
    }
  };

  // --- INIT: Load wallet + contract ---
  useEffect(() => {
    async function init() {
      if (!window.ethereum) return alert("MetaMask no detectado");

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

      fetchMyTickets(contractTmp, address);

      fetchLotteryInfo(contractTmp);
    }

    init();
  }, []);

  // --- LOAD LOTTERY INFO ---
  const fetchLotteryInfo = async (contractInstance) => {
    if (!contractInstance) return;
    setLoading(true);

    try {
      const data = await contractInstance.getLotteryInfo(lotteryId);
      setInfo(data);
      fetchMyTickets(contractInstance, userAddress);
    } catch (err) {
      console.error("Error loading lottery:", err);
    }

    setLoading(false);
  };

  // --- BUY TICKETS ---
  const buyTickets = async () => {
    if (!contract || !info) return;

    setProcessingBuy(true);
    setProcessing(true);
    try {
      const totalPrice = info.ticketPrice.mul(buyAmount);
      const tx = await contract.buyTickets(lotteryId, buyAmount, {
        value: totalPrice,
      });
      await tx.wait();

      fetchLotteryInfo(contract);
      alert("Tickets comprados correctamente");
    } catch (err) {
      console.error(err);
      alert("Error al comprar tickets");
    }
    setProcessing(false);
    setProcessingBuy(false);
  };

  // --- CLOSE LOTTERY ---
  const closeLottery = async () => {
    if (!contract) return;

    setProcessingClose(true);
    setProcessing(true);
    try {
      const tx = await contract.closeLottery(lotteryId);
      await tx.wait();
      fetchLotteryInfo(contract);
      
    } catch (err) {
      console.error(err);
      alert("Error al cerrar lotería");
    }

    setProcessingClose(false);
    setProcessing(false);
  };

  // --- HELPERS ---
  const formatEth = (wei) => ethers.utils.formatEther(wei || 0);

  return (
    <div style={{ padding: "40px" }}>
      {loading || !info ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "100px",
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
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "25px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h1 style={{ marginBottom: "10px" }}>{info.name}</h1>

          <p>
            <strong>ID:</strong> {info.id.toString()}
          </p>
          <p>
            <strong>Creador:</strong> {info.creator}
          </p>
          <p>
            <strong>Precio Ticket:</strong> {formatEth(info.ticketPrice)} ETH
          </p>
          <p>
            <strong>Máx Tickets:</strong> {info.maxTickets.toString()}
          </p>
          <p>
            <strong>Vendidos:</strong> {info.ticketsSold.toString()}
          </p>
          <p>
            <strong>Mis Tickets:</strong> {myTickets}
          </p>
          <p>
            <strong>Comisión:</strong> {info.commissionPercent.toString()}%
          </p>
          <p>
            <strong>Pozo:</strong> {formatEth(info.pot)} ETH
          </p>
          <p>
            <strong>Estado:</strong> {info.closed ? "Cerrada" : "Activa"}
          </p>

          {!info.closed ? (
            <>
              {/* ---- BUY TICKETS ---- */}
              <div style={{ marginTop: "20px" }}>
                <h3>Comprar Tickets</h3>
                <input
                  type="number"
                  min="1"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(Number(e.target.value))}
                  style={{
                    padding: "8px",
                    width: "100px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                  }}
                />

                <button
                  onClick={buyTickets}
                  disabled={processing}
                  style={{
                    marginLeft: "15px",
                    padding: "10px 20px",
                    background: processing ? "#93c5fd" : "#3b82f6",
                    color: "white",
                    borderRadius: "8px",
                    border: "none",
                    cursor: processing ? "not-allowed" : "pointer",
                    opacity: processing ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!processing)
                      e.currentTarget.style.background = "#1d4ed8";
                  }}
                  onMouseLeave={(e) => {
                    if (!processing)
                      e.currentTarget.style.background = "#3b82f6";
                  }}
                >
                  {processingBuy ? "Procesando..." : "Comprar"}
                </button>
              </div>

              {/* ---- CLOSE LOTTERY (IF USER IS CREATOR) ---- */}
              {userAddress.toLowerCase() === info.creator.toLowerCase() && (
                <button
                  onClick={closeLottery}
                  disabled={processing}
                  style={{
                    marginTop: "25px",
                    padding: "12px 25px",
                    background: processing ? "#fca5a5" : "#dc2626",
                    color: "white",
                    borderRadius: "8px",
                    border: "none",
                    cursor: processing ? "not-allowed" : "pointer",
                    width: "100%",
                    opacity: processing ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!processing)
                      e.currentTarget.style.background = "#b91c1c";
                  }}
                  onMouseLeave={(e) => {
                    if (!processing)
                      e.currentTarget.style.background = "#dc2626";
                  }}
                >
                  {processingClose ? "Cerrando..." : "Cerrar Lotería"}
                </button>
              )}
            </>
          ) : (
            <>
              {/* ---- WINNER ---- */}
              <div
                style={{
                  padding: "15px",
                  marginTop: "20px",
                  background: "#e8ffe8",
                  borderRadius: "8px",
                  border: "1px solid #b6ffb6",
                }}
              >
                <h3>🏆 Ganador</h3>
                {info.winner === ethers.constants.AddressZero ? (
                  <p>Aún no seleccionado</p>
                ) : (
                  <>
                    <p>
                      <strong>Address:</strong> {info.winner}
                    </p>
                    <p>
                      <strong>Premio:</strong> {formatEth(info.pot)} ETH
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
