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
      "JWT-based email/password authentication by default (tokens stored client-side).",
  },
  {
    title: "Azure Ready",
    description:
      "Pre-configured for seamless deployment to Azure Container Apps and Static Web Apps.",
  },
];

const FeatureCards: React.FC = () => {
  return (
    <div className="feature-grid" role="list">
      {features.map((feature, idx) => {
        const icons = ["🧩","🛡️","☁️"]; // modular, auth, cloud
        return (
          <article key={feature.title} className="feature-card" role="listitem">
            <div className="feature-body">
              <h3 className="feature-title"><span aria-hidden className="feature-icon">{icons[idx]}</span> {feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default FeatureCards;
