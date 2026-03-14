import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const userStr = localStorage.getItem("userInfo");

  // 1. If not logged in at all -> Kick to login and erase history
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);

  // 2. If logged in, but WRONG ROLE -> Kick back to their correct dashboard
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin" || user.role === "super-admin")
      return <Navigate to="/admin" replace />;
    if (user.role === "guard") return <Navigate to="/guard" replace />;
    if (user.role === "office") return <Navigate to="/office" replace />;
  }

  // 3. Authorized -> Show the page
  return <Outlet />;
};

export default ProtectedRoute;
