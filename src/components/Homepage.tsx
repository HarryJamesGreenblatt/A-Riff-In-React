
import React from "react";
import FeatureCards from "./FeatureCards";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

const Homepage: React.FC = () => {
  const { isAuthenticated, signIn } = useAuth();

  return (
    <main className="main-content" role="main">
      <section aria-labelledby="home-hero">
        <div className="feature-section">
          <div className="feature-panel">
            <h1 id="home-hero" className="hero-title">
              <span className="project-title" data-text={"A Riff In React"}>A Riff In React</span> 
              <br/> 
              <span className="subtitle">a pragmatic, extendable React starter</span>
            </h1>
            <p className="hero-desc">
              A focused starter template demonstrating modern React patterns, secure Azure integration, and a pragmatic folder structure you can extend for real projects.
            </p>

            {!isAuthenticated && (
              <div className="button-group" role="group" aria-label="authentication">
                <button className="btn" onClick={signIn}>Log In</button>
                <Link to="/register" className="btn" style={{textDecoration:'none'}}>Register</Link>
              </div>
            )}

            <hr aria-hidden className="sep-weak" />

            <h3 className="feature-title">What this template is</h3>
            <p className="feature-desc">A concise, production-aware starter that shows how to structure features, connect to Azure SQL & Cosmos DB, and use MSAL for authentication.</p>
            <p className="feature-desc">Start at the <Link to="/about">About page</Link> or read the quick-summary in the docs to learn when to reuse this scaffold.</p>
            
          </div>

          <div className="feature-column">
            <FeatureCards />
          </div>
        </div>
      </section>

  {/* features are displayed in the feature-section above */}
    </main>
  );
};

export default Homepage;
