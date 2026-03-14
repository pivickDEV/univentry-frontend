import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const userStr = localStorage.getItem("userInfo");

  // If the user is ALREADY logged in, they cannot view the Login/Home page.
  if (userStr) {
    const user = JSON.parse(userStr);

    // Redirect them to their designated RBAC dashboard
    if (user.role === "admin" || user.role === "super-admin") {
      return <Navigate to="/admin" replace />;
    } else if (user.role === "guard") {
      return <Navigate to="/guard" replace />;
    } else if (user.role === "office") {
      return <Navigate to="/office" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // If NOT logged in, allow them to see the Login page
  return <Outlet />;
};

export default PublicRoute;
