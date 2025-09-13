import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Architecture", path: "/architecture" },
    { name: "About", path: "/about" },
  ];

  return (
    <header role="banner">
      <div aria-label="brand" className="brand">A Riff In React</div>
      <nav role="navigation" aria-label="Main navigation">
        <ul className="nav-links">
          {navLinks.map((link) => (
            <li key={link.path}>
              <Link
                to={link.path}
                className={`nav-link${location.pathname === link.path ? " active" : ""}`}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
