import "./App.css";
import { useState } from "react";

import Home from "./components/Home";
import Navbar from "./components/NavBar";
import MyLotteries from "./components/MyLotteries";
import IpfsUploader from "./components/IpfsUploader";

function App() {
  const [page, setPage] = useState("Home");

  return (
    <div className="App">
      <Navbar onNavigate={setPage} currentPage={page} />

      <div style={{ marginTop: "90px" }}>
        {page === "Home" && <Home />}
        {page === "MyLotteries" && <MyLotteries />}
        {page === "IPFS" && <IpfsUploader />}
      </div>
    </div>
  );
}

export default App;
