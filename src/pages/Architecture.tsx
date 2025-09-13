import React from "react";

const Architecture: React.FC = () => (
  <div className="mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold mb-6">Architecture</h2>

    <section className="card-grid">
      <article className="feature-card card-large">
        <h3 className="font-bold mb-2">Overview</h3>
  <p className="text-gray-700 content-limited">A Riff In React follows a modular, feature-first architecture suitable for production apps. The frontend is built with React + TypeScript and deployed to Azure Static Web Apps, while the backend is an Express API container deployed to Azure Container Apps. The template demonstrates a hybrid persistence pattern using Azure SQL for structured data and Cosmos DB for document/real-time workloads.</p>
      </article>

      

      <article className="feature-card card-wide">
        <h3 className="font-bold mb-2">Deployment & CI/CD</h3>
        <p className="text-gray-700 mb-2">CI/CD is implemented with GitHub Actions. Two workflows handle deployment:</p>
        <ul className="list-disc ml-6 text-gray-600 mb-4">
          <li><strong>API workflow</strong> — builds Docker image, pushes to GitHub Container Registry, deploys infra with Bicep and container to Azure Container Apps.</li>
          <li><strong>Frontend workflow</strong> — builds the React app and deploys to Azure Static Web Apps using the Static Web Apps GitHub Action.</li>
        </ul>
      </article>

      <article className="feature-card card-large">
        <h3 className="font-bold mb-2">Infrastructure notes</h3>
        <p className="text-gray-700">The template uses a shared SQL Server model to reduce cost: databases are created per-project on a shared server. Role assignments are handled via Bicep modules to grant managed identities access to the DB resources during deployment.</p>
      </article>

      

      
    </section>
  </div>
);

export default Architecture;
