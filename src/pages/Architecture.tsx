import React from "react";

const Architecture: React.FC = () => (
  <div className="max-w-2xl mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold mb-4">Architecture</h2>
    <p className="text-gray-700 mb-4">
      The architecture leverages modular React components, Redux Toolkit for state management, and MSAL for authentication. It is designed for easy extension and Azure deployment.
    </p>
    <ul className="list-disc ml-6 text-gray-600">
      <li>React + TypeScript + Vite</li>
      <li>Tailwind CSS & shadcn/ui</li>
      <li>Redux Toolkit & RTK Query</li>
      <li>Azure Container Apps & Static Web Apps</li>
    </ul>
  </div>
);

export default Architecture;
