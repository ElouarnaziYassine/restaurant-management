import React, { useState, useRef, useEffect } from "react";
import "./Navbar.css";

const Navbar = ({ waiterName = "Ahmed Ben" }) => {
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef();

  const toggleMenu = () => {
    setShowMenu((prev) => !prev);
  };

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="navbar">
      <div className="navbar-title">🍽️ Restro POS</div>

      <div className="navbar-user" onClick={toggleMenu} ref={dropdownRef}>
        <span>{waiterName}</span>
        <img
          src="https://i.pravatar.cc/40"
          alt="Waiter Avatar"
          className="navbar-avatar"
        />
        {showMenu && (
          <div className="navbar-dropdown">
            <div className="dropdown-item">⚙️ Settings</div>
            <div className="dropdown-item">🚪 Logout</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
