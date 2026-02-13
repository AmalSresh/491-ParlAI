import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import Sidebar from "./components/Sidebar";

function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Router>
          <Routes>
            <Route path="/" element={<Homepage />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
}

export default App;
