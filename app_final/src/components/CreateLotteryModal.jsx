import React, { useState } from "react";

export default function CreateLotteryModal({ contract, onClose }) {
  const [name, setName] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [maxTickets, setMaxTickets] = useState("");
  const [endTime, setEndTime] = useState("");
  const [commission, setCommission] = useState("");

  const createLottery = async () => {
    if (!contract) return alert("Contrato no cargado");

    try {
      if (!name || !ticketPrice || !maxTickets || !endTime) {
        return alert("Completa todos los campos");
      }

      // Convertimos fecha "YYYY-MM-DDThh:mm" → timestamp
      const timestamp = Math.floor(new Date(endTime).getTime() / 1000);

      const tx = await contract.createLottery(
        name,
        ticketPrice,
        maxTickets,
        timestamp,
        commission || 0
      );

      await tx.wait();

      onClose();
      alert("Lotería creada!");
    } catch (err) {
      console.error(err);
      alert("Error al crear lotería: " + err.message);
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

        <button
          onClick={createLottery}
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#3b82f6")}
        >
          Crear
        </button>

        <button
          onClick={onClose}
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
