/* eslint-disable */
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Menu,
  PieChart,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// 1. Define Interface
interface UserData {
  name: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 2. Initialize State
  const [user, setUser] = useState<UserData>({
    name: "Loading...",
    email: "...",
    role: "...",
    firstName: "",
    lastName: "",
  });
  // 3. Load Data (Fixed: Reads directly from local storage to prevent 404 API errors)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("userInfo");
      if (userStr) {
        // Parse the stored string and pass it to your function
        parseUserData(JSON.parse(userStr));
      }
    } catch (e) {
      console.error("Error parsing user data from local storage:", e);
    }
  }, []);

  const parseUserData = (data: any) => {
    const fullName =
      data.name || data.firstName + " " + data.lastName || "Admin User";
    const nameParts = fullName.split(" ");
    const first = nameParts[0] || "Admin";
    const last = nameParts.slice(1).join(" ") || "User";

    setUser({
      name: fullName,
      email: data.email || "admin@rtu.edu.ph",
      role: data.role || "Administrator",
      firstName: first,
      lastName: last,
    });
  };

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const menuItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/users", label: "User Management", icon: Users },
    { path: "/admin/audit-trail", label: "Audit Trail", icon: FileText },
    { path: "/admin/reports", label: "Reports & Analytics", icon: PieChart },
    { path: "/admin/offices", label: "Office Management", icon: Lock },
    {
      path: "/admin/cctv-monitor",
      label: "CCTV Monitoring",
      icon: ShieldCheck,
    },
  ];

  return (
    <>
      {/* --------------------------- */}
      {/* MOBILE HEADER (Visible < LG) */}
      {/* --------------------------- */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#0038A8] text-white border-b border-blue-800 h-16 px-6 flex items-center justify-between z-60 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-1.5 rounded-lg text-[#FFD700]">
            <ShieldCheck size={20} />
          </div>
          <h1 className="font-black text-white uppercase tracking-wider text-lg">
            UniVentry
          </h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-white/10 rounded-xl text-white active:scale-95 transition-transform"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --------------------------- */}
      {/* MOBILE OVERLAY */}
      {/* --------------------------- */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-70 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* --------------------------- */}
      {/* SIDEBAR CONTAINER */}
      {/* --------------------------- */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-80 
        lg:sticky lg:top-0
        w-80 min-h-screen
        bg-[#0038A8] text-white 
        flex flex-col 
        border-r border-blue-900/50 
        transition-transform duration-300 ease-out shadow-2xl lg:shadow-none
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* === SCROLLABLE CONTENT (Branding + Profile + Menu) === */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* 1. BRANDING */}
          <div className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 bg-linear-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center text-[#0038A8] shadow-xl shadow-black/20 transform rotate-3 border border-white/50">
                <ShieldCheck className="text-2xl stroke-[2.5]" />
                <div className="absolute top-0 right-0 w-3 h-3 bg-[#FFD700] rounded-full border-2 border-[#0038A8] -mr-1 -mt-1"></div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none text-white">
                  Uni
                  <span className="text-[#FFD700] drop-shadow-md">Ventry</span>
                </h1>
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.25em] opacity-80">
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 mb-8 mt-2">
            <div className="relative bg-black/10 border border-white/10 rounded-2xl p-5 overflow-hidden group hover:bg-black/20 transition-all duration-300 shadow-inner">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.5)]"></div>

              <div className="pl-3">
                <span className="text-[8px] font-bold text-blue-300 uppercase tracking-[0.2em] mb-1.5 block">
                  Active Session
                </span>

                <p
                  className="text-[15px] font-black uppercase text-white truncate w-full tracking-wide leading-none mb-1.5"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  {user.firstName} {user.lastName}
                </p>

                <div className="flex items-center gap-1.5 text-blue-200/70 mb-4">
                  <Mail size={10} className="shrink-0" />
                  <p
                    className="text-[10px] font-medium truncate tracking-wide"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0038A8] border border-blue-400/30 shadow-md">
                    <BadgeCheck size={10} className="text-[#FFD700]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <nav className="px-4 space-y-2 pb-6">
            <p className="px-4 text-[10px] font-black text-blue-300/50 uppercase tracking-[0.3em] mb-2">
              Management
            </p>

            {menuItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;

              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group overflow-hidden
                      ${isActive ? "text-white" : "text-blue-200/70 hover:text-white"}`}
                >
                  {/* Active Background Animation */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabAdmin"
                      className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent border-l-4 border-[#FFD700]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}

                  <Icon
                    size={22}
                    className={`relative z-10 transition-transform duration-300 
                      ${isActive ? "text-[#FFD700] scale-110 drop-shadow-md" : "group-hover:scale-110 group-hover:text-white"}`}
                  />

                  <span
                    className={`relative z-10 text-sm tracking-wide ${isActive ? "font-black" : "font-medium"}`}
                  >
                    {label}
                  </span>

                  {isActive && (
                    <ChevronRight className="ml-auto relative z-10 text-[#FFD700] w-4 h-4 animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* === BOTTOM SECTION (Pinned) === */}
        <div className="p-6 border-t border-white/10 bg-[#002b82]">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="group relative w-full flex items-center justify-between p-1 pl-1 pr-4 rounded-3xl cursor-pointer bg-black/20 border border-white/5 text-blue-200 hover:bg-red-600 hover:border-red-500 hover:text-white transition-all duration-300 shadow-inner"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 transition-all duration-300">
                <LogOut size={20} className="translate-x-0.5" />
              </div>
              <div className="text-left">
                <span className="block text-[11px] font-black uppercase tracking-wider text-white group-hover:text-white">
                  End Session
                </span>
                <span className="block text-[10px] font-medium opacity-50 group-hover:text-red-100">
                  Log Out
                </span>
              </div>
            </div>

            <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover:bg-white transition-colors animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
          </button>

          {/* Footer Info */}
          <div className="mt-6 flex justify-between items-center px-2 opacity-30 hover:opacity-100 transition-opacity cursor-default">
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              UniVentry OS
            </span>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------- */}
      {/* 🔥 CUSTOM LOGOUT MODAL 🔥 */}
      {/* ------------------------------------------- */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="fixed inset-0 z-110 flex items-center justify-center px-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden"
              >
                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
                  <LogOut size={28} className="text-red-600" />
                </div>

                {/* Title */}
                <h2 className="text-xl font-black text-gray-800 mb-2">
                  Are you sure?
                </h2>

                {/* Message */}
                <p className="text-sm text-gray-500 mb-8">
                  Do you really want to log out? Your current session will be
                  ended.
                </p>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmLogout}
                    className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-500/30 transition cursor-pointer"
                  >
                    Yes, Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminSidebar;
