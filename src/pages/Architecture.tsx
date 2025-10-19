import React from "react";

const Architecture: React.FC = () => (
  <div className="mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold mb-6">Architecture</h2>

    <section className="card-grid">
      <article className="feature-card card-large">
        <h3 className="font-bold mb-2">Purpose</h3>
        <p className="text-gray-700 content-limited">The architecture is optimized to support the template's core features: authenticated users, a protected dashboard, event/activity capture, and notifications. It prioritizes a clear separation between UI, state, and backend services so teams can extend features safely.</p>
      </article>

      <article className="feature-card card-large">
        <h3 className="font-bold mb-2">Platform components</h3>
        <ul className="list-disc ml-6 text-gray-600">
          <li><strong>Frontend</strong>: React 18 + TypeScript, Vite, Tailwind</li>
          <li><strong>API</strong>: Express (Node 18) in a Docker container</li>
          <li><strong>Data</strong>: Azure SQL (users/profiles), Cosmos DB (activities/notifications)</li>
        </ul>
      </article>

      <article className="feature-card card-wide">
        <h3 className="font-bold mb-2">Operational notes</h3>
        <p className="text-gray-700 mb-2">Bicep templates and GitHub Actions are provided to deploy the frontend and API. The deployment pattern uses managed identities for secure resource access where applicable.</p>
      </article>

      <article className="feature-card card-wide">
        <h3 className="font-bold mb-2">Authentication model</h3>
        <p className="text-gray-700">JWT-based authentication with token issuance on login and middleware-protected API routes. This model keeps the template self-contained; you can swap in Entra/MSAL later if required.</p>
      </article>
    </section>
  </div>
);

export default Architecture;
