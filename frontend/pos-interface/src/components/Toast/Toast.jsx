import React from "react";
import "./Toast.css";

const Toast = ({ message, visible }) => {
  return (
    <div className={`toast ${visible ? "show" : ""}`}>
      {message}
    </div>
  );
};

export default Toast;
