import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar";
import Home from "./components/Home";
import MyLotteries from "./components/MyLotteries";
import IpfsUploader from "./components/IpfsUploader";
import LotteryStats from "./components/LotteryStats";
import Profile from "./components/Profile";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ marginTop: "90px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mylotteries" element={<MyLotteries />} />
          <Route path="/ipfs" element={<IpfsUploader />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/lottery/:id" element={<LotteryStats />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
