import React from "react";

const features = [
  {
    title: "Modular Structure",
    description:
      "Organized with feature modules and modern React patterns for easy maintenance and extension.",
  },
  {
    title: "Authentication",
    description:
      "Microsoft Entra External ID integration for secure, modern user authentication.",
  },
  {
    title: "Azure Ready",
    description:
      "Pre-configured for seamless deployment to Azure Container Apps and Static Web Apps.",
  },
];


const FeatureCards: React.FC = () => {
  return (
    <>
      {features.map((feature, idx) => (
        <div key={feature.title} className="feature-card">
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{["🎸","🎤","🎧"][idx]}</div>
          <h3 className="feature-title">{feature.title}</h3>
          <p className="feature-desc">{feature.description}</p>
        </div>
      ))}
    </>
  );
};

export default FeatureCards;
