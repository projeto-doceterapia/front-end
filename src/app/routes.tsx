import { createBrowserRouter, Navigate } from "react-router";
import Login from "./pages/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  },
]);
