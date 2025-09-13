
import React from "react";
import FeatureCards from "./FeatureCards";
import { useAuth } from "../hooks/useAuth";

const Homepage: React.FC = () => {
  const { isAuthenticated, signIn } = useAuth();

  return (
    <main className="main-content">
      <h1 className="hero-title">
        Welcome to <span style={{ color: "var(--accent)" }}>A Riff In React</span>
      </h1>
      <p className="hero-desc">
        A comprehensive React template for Azure, featuring modular structure, authentication, and cloud readiness.
      </p>
      {!isAuthenticated && (
        <div className="button-group">
          <button className="btn" onClick={signIn}>Log In</button>
          <button className="btn">Register</button>
        </div>
      )}
      <div className="features">
        <FeatureCards />
      </div>
    </main>
  );
};

export default Homepage;
