import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import Footer from "./components/Footer";
import About from "./pages/About";
import RegisterPage from "./pages/Register";
import Architecture from "./pages/Architecture";
import AuthTest from "./pages/AuthTest";
import Dashboard from "./pages/Dashboard";
import { LoginForm } from "./components/auth/LoginForm";
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
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/architecture" element={<Architecture />} />
                <Route path="/auth-test" element={<AuthTest />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </main>
            <Footer />
          </div>
      </div>
    </Router>
  );
};

export default App;
