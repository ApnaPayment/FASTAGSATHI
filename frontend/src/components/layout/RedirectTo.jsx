import React from "react";
import { Navigate, useLocation } from "react-router-dom";

// Generic redirect helper. Optionally lowercase + strip trailing slash.
export default function RedirectTo({ to, preserveQuery = true }) {
  const { search } = useLocation();
  const target = preserveQuery && search ? `${to}${search}` : to;
  return <Navigate to={target} replace />;
}
