
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import Footer from "./components/Footer";
import About from "./pages/About";
import Architecture from "./pages/Architecture";
import "./App.css";

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <div className="app-wrapper">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/about" element={<About />} />
                <Route path="/architecture" element={<Architecture />} />
              </Routes>
            </main>
            <Footer />
          </div>
      </div>
    </Router>
  );
};

export default App;
