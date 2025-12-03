import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { abis, addresses } from "../contracts";

function LotteryStats() {
  const { id } = useParams();
  const lotteryId = id;
  
  const [account, setAccount] = useState(null);
  const [info, setInfo] = useState(null);
  const [myTickets, setMyTickets] = useState("0");
  const [isCreator, setIsCreator] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [doingAction, setDoingAction] = useState(false);

  const lotteryAbi = abis.lottery.abi;
  const lotteryAddress = addresses.lottery;

  const getContract = () => {
    if (!window.ethereum) {
      throw new Error("No se ha encontrado MetaMask.");
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(lotteryAddress, lotteryAbi, signer);
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("Instala MetaMask para continuar");
        return;
      }
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
      setMessage("Wallet conectada");
    } catch (e) {
      console.error(e);
      setMessage("Error al conectar la wallet");
    }
  };

  const loadData = async () => {
    if (!account) return;
    try {
      setLoading(true);
      setMessage("Cargando datos...");

      const contract = getContract();

      const lotteryInfo = await contract.getLotteryInfo(lotteryId);
      setInfo(lotteryInfo);

      const creator = lotteryInfo.creator;
      if (creator && account) {
        setIsCreator(creator.toLowerCase() === account.toLowerCase());
      }

      const ticketsBn = await contract.getMyTickets(lotteryId, account);
      setMyTickets(ticketsBn.toString());

      const participants = await contract.getParticipants(lotteryId);
      for (const addr of participants) {
        const stats = await contract.getParticipantStats(addr);
        console.log("Participant stats", addr, stats);
      }

      setMessage("Datos cargados");
    } catch (e) {
      console.error(e);
      setMessage("Error al cargar datos de la lotería");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, lotteryId]);

  const handleNumTickets = async () => {
    try {
      if (!account) {
        await connectWallet();
      }
      if (!account) return;

      const contract = getContract();
      const ticketsBn = await contract.getMyTickets(lotteryId, account);
      const n = ticketsBn.toString();
      setMyTickets(n);
      alert(`Tienes ${n} tickets en la lotería ${lotteryId}`);
    } catch (e) {
      console.error(e);
      setMessage("Error al obtener tus tickets");
    }
  };

  const handleBuy = async () => {
    try {
      if (!account) {
        await connectWallet();
      }
      if (!account || !info) return;

      setDoingAction(true);
      setMessage("Comprando ticket...");

      const contract = getContract();
      const priceWei = info.ticketPrice;

      const tx = await contract.buyTickets(lotteryId, 1, { value: priceWei });
      await tx.wait();

      await loadData();
      setMessage("Ticket comprado");
    } catch (e) {
      console.error(e);
      setMessage("Error al comprar ticket");
    } finally {
      setDoingAction(false);
    }
  };

  const handleClose = async () => {
    try {
      if (!account) {
        await connectWallet();
      }
      if (!account) return;

      setDoingAction(true);
      setMessage("Cerrando lotería...");

      const contract = getContract();
      const tx = await contract.closeLottery(lotteryId);
      await tx.wait();

      await loadData();
      setMessage("Lotería cerrada");
    } catch (e) {
      console.error(e);
      setMessage("Error al cerrar la lotería");
    } finally {
      setDoingAction(false);
    }
  };

  const handleChangeCommission = async () => {
    if (!info) {
      alert("Primero carga los datos de la lotería");
      return;
    }

    const actual = info.commissionPercent.toString();
    const nuevoStr = window.prompt(
      "Nueva comisión (base 10000, ej: 200 = 2.00%)",
      actual
    );
    if (nuevoStr === null) return;

    const nuevo = parseInt(nuevoStr, 10);
    if (Number.isNaN(nuevo)) {
      alert("Valor no válido");
      return;
    }

    try {
      if (!account) {
        await connectWallet();
      }
      if (!account) return;

      setDoingAction(true);
      setMessage("Cambiando comisión...");

      const contract = getContract();
      const tx = await contract.setLotteryCommission(lotteryId, nuevo);
      await tx.wait();

      await loadData();
      setMessage("Comisión cambiada");
    } catch (e) {
      console.error(e);
      setMessage("Error al cambiar la comisión");
    } finally {
      setDoingAction(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "500px",
        margin: "2rem auto",
        padding: "1.5rem",
        border: "1px solid #ccc",
        borderRadius: "10px",
        textAlign: "center",
      }}
    >
      <h1>Stats of my Lottery</h1>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>Lottery ID: {lotteryId}</p>

      {message && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{message}</p>
      )}

      {!account && (
        <button
          onClick={connectWallet}
          style={{ marginTop: "1rem", marginBottom: "1rem" }}
        >
          Conectar wallet
        </button>
      )}

      {account && (
        <p style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
          Connected: <code>{account}</code>
        </p>
      )}

      {loading && <p>Cargando datos...</p>}

      {info && (
        <div style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
          <p>
            <strong>Name:</strong> {info.name}
          </p>
          <p>
            <strong>Ticket price:</strong>{" "}
            {ethers.utils.formatEther(info.ticketPrice)} ETH
          </p>
          <p>
            <strong>Tickets sold:</strong> {info.ticketsSold.toString()}
          </p>
          <p>
            <strong>Closed:</strong> {info.closed ? "Yes" : "No"}
          </p>
          <p>
            <strong>My tickets:</strong> {myTickets}
          </p>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button onClick={handleNumTickets}>Num tickets</button>

        {!isCreator && (
          <button onClick={handleBuy} disabled={doingAction}>
            {doingAction ? "Buying..." : "Buy"}
          </button>
        )}

        {isCreator && (
          <>
            <button onClick={handleClose} disabled={doingAction}>
              {doingAction ? "Closing..." : "Close"}
            </button>
            <button onClick={handleChangeCommission} disabled={doingAction}>
              Change commission
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default LotteryStats;