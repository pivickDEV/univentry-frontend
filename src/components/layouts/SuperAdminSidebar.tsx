/* eslint-disable */
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardEdit,
  Cpu,
  Eye,
  EyeOff,
  FileText,
  Key,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  PieChart,
  Save,
  Settings2,
  ShieldCheck,
  Tag,
  User as UserIcon,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Activity, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// 1. Define Interface
interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

const SuperAdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Profile Update States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    "details" | "password"
  >("details");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const [user, setUser] = useState<UserProfile>({
    name: "Loading...",
    email: "...",
    role: "...",
    firstName: "",
    lastName: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  // Password Update States
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Load & Parse User Data
  const loadUserData = () => {
    try {
      const userStr = localStorage.getItem("userInfo");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        const fullName =
          parsed.name ||
          `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() ||
          "System Engineer";
        const nameParts = fullName.split(" ");

        const userData = {
          id: parsed.id || parsed._id,
          name: fullName,
          email: parsed.email || "dev@rtu.edu.ph",
          role: parsed.role || "super-admin",
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || "",
        };

        setUser(userData);
        setEditForm({ name: fullName, email: userData.email });
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Reset modal state when closed
  useEffect(() => {
    if (!showProfileModal) {
      setActiveProfileTab("details");
      setUpdateError(null);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords({ current: false, new: false, confirm: false });
    }
  }, [showProfileModal]);

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);

    try {
      const storedData = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = localStorage.getItem("token") || storedData.token;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/update-profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id || storedData._id,
            name: editForm.name,
            email: editForm.email,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      const updatedLocalStorage = {
        ...storedData,
        ...data.user,
      };

      localStorage.setItem("userInfo", JSON.stringify(updatedLocalStorage));
      loadUserData();

      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } catch (error: any) {
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setUpdateError("New passwords do not match.");
      setIsUpdating(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setUpdateError("New password must be at least 8 characters.");
      setIsUpdating(false);
      return;
    }

    try {
      const storedData = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const token = localStorage.getItem("token") || storedData.token;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id || storedData._id,
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.message || "Failed to update password");

      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } catch (error: any) {
      setUpdateError(error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // SUPER ADMIN MENU ITEMS
  const menuItems = [
    { path: "/admin/users", label: "User Management", icon: Users },
    { path: "/admin/offices", label: "Office Management", icon: Lock },
    { path: "/admin/categories", label: "Category Management", icon: Tag },
    {
      path: "/office/department-history",
      label: "Department History Logs",
      icon: ClipboardEdit,
    },
    { path: "/guard/active-log", label: "Live Watchlist", icon: Activity },
    { path: "/admin/audit-trail", label: "Audit Trail", icon: FileText },
    { path: "/admin/reports", label: "Reports & Analytics", icon: PieChart },
  ];

  return (
    <>
      {/* --------------------------- */}
      {/* MOBILE HEADER */}
      {/* --------------------------- */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#0038A8] text-white border-b border-[#002b82] h-20 px-6 flex items-center justify-between z-60 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.3)] border border-white/20 backdrop-blur-md">
            <ShieldCheck size={24} />
          </div>
          <h1 className="font-black text-white uppercase tracking-[0.2em] text-xl leading-none">
            Uni<span className="text-[#FFD700]">Ventry</span>
          </h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-white/10 border border-white/20 rounded-2xl text-white active:scale-95 transition-all hover:bg-white/20 backdrop-blur-md"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-[#001233]/70 backdrop-blur-md z-70 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* --------------------------- */}
      {/* SIDEBAR CONTAINER */}
      {/* --------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-80 lg:sticky lg:top-0 w-80 min-h-screen bg-[#0038A8] text-white flex flex-col border-r border-[#002b82] transition-transform duration-500 shadow-[20px_0_60px_rgba(0,18,51,0.3)] lg:shadow-none ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-size-[2rem_2rem] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-31.5 bg-linear-to-b from-[#FFD700]/5 to-transparent pointer-events-none blur-3xl" />

        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10">
          {/* 1. BRANDING */}
          <div className="p-8 pb-6">
            <div className="flex items-center gap-4 group">
              <div className="relative w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center text-[#FFD700] shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-white/20 group-hover:rotate-12 transition-transform duration-500">
                <Cpu className="text-3xl stroke-[2.5]" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#FFD700] rounded-full border-2 border-[#0038A8] flex items-center justify-center shadow-[0_0_10px_#FFD700]">
                  <Zap size={8} className="text-[#0038A8] fill-current" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-[0.9] text-white">
                  Uni
                  <span className="text-transparent bg-clip-text bg-linear-to-br from-[#FFD700] to-amber-300 drop-shadow-md">
                    Ventry
                  </span>
                </h1>
                <span className="text-[9px] font-black text-blue-200 uppercase tracking-[0.3em] mt-1 block">
                  Developer Console
                </span>
              </div>
            </div>
          </div>

          {/* 2. USER PROFILE HUD */}
          <div className="px-6 mb-8 mt-2">
            <div className="relative bg-white/10 border border-white/20 backdrop-blur-lg rounded-4xl p-5 overflow-hidden group hover:bg-white/15 hover:border-white/30 transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 bg-linear-to-b from-[#FFD700] via-amber-300 to-[#FFD700] rounded-r-full shadow-[0_0_15px_#FFD700]"></div>

              {/* Edit Trigger */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#FFD700] hover:text-[#0038A8] rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer z-20 shadow-sm"
                title="System Credentials"
              >
                <Settings2 size={14} />
              </button>

              <div className="pl-3 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[7px] font-black text-blue-200 uppercase tracking-[0.3em]">
                    Super Admin Node
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>

                <p
                  className="text-lg font-black uppercase text-white truncate tracking-tight leading-none mb-1 drop-shadow-sm"
                  title={`${user.firstName} ${user.lastName}`}
                >
                  {user.firstName}{" "}
                  <span className="font-bold text-blue-100">
                    {user.lastName}
                  </span>
                </p>

                <div className="flex items-center gap-2 text-blue-200 mb-4">
                  <Mail size={12} className="shrink-0 text-[#FFD700]" />
                  <p
                    className="text-[10px] font-bold truncate tracking-wider"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10 shadow-inner">
                    <BadgeCheck size={12} className="text-[#FFD700]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1.5 rounded-lg border border-emerald-400/20">
                    Root Access
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NAVIGATION MENU */}
          <nav className="px-4 space-y-2 pb-6 flex-1">
            <p className="px-6 text-[8px] font-black text-blue-300/50 uppercase tracking-[0.4em] mb-4">
              Core Modules
            </p>
            {menuItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`relative flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 group overflow-hidden ${isActive ? "text-[#0038A8]" : "text-blue-100 hover:text-white"}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabSuperAdminBg"
                      className="absolute inset-0 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] rounded-3xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <div
                    className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 ${isActive ? "bg-[#0038A8]/10 text-[#0038A8]" : "bg-white/5 border border-white/10 group-hover:bg-white/20 group-hover:scale-110 text-blue-200 group-hover:text-[#FFD700]"}`}
                  >
                    <Icon
                      size={18}
                      className="stroke-[2.5]"
                      children={undefined}
                    />
                  </div>
                  <span
                    className={`relative z-10 text-[11px] tracking-widest uppercase ${isActive ? "font-black text-[#0038A8]" : "font-bold"}`}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <ChevronRight className="ml-auto relative z-10 text-[#0038A8] w-4 h-4 animate-pulse opacity-90" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="p-6 border-t border-[#002b82] bg-[#002b82]/50 relative z-10 backdrop-blur-md">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="group relative w-full flex items-center justify-between p-1.5 pl-1.5 pr-5 rounded-4xl cursor-pointer bg-white/5 border border-white/10 text-blue-100 hover:bg-red-500 hover:border-red-400 hover:text-white transition-all duration-500 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-3xl bg-white/10 flex items-center justify-center text-blue-200 group-hover:bg-white group-hover:text-red-600 group-hover:shadow-[0_10px_20px_rgba(239,68,68,0.4)] transition-all duration-500 border border-white/10 group-hover:border-white">
                <LogOut size={18} className="translate-x-0.5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors">
                  Terminate
                </span>
                <span className="block text-[9px] font-bold opacity-60 uppercase tracking-widest mt-0.5 text-blue-200 group-hover:text-white">
                  End Session
                </span>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-blue-400/50 group-hover:bg-white transition-colors shadow-[0_0_10px_rgba(255,255,255,0)] group-hover:shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------- */}
      {/* 🔥 PROFILE UPDATE MODAL (WITH PASSWORD TABS) 🔥 */}
      {/* ------------------------------------------- */}
      <AnimatePresence>
        {showProfileModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUpdating && setShowProfileModal(false)}
              className="fixed inset-0 bg-[#001233]/90 backdrop-blur-xl z-100"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] relative overflow-hidden border-4 border-slate-50 flex flex-col max-h-[90vh]"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FFD700]" />

                {/* Header */}
                <div className="px-8 pt-10 pb-6 border-b border-slate-100 shrink-0">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-[#0038A8] mb-1 tracking-tighter uppercase">
                        System Credentials
                      </h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Manage Admin Access
                      </p>
                    </div>
                    <button
                      onClick={() => !isUpdating && setShowProfileModal(false)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Custom Tabs */}
                  <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateError(null);
                        setActiveProfileTab("details");
                      }}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${activeProfileTab === "details" ? "bg-white text-[#0038A8] shadow-sm" : "text-slate-500 hover:text-[#0038A8]"}`}
                    >
                      <UserIcon size={14} className="inline mr-2 -mt-0.5" />
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUpdateError(null);
                        setActiveProfileTab("password");
                      }}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${activeProfileTab === "password" ? "bg-white text-[#0038A8] shadow-sm" : "text-slate-500 hover:text-[#0038A8]"}`}
                    >
                      <Key size={14} className="inline mr-2 -mt-0.5" />
                      Security
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {updateError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          marginBottom: 24,
                        }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-xs font-bold"
                      >
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        {updateError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* TAB 1: DETAILS */}
                  {activeProfileTab === "details" && (
                    <motion.form
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleUpdateProfile}
                      className="space-y-6"
                    >
                      {/* Name Input */}
                      <div className="space-y-2 text-left group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#0038A8]">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors"
                            size={18}
                          />
                          <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-800 focus:border-[#0038A8] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      {/* Email Input */}
                      <div className="space-y-2 text-left group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#0038A8]">
                          Institutional Email
                        </label>
                        <div className="relative">
                          <Mail
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors"
                            size={18}
                          />
                          <input
                            type="email"
                            required
                            value={editForm.email}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-800 focus:border-[#0038A8] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className={`w-full py-4.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg cursor-pointer ${
                            updateSuccess
                              ? "bg-emerald-500 text-white shadow-emerald-500/20"
                              : "bg-[#0038A8] text-[#FFD700] hover:bg-[#002b82] shadow-[#0038A8]/20"
                          } disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {isUpdating ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : updateSuccess ? (
                            <>
                              <CheckCircle2 size={18} /> Data Synced
                            </>
                          ) : (
                            <>
                              <Save size={18} /> Update Matrix
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* TAB 2: PASSWORD */}
                  {activeProfileTab === "password" && (
                    <motion.form
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleUpdatePassword}
                      className="space-y-6"
                    >
                      {/* Current Password */}
                      <div className="space-y-2 text-left group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#0038A8]">
                          Current Passcode
                        </label>
                        <div className="relative">
                          <Key
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors"
                            size={18}
                          />
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            required
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-slate-800 focus:border-[#0038A8] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                current: !showPasswords.current,
                              })
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0038A8] p-2 transition-colors cursor-pointer"
                          >
                            {showPasswords.current ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="space-y-2 text-left group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#0038A8]">
                          New Security Key
                        </label>
                        <div className="relative">
                          <ShieldCheck
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors"
                            size={18}
                          />
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            required
                            minLength={8}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                              })
                            }
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-slate-800 focus:border-[#0038A8] focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Min 8 characters"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                new: !showPasswords.new,
                              })
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0038A8] p-2 transition-colors cursor-pointer"
                          >
                            {showPasswords.new ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2 text-left group">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#0038A8]">
                          Confirm Security Key
                        </label>
                        <div className="relative">
                          <CheckCircle2
                            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors"
                            size={18}
                          />
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            required
                            minLength={8}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 ${
                              passwordForm.confirmPassword &&
                              passwordForm.newPassword !==
                                passwordForm.confirmPassword
                                ? "border-red-300 focus:border-red-500 focus:ring-red-100 focus:bg-white"
                                : "border-slate-100 focus:border-[#0038A8] focus:ring-blue-50 focus:bg-white focus:ring-4"
                            }`}
                            placeholder="Match new key"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords({
                                ...showPasswords,
                                confirm: !showPasswords.confirm,
                              })
                            }
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0038A8] p-2 transition-colors cursor-pointer"
                          >
                            {showPasswords.confirm ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <button
                          type="submit"
                          disabled={
                            isUpdating ||
                            !passwordForm.currentPassword ||
                            !passwordForm.newPassword ||
                            passwordForm.newPassword !==
                              passwordForm.confirmPassword
                          }
                          className={`w-full py-4 md:py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg cursor-pointer active:scale-95 ${
                            updateSuccess
                              ? "bg-emerald-500 text-white shadow-emerald-500/20"
                              : "bg-[#0038A8] text-[#FFD700] hover:bg-[#002b82] shadow-[#0038A8]/20"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isUpdating ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : updateSuccess ? (
                            <>
                              <CheckCircle2 size={18} /> Key Secured
                            </>
                          ) : (
                            <>
                              <Lock size={18} /> Override Key
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ------------------------------------------- */}
      {/* LOGOUT MODAL */}
      {/* ------------------------------------------- */}
      <AnimatePresence>
        {showLogoutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutModal(false)}
              className="fixed inset-0 bg-[#001233]/80 backdrop-blur-xl z-100"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-110 flex items-center justify-center px-4"
            >
              <div className="w-full max-w-md bg-white rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.4)] p-10 text-center relative overflow-hidden border-4 border-slate-50">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />

                <div className="mx-auto w-20 h-20 rounded-3xl bg-red-50 flex items-center justify-center mb-6 border border-red-100 transform rotate-3">
                  <LogOut size={32} className="text-red-600 translate-x-1" />
                </div>

                <h2 className="text-3xl font-black text-[#0038A8] mb-2 tracking-tighter uppercase">
                  Log out
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 leading-relaxed mx-auto">
                  Are you sure you want to Log out?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest cursor-pointer transition-colors border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <LogOut size={14} /> End Session
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

export default SuperAdminSidebar;
