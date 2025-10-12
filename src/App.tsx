
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Homepage from "./components/Homepage";
import Footer from "./components/Footer";
import About from "./pages/About";
import RegisterPage from "./pages/Register";
import Architecture from "./pages/Architecture";
import AuthTest from "./pages/AuthTest";
import "./App.css";
import PhoneCollectModal from "./components/auth/PhoneCollectModal";
import { useAppSelector } from './store/hooks'
import { useState } from 'react'
import { AuthService } from './services/auth/authService'

const App: React.FC = () => {
  const { currentUser } = useAppSelector((s:any) => s.users)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)

  const handleSavePhone = async (phone: string) => {
    if (!currentUser) return
    try {
      await AuthService.savePhoneForUser(currentUser.id, phone)
      setPhoneModalOpen(false)
      // Optionally refresh user state or dispatch an action
    } catch (err) {
      console.error('Failed to save phone', err)
      throw err
    }
  }

  // Open modal if user exists but phone is missing
  if (currentUser && !currentUser.phone && !phoneModalOpen) {
    setPhoneModalOpen(true)
  }
  return (
    <Router>
      <div className="app-container">
        <div className="app-wrapper">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/about" element={<About />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/architecture" element={<Architecture />} />
                <Route path="/auth-test" element={<AuthTest />} />
              </Routes>
              {currentUser && (
                <PhoneCollectModal open={phoneModalOpen} onClose={() => setPhoneModalOpen(false)} onSave={handleSavePhone} />
              )}
            </main>
            <Footer />
          </div>
      </div>
    </Router>
  );
};

export default App;
