import React from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom";


const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="icon">
        <Link to="/">🏠</Link>  
      </div>        
      <div className="icon">
        <Link to="/tables/new">🪑</Link>
      </div>
      <div className="icon">
        <Link to="/orders">🧺​</Link>  
    </div>
      <div className="icon">
        <Link to="/categories/new">📅</Link>
      </div>
      <div className="icon">
        <Link to="/families/new">📊</Link>  
      </div>
      <div className="icon">
        <Link to="/products/new">👥</Link>  
      </div>
    </div>
  );
};

export default Sidebar;
