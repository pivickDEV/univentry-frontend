/* eslint-disable */
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardEdit,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Save,
  ScanLine,
  Settings2,
  ShieldCheck,
  User as UserIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

// 1. Define Interface
interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  office?: string;
}

const OfficeSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Profile Update States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const [user, setUser] = useState<UserProfile>({
    name: "Loading...",
    email: "...",
    role: "...",
    firstName: "",
    lastName: "",
    office: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
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
          "Office User";
        const nameParts = fullName.split(" ");

        const userData = {
          id: parsed.id || parsed._id,
          name: fullName,
          email: parsed.email || "No Email",
          role: parsed.role || "office",
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(" ") || "",
          office: parsed.office || "General Office",
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

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // API CALL PLACEHOLDER:
      // await axios.put(`${API_URL}/auth/update-profile`, { userId: user.id, ...editForm });

      const currentInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const updatedInfo = {
        ...currentInfo,
        name: editForm.name,
        email: editForm.email,
      };

      localStorage.setItem("userInfo", JSON.stringify(updatedInfo));
      loadUserData(); // Re-sync Sidebar UI

      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        setShowProfileModal(false);
      }, 2000);
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { path: "/office", label: "Dashboard", icon: LayoutDashboard },
    { path: "/office/transactions", label: "Office Scanner", icon: ScanLine },
    {
      path: "/office/department-history",
      label: "Department History Logs",
      icon: ClipboardEdit,
    },
  ];

  return (
    <>
      {/* --------------------------- */}
      {/* MOBILE HEADER */}
      {/* --------------------------- */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-[#0038A8] text-white border-b border-[#002b82] h-20 px-6 flex items-center justify-between z-60 shadow-2xl">
        <div className="flex items-center gap-3">
          <ShieldCheck size={24} className="text-[#FFD700]" />
          <h1 className="font-black text-white uppercase tracking-[0.2em] text-xl">
            Uni<span className="text-[#FFD700]">Ventry</span>
          </h1>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3 bg-white/10 rounded-2xl"
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

        <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative z-10">
          {/* 1. BRANDING */}
          <div className="p-8 pb-6">
            <div className="flex items-center gap-4 group">
              <div className="relative w-14 h-14 bg-white/10 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center text-[#FFD700] border border-white/20 shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <ShieldCheck size={28} className="stroke-[2.5]" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-[0.9] text-white">
                  Uni<span className="text-[#FFD700]">Ventry</span>
                </h1>
                <span className="text-[9px] font-black text-blue-200 uppercase tracking-[0.3em] mt-1 block">
                  Office Console
                </span>
              </div>
            </div>
          </div>

          {/* 2. USER PROFILE HUD (Enhanced with Office Display) */}
          <div className="px-6 mb-8 mt-2">
            <div className="relative bg-white/10 border border-white/20 backdrop-blur-lg rounded-4xl p-5 overflow-hidden group hover:bg-white/15 transition-all duration-500 shadow-xl">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 bg-[#FFD700] rounded-r-full shadow-[0_0_15px_#FFD700]"></div>

              {/* Edit Trigger */}
              <button
                onClick={() => setShowProfileModal(true)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-[#FFD700] hover:text-[#0038A8] rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer z-20"
                title="Edit Profile"
              >
                <Settings2 size={14} />
              </button>

              <div className="pl-3 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[7px] font-black text-blue-200 uppercase tracking-[0.3em]">
                    Session Active
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <p className="text-lg font-black uppercase text-white truncate tracking-tight leading-none mb-1">
                  {user.firstName}{" "}
                  <span className="font-bold text-blue-100">
                    {user.lastName}
                  </span>
                </p>

                <div className="flex items-center gap-2 text-blue-200 mb-4">
                  <Mail size={12} className="shrink-0 text-[#FFD700]" />
                  <p className="text-[10px] font-bold truncate tracking-wider">
                    {user.email}
                  </p>
                </div>

                {/* ✨ DYNAMIC OFFICE BADGE */}
                {user.role === "office" && (
                  <div className="mb-4 flex items-center gap-2 bg-[#FFD700]/10 border border-[#FFD700]/20 rounded-xl px-3 py-2">
                    <Building2 size={14} className="text-[#FFD700]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#FFD700] truncate">
                      {user.office}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 border border-white/10">
                    <BadgeCheck size={12} className="text-[#FFD700]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">
                    Authorized
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NAVIGATION MENU */}
          <nav className="px-4 space-y-2 pb-6 flex-1">
            <p className="px-6 text-[8px] font-black text-blue-300/50 uppercase tracking-[0.4em] mb-4">
              System Modules
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
                      layoutId="activeTabOfficeBg"
                      className="absolute inset-0 bg-white shadow-xl rounded-3xl"
                    />
                  )}
                  <div
                    className={`relative z-10 p-2.5 rounded-xl transition-all duration-300 ${isActive ? "bg-[#0038A8]/10 text-[#0038A8]" : "bg-white/5 border border-white/10 text-blue-200"}`}
                  >
                    <Icon size={18} className="stroke-[2.5]" />
                  </div>
                  <span
                    className={`relative z-10 text-[11px] tracking-widest uppercase ${isActive ? "font-black" : "font-bold"}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM SECTION */}
        <div className="p-6 border-t border-[#002b82] bg-[#002b82]/50 relative z-10 backdrop-blur-md">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="group relative w-full flex items-center justify-between p-1.5 pr-5 rounded-4xl cursor-pointer bg-white/5 border border-white/10 text-blue-100 hover:bg-red-500 transition-all duration-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-3xl bg-white/10 flex items-center justify-center text-blue-200 group-hover:bg-white group-hover:text-red-600 transition-all duration-500">
                <LogOut size={18} className="translate-x-0.5 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  LOG OUT
                </span>
                <span className="block text-[9px] font-bold opacity-60 uppercase tracking-widest text-blue-200 group-hover:text-white">
                  End Session
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* ------------------------------------------- */}
      {/* 🔥 PROFILE UPDATE MODAL 🔥 */}
      {/* ------------------------------------------- */}
      <AnimatePresence>
        {showProfileModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="fixed inset-0 bg-[#001233]/90 backdrop-blur-xl z-100"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-110 flex items-center justify-center px-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-10 relative overflow-hidden border-4 border-slate-50"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-[#FFD700]" />

                <h2 className="text-3xl font-black text-[#0038A8] mb-1 tracking-tighter uppercase">
                  Operator Profile
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">
                  System Credentials & Access
                </p>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Read Only Office Field */}
                  {user.role === "office" && (
                    <div className="space-y-2 text-left opacity-60">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">
                        Assigned Department
                      </label>
                      <div className="bg-slate-100 rounded-2xl py-4 px-6 flex items-center gap-3 border border-slate-200">
                        <Building2 size={16} className="text-slate-400" />
                        <span className="text-[11px] font-black uppercase text-slate-500">
                          {user.office}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[#0038A8] uppercase tracking-widest ml-4">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-[#0038A8] focus:border-[#FFD700] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black text-[#0038A8] uppercase tracking-widest ml-4">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={18}
                      />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({ ...editForm, email: e.target.value })
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-bold text-[#0038A8] focus:border-[#FFD700] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer ${updateSuccess ? "bg-emerald-500 text-white" : "bg-[#0038A8] text-white"}`}
                    >
                      {isUpdating ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : updateSuccess ? (
                        <>
                          <CheckCircle2 size={16} /> Updated
                        </>
                      ) : (
                        <>
                          <Save size={16} /> Save
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ------------------------------------------- */}
      {/* LOGOUT MODAL (Kept for completeness) */}
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
              <div className="w-full max-w-md bg-white rounded-[3rem] p-10 text-center border-4 border-slate-50">
                <div className="mx-auto w-20 h-20 rounded-4xl bg-red-50 flex items-center justify-center mb-6">
                  <LogOut size={32} className="text-red-600 translate-x-1" />
                </div>
                <h2 className="text-3xl font-black text-[#0038A8] mb-2 tracking-tighter uppercase">
                  System Logout
                </h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-10 leading-relaxed max-w-xs mx-auto">
                  Terminate current administrative session?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 py-4 rounded-2xl bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg cursor-pointer"
                  >
                    Confirm Logout
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

export default OfficeSidebar;
