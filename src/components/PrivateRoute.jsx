// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    alert("로그인이 필요합니다.");
    return <Navigate to="/" />;
  }

  return children;
};

export default PrivateRoute;