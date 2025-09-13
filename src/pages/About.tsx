import React from "react";

const About: React.FC = () => (
  <div className="max-w-2xl mx-auto px-4 py-8">
    <h2 className="text-3xl font-bold mb-4">About</h2>
    <p className="text-gray-700 mb-4">
      This project is a modern React template inspired by "A Fugue In Flask." It features modular structure, authentication, and Azure readiness.
    </p>
    <ul className="list-disc ml-6 text-gray-600">
      <li>Feature-based organization</li>
      <li>MSAL authentication</li>
      <li>Ready for Azure deployment</li>
    </ul>
  </div>
);

export default About;
