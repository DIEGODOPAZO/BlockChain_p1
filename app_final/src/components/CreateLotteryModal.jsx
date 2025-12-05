import React, { useState, useEffect } from "react";
import { create } from "kubo-rpc-client";

export default function CreateLotteryModal({ contract, onClose }) {
  const [name, setName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [maxTickets, setMaxTickets] = useState("");
  const [endTime, setEndTime] = useState("");
  const [commission, setCommission] = useState("");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);

  const [client, setClient] = useState(null);
  const [ipfsConnected, setIpfsConnected] = useState(false);

  useEffect(() => {
    async function initIPFS() {
      try {
        const ipfsClient = await create({ url: "http://127.0.0.1:5001" });
        setClient(ipfsClient);
        setIpfsConnected(true);
        console.log("IPFS conectado");
      } catch (err) {
        console.error("Error conectando IPFS:", err);
        setIpfsConnected(false);
      }
    }

    initIPFS();
  }, []);

  const createLottery = async () => {
    if (!contract) return alert("Contrato no cargado");
    if (!ipfsConnected || !client) return alert("IPFS no conectado");

    setProcessing(true);
    try {
      if (!name || !ticketPrice || !maxTickets || !endTime || !description) {
        return alert("Completa todos los campos, incluida la descripción");
      }

      const timestamp = Math.floor(new Date(endTime).getTime() / 1000);

      // -------------------------------------
      // 1. Subir descripción a IPFS
      // -------------------------------------
      const jsonMessage = JSON.stringify({ message: description });

      const file = await client.add(jsonMessage);
      const cid = file.cid.toString();

      console.log("Descripción subida a IPFS, CID:", cid);

      // -------------------------------------
      // 2. Crear lotería con descriptionCID
      // -------------------------------------
      const tx = await contract.createLottery(
        name,
        ticketPrice,
        maxTickets,
        timestamp,
        commission || 0,
        cid
      );

      await tx.wait();

      alert("Lotería creada!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error al crear lotería: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          width: "350px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <h2>Crear nueva lotería</h2>

        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
          }}
        />

        <input
          type="number"
          placeholder="Precio ticket (wei)"
          value={ticketPrice}
          onChange={(e) => setTicketPrice(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
          }}
        />

        <input
          type="number"
          placeholder="Máximo de tickets"
          value={maxTickets}
          onChange={(e) => setMaxTickets(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
          }}
        />

        <input
          type="datetime-local"
          placeholder="Fecha fin"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
          }}
        />

        <input
          type="number"
          placeholder="Comisión % (opcional)"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
          }}
        />
        <textarea
          placeholder="Descripción / mensaje para los participantes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
            height: "80px",
            resize: "none",
          }}
        />

        <button
          onClick={createLottery}
          disabled={processing}
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: processing ? "#93c5fd" : "#3b82f6",
            color: "white",
            border: "none",
            cursor: processing ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!processing) e.currentTarget.style.background = "#1d4ed8";
          }}
          onMouseLeave={(e) => {
            if (!processing) e.currentTarget.style.background = "#3b82f6";
          }}
        >
          {processing ? "Procesando..." : "Crear"}
        </button>

        <button
          onClick={onClose}
          disabled={processing}
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
            background: "white",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f3f3")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
