/* eslint-disable */
import { Outlet, useLocation } from "react-router-dom";

import AdminSidebar from "./AdminSidebar";
import GuardSidebar from "./GuardSidebar";
import OfficeSidebar from "./OfficeSidebar";

type Role = "admin" | "office" | "guard";

type User = {
  role: Role;
  name: string;
  email: string;

  [key: string]: any;
};

const getCurrentUser = (): User | null => {
  try {
    const raw = localStorage.getItem("userInfo");

    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.role) return null;
    return parsed as User;
  } catch {
    return null;
  }
};

const SIDEBAR_COMPONENTS: Record<Role, React.ElementType> = {
  admin: AdminSidebar,
  office: OfficeSidebar,
  guard: GuardSidebar,
};

const MainLayout = () => {
  const location = useLocation();
  const user = getCurrentUser();
  const isPublicRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  // 1. Handle Public Routes
  if (isPublicRoute || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  const SidebarComponent = SIDEBAR_COMPONENTS[user.role];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <div className="z-40 md:sticky md:top-0 md:h-screen">
        {SidebarComponent ? <SidebarComponent /> : null}
      </div>

      <main className="flex-1 w-full overflow-x-hidden p-4 pt-20 md:p-6 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
