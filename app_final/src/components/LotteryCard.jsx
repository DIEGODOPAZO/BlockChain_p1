import { useNavigate } from "react-router-dom";

export default function LotteryCard({ data }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/lottery/${data.id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        border: "1px solid #ccc",
        borderRadius: "10px",
        padding: "14px 18px",
        cursor: "pointer",
        background: "#ffffff",
        transition: "0.2s",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        width: "90%", // ← IMPORTANTE
        minHeight: "70px", // ← no se corta y no es tan grande
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
    >
      <h3 style={{ margin: 0, marginBottom: "6px" }}>{data.name}</h3>

      <p style={{ margin: 0, fontSize: "14px" }}>
        <strong>Creador:</strong> {data.creator}
      </p>

      <p style={{ margin: 0, fontSize: "14px" }}>
        <strong>Precio ticket:</strong> {data.ticketPrice.toString()} wei
      </p>
    </div>
  );
}
