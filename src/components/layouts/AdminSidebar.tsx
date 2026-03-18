/* eslint-disable */
"use client";

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
  Zap,
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

  // 3. Load Data
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("userInfo");
      if (userStr) {
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
    navigate("/login", { replace: true });
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
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white text-slate-800 border-b border-slate-200 h-20 px-6 flex items-center justify-between z-[60] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#0038A8] p-2 rounded-xl text-[#FFD700] shadow-[0_10px_20px_rgba(0,56,168,0.2)]">
            <ShieldCheck size={24} />
          </div>
          <h1 className="font-black text-[#0038A8] uppercase tracking-[0.2em] text-xl leading-none">
            Uni<span className="text-[#FFD700]">Ventry</span>
          </h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 active:scale-95 transition-all hover:bg-slate-100"
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
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* --------------------------- */}
      {/* SIDEBAR CONTAINER */}
      {/* --------------------------- */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[80] 
        lg:sticky lg:top-0
        w-80 min-h-screen
        bg-white text-slate-800 
        flex flex-col 
        border-r border-slate-200
        transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-[20px_0_60px_rgba(0,56,168,0.05)] lg:shadow-none
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Subtle Tech Background Texture (Light Mode) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0038A805_1px,transparent_1px),linear-gradient(to_bottom,#0038A805_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

        {/* === SCROLLABLE CONTENT === */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10">
          {/* 1. BRANDING */}
          <div className="p-8 pb-6">
            <div className="flex items-center gap-4 group">
              <div className="relative w-14 h-14 bg-[#0038A8] rounded-[1.25rem] flex items-center justify-center text-[#FFD700] shadow-[0_10px_30px_rgba(0,56,168,0.3)] border-2 border-white group-hover:rotate-12 transition-transform duration-500">
                <ShieldCheck className="text-3xl stroke-[2]" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFD700] rounded-full border-2 border-white flex items-center justify-center">
                  <Zap size={8} className="text-[#0038A8] fill-current" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-[0.9] text-[#0038A8]">
                  Uni
                  <span className="text-[#FFD700] drop-shadow-sm">Ventry</span>
                </h1>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 block">
                  Admin Console
                </span>
              </div>
            </div>
          </div>

          {/* 2. USER PROFILE HUD (Light Mode) */}
          <div className="px-6 mb-8 mt-2">
            <div className="relative bg-slate-50 border border-slate-200 rounded-[2rem] p-5 overflow-hidden group hover:bg-blue-50/50 transition-all duration-500 shadow-sm">
              {/* Left Accent Line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 bg-gradient-to-b from-[#0038A8] via-[#FFD700] to-[#0038A8] rounded-r-full shadow-sm"></div>

              <div className="pl-3 relative z-10">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 block flex items-center gap-2">
                  Session Node{" "}
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                </span>

                <p
                  className="text-lg font-black uppercase text-[#0038A8] truncate w-full tracking-tight leading-none mb-1"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  {user.firstName}{" "}
                  <span className="font-medium text-slate-600">
                    {user.lastName}
                  </span>
                </p>

                <div className="flex items-center gap-2 text-slate-500 mb-5">
                  <Mail size={12} className="shrink-0 text-[#0038A8]/60" />
                  <p
                    className="text-[10px] font-bold truncate tracking-wider"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0038A8] shadow-md shadow-blue-900/20">
                    <BadgeCheck size={12} className="text-[#FFD700]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                      {user.role}
                    </span>
                  </div>

                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                    Authorized
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NAVIGATION MENU */}
          <nav className="px-4 space-y-2 pb-6 flex-1">
            <p className="px-6 text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4">
              System Modules
            </p>

            {menuItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;

              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 group overflow-hidden
                      ${isActive ? "text-[#0038A8]" : "text-slate-500 hover:text-[#0038A8]"}`}
                >
                  {/* Active Background Animation */}
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="activeTabAdminBg"
                        className="absolute inset-0 bg-blue-50/80 border-l-[4px] border-[#0038A8]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    </>
                  )}

                  {/* Icon Container */}
                  <div
                    className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 ${isActive ? "bg-[#0038A8] shadow-[0_10px_20px_rgba(0,56,168,0.2)] text-[#FFD700]" : "bg-slate-100 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-100 group-hover:scale-110 text-slate-400 group-hover:text-[#0038A8]"}`}
                  >
                    <Icon size={18} className="stroke-[2.5]" />
                  </div>

                  <span
                    className={`relative z-10 text-[11px] tracking-[0.1em] uppercase ${isActive ? "font-black" : "font-bold"}`}
                  >
                    {label}
                  </span>

                  {isActive && (
                    <ChevronRight className="ml-auto relative z-10 text-[#0038A8] w-4 h-4 animate-pulse opacity-70" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* === BOTTOM SECTION (Pinned Logout) === */}
        <div className="p-6 border-t border-slate-200 bg-slate-50/80 relative z-10 backdrop-blur-md">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="group relative w-full flex items-center justify-between p-1.5 pl-1.5 pr-5 rounded-[2rem] cursor-pointer bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-500 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-red-600 group-hover:text-white group-hover:shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all duration-500 border border-slate-200 group-hover:border-red-600">
                <LogOut size={18} className="translate-x-0.5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-700 group-hover:text-red-600 transition-colors">
                  Terminate
                </span>
                <span className="block text-[9px] font-bold opacity-50 uppercase tracking-widest mt-0.5">
                  End Session
                </span>
              </div>
            </div>

            <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-red-500 transition-colors"></div>
          </button>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">
              UniVentry OS v2.0
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
              transition={{ duration: 0.3 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-0 z-[110] flex items-center justify-center px-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-10 text-center relative overflow-hidden border border-slate-100"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-red-400" />

                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-[2rem] bg-red-50 border border-red-100 flex items-center justify-center mb-6 shadow-inner relative">
                  <div className="absolute inset-0 bg-red-500 opacity-10 blur-xl rounded-full" />
                  <LogOut
                    size={32}
                    className="text-red-500 relative z-10 translate-x-1"
                  />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tighter uppercase">
                  System Logout
                </h2>

                {/* Message */}
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to terminate your current administrative
                  session?
                </p>

                {/* Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmLogout}
                    className="flex-1 py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Confirm <LogOut size={14} className="translate-x-0.5" />
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
