/* eslint-disable */
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Mail,
  Maximize,
  Menu,
  Shield,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// 1. Define Interface
interface UserProfile {
  name: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

const GuardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 2. Initialize State
  const [user, setUser] = useState<UserProfile>({
    name: "Loading...",
    email: "...",
    role: "...",
    firstName: "",
    lastName: "",
  });

  // 3. Load Data from LocalStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("userInfo");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        const fullName =
          parsed.name ||
          parsed.firstName + " " + parsed.lastName ||
          "Security Officer";

        const nameParts = fullName.split(" ");
        const first = nameParts[0] || "Security";
        const last = nameParts.slice(1).join(" ") || "Officer";

        setUser({
          name: fullName,
          email: parsed.email || "gate@rtu.edu.ph",
          role: parsed.role || "Guard",
          firstName: first,
          lastName: last,
        });
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  // --- GUARD SPECIFIC MENU ITEMS ---
  const menuItems = [
    { path: "/guard", label: "Gate Command", icon: LayoutDashboard },
    { path: "/guard/scanner", label: "Gate Scanner", icon: Maximize },
    { path: "/guard/manual-entry", label: "Walk-in Log", icon: UserPlus },
    { path: "/guard/active-log", label: "Live Watchlist", icon: Activity },
  ];

  return (
    <>
      {/* --------------------------- */}
      {/* MOBILE HEADER (Visible < LG) */}
      {/* --------------------------- */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#0038A8] text-white border-b border-[#002b82] h-20 px-6 flex items-center justify-between z-[60] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl text-[#FFD700] shadow-inner border border-white/20">
            <Shield size={24} />
          </div>
          <h1 className="font-black text-white uppercase tracking-[0.2em] text-xl leading-none">
            Uni<span className="text-[#FFD700]">Ventry</span>
          </h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-white/10 border border-white/20 rounded-2xl text-white active:scale-95 transition-all hover:bg-white/20"
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
            className="fixed inset-0 bg-[#001233]/40 backdrop-blur-md z-[70] lg:hidden"
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
        bg-[#f5f9ff] text-[#0038A8] 
        flex flex-col 
        border-r border-[#0038A8]/10
        transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) shadow-[20px_0_80px_rgba(0,56,168,0.05)] lg:shadow-none
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Blueprint Tech Grid Background (RTU Light Blue Tint) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0038A805_1px,transparent_1px),linear-gradient(to_bottom,#0038A805_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#e6f0ff] to-transparent pointer-events-none" />

        {/* === SCROLLABLE CONTENT === */}
        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10">
          {/* 1. BRANDING */}
          <div className="p-8 pb-6">
            <div className="flex items-center gap-4 group">
              <div className="relative w-14 h-14 bg-[#0038A8] rounded-[1.25rem] flex items-center justify-center text-[#FFD700] shadow-[0_10px_30px_rgba(0,56,168,0.3)] border-2 border-white group-hover:rotate-12 transition-transform duration-500">
                <Shield className="text-3xl stroke-[2]" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFD700] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <Zap size={8} className="text-[#0038A8] fill-current" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-[0.9] text-[#0038A8]">
                  Uni
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] to-amber-500 drop-shadow-sm">
                    Ventry
                  </span>
                </h1>
                <span className="text-[9px] font-black text-[#0038A8]/60 uppercase tracking-[0.3em] mt-1 block">
                  Security Terminal
                </span>
              </div>
            </div>
          </div>

          {/* 2. USER PROFILE HUD (RTU Light Mode) */}
          <div className="px-6 mb-8 mt-2">
            <div className="relative bg-white border border-[#0038A8]/10 rounded-[2rem] p-5 overflow-hidden group hover:shadow-[0_15px_40px_rgba(0,56,168,0.08)] transition-all duration-500 shadow-[0_5px_20px_rgba(0,56,168,0.04)]">
              {/* Left Gold/Blue Accent Line */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 bg-gradient-to-b from-[#0038A8] via-[#FFD700] to-[#0038A8] rounded-r-full shadow-sm"></div>

              <div className="pl-3 relative z-10">
                <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  Duty Status{" "}
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </span>

                <p
                  className="text-lg font-black uppercase text-[#0038A8] truncate w-full tracking-tight leading-none mb-1"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  {user.firstName}{" "}
                  <span className="font-bold text-[#0038A8]/70">
                    {user.lastName}
                  </span>
                </p>

                <div className="flex items-center gap-2 text-slate-500 mb-5">
                  <Mail size={12} className="shrink-0 text-[#0038A8]/60" />
                  <p
                    className="text-[10px] font-bold truncate tracking-wider text-slate-500"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0038A8] shadow-[0_5px_15px_rgba(0,56,168,0.3)]">
                    <BadgeCheck size={12} className="text-[#FFD700]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                      {user.role}
                    </span>
                  </div>

                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                    On Post
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NAVIGATION MENU */}
          <nav className="px-4 space-y-2 pb-6 flex-1">
            <p className="px-6 text-[8px] font-black text-[#0038A8]/40 uppercase tracking-[0.4em] mb-4">
              Operation Modules
            </p>

            {menuItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;

              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 group overflow-hidden
                      ${isActive ? "text-white" : "text-[#0038A8]/70 hover:text-[#0038A8]"}`}
                >
                  {/* Active Background Animation (Solid Royal Blue) */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGuardBg"
                      className="absolute inset-0 bg-[#0038A8] shadow-[0_10px_20px_rgba(0,56,168,0.2)]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}

                  {/* Icon Container */}
                  <div
                    className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-white/10 text-[#FFD700]"
                        : "bg-[#0038A8]/5 border border-[#0038A8]/10 group-hover:bg-[#0038A8]/10 group-hover:scale-110 text-[#0038A8]"
                    }`}
                  >
                    <Icon size={18} className="stroke-[2.5]" />
                  </div>

                  <span
                    className={`relative z-10 text-[11px] tracking-[0.1em] uppercase ${isActive ? "font-black" : "font-bold"}`}
                  >
                    {label}
                  </span>

                  {isActive && (
                    <ChevronRight className="ml-auto relative z-10 text-[#FFD700] w-4 h-4 animate-pulse opacity-90" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* === BOTTOM SECTION (Pinned Logout) === */}
        <div className="p-6 border-t border-[#0038A8]/10 bg-[#eef4ff]/80 relative z-10 backdrop-blur-md">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="group relative w-full flex items-center justify-between p-1.5 pl-1.5 pr-5 rounded-[2rem] cursor-pointer bg-white border border-slate-200 text-[#0038A8] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-500 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[1.5rem] bg-[#f5f9ff] flex items-center justify-center text-[#0038A8]/60 group-hover:bg-red-600 group-hover:text-white group-hover:shadow-[0_10px_20px_rgba(239,68,68,0.3)] transition-all duration-500 border border-slate-100 group-hover:border-red-600">
                <LogOut size={18} className="translate-x-0.5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#0038A8] group-hover:text-red-600 transition-colors">
                  Relieve Duty
                </span>
                <span className="block text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5 text-slate-500">
                  End Shift
                </span>
              </div>
            </div>

            <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-red-500 transition-colors"></div>
          </button>

          {/* Footer Info */}
          <div className="mt-6 text-center">
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#0038A8]/40">
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
              className="fixed inset-0 bg-[#001233]/70 backdrop-blur-md z-[100]"
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
                className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.3)] p-10 text-center relative overflow-hidden border-4 border-slate-50"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-red-400" />

                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-[2rem] bg-red-50 border border-red-100 flex items-center justify-center mb-6 shadow-inner relative">
                  <div className="absolute inset-0 bg-red-500 opacity-10 blur-xl rounded-full" />
                  <AlertTriangle
                    size={32}
                    className="text-red-600 relative z-10 translate-x-1"
                  />
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black text-[#0038A8] mb-2 tracking-tighter uppercase">
                  End Shift
                </h2>

                {/* Message */}
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-10 leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to end your shift and lock the terminal?
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
                    className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_10px_30px_rgba(239,68,68,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
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

export default GuardSidebar;
