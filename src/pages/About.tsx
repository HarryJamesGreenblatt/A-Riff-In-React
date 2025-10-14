import React from "react";

const About: React.FC = () => (
  <div className="max-w-3xl mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold mb-6">About</h2>

    <section className="card-grid">
      <article className="feature-card card-large">
        <h3 className="font-bold mb-2">TL;DR</h3>
  <p className="text-gray-700 content-limited">A Riff In React is a pragmatic starter for React + TypeScript apps that need Azure integration, structured feature modules, and clear patterns for authentication and data.</p>
      </article>

      <article className="feature-card card-tall">
        <h3 className="font-bold mb-2">Overview</h3>
  <p className="text-gray-700 content-limited">This template demonstrates a production-ready approach for building modern web applications with React and TypeScript. It favors a feature-based project structure, clear separation between UI, state, and services, and pre-configured integration points for Azure services (Container Apps, Static Web Apps, Azure SQL, Cosmos DB).</p>
      </article>

      <article className="feature-card card-wide">
        <h3 className="font-bold mb-2">Design Principles</h3>
        <ul className="list-disc ml-6 text-gray-600">
          <li><strong>Feature-first organization</strong> — group components, hooks, and slices by domain to keep code discoverable and maintainable.</li>
          <li><strong>Hybrid persistence</strong> — use Azure SQL for structured, relational data and Cosmos DB for flexible, high-throughput document workloads.</li>
          <li><strong>Azure-ready deployments</strong> — Bicep templates and GitHub Actions workflows are provided to deploy both API and frontend.</li>
        </ul>
      </article>

      <article className="feature-card card-large">
        <h3 className="font-bold mb-2">Key Capabilities</h3>
        <ul className="list-disc ml-6 text-gray-600">
          <li>JWT-based authentication (email/password) with tokens stored in localStorage for the default template flow.</li>
          <li>Containerized API (Express) built with Docker and intended for Azure Container Apps.</li>
          <li>RTK Query for efficient data fetching and caching.</li>
        </ul>
      </article>

      <article className="feature-card card-wide">
        <h3 className="font-bold mb-2">Where to go next</h3>
        <p className="text-gray-700">Explore the <a href="/architecture">Architecture</a> page for deployment diagrams and a deeper look at state, backend, and CI/CD. See the docs folder for full operational guidance and deployment notes.</p>
      </article>
    </section>
  </div>
);

export default About;
