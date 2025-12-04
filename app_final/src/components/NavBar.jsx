import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ currentPage }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        width: "100%",
        background: "#3b82f6",
        padding: "15px 25px",
        display: "flex",
        justifyContent: "center",
        gap: "30px",
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1000,
        color: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
      }}
    >
      {["Home", "MyLotteries", "IPFS", "Profile"].map((item) => {
        const pathMap = {
          Home: "/",
          MyLotteries: "/mylotteries",
          IPFS: "/ipfs",
          Profile: "/profile"
        };

        const isActive = location.pathname === pathMap[item];

        return (
          <button
            key={item}
            onClick={() => navigate(pathMap[item])}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              background: isActive ? "#1d4ed8" : "#60a5fa",
              color: "white",
              transition: "0.2s",
              fontWeight: isActive ? "bold" : "normal",
            }}
            onMouseEnter={(e) =>
              !isActive && (e.currentTarget.style.background = "#93c5fd")
            }
            onMouseLeave={(e) =>
              !isActive && (e.currentTarget.style.background = "#60a5fa")
            }
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}
