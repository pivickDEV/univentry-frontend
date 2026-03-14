/* eslint-disable */
"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiChevronDown,
  FiLoader,
  FiRefreshCcw,
  FiShield,
  FiTrash2,
  FiUserPlus,
  FiX,
} from "react-icons/fi";

// 🚀 VERCEL PREP: Global API Instance with Tunnel Headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

type UserRole = "admin" | "guard" | "office";

interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("office");

  // --- FETCH DATA ---
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<User[]>("/users");
      if (res.data) setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- UPDATE ROLE ---
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      setActionLoading(userId);
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user,
        ),
      );
    } catch {
      alert("Failed to update role.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- DELETE LOGIC ---
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    // 🚀 FIX 2: Prevent deletion of Administrator accounts
    if (userToDelete.role === "admin") {
      alert("Action Denied: You cannot delete an Administrator account.");
      setUserToDelete(null);
      return;
    }

    try {
      setActionLoading(userToDelete._id);
      await api.delete(`/users/${userToDelete._id}`);
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      setUserToDelete(null); // Close modal
    } catch (err) {
      alert("System could not remove user. Check permissions.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- CREATE LOGIC ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      setActionLoading("create");

      await api.post("/auth/signup", { name, email, password, role });

      setShowCreateModal(false);
      // Reset Form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("office");
      fetchUsers();
    } catch (err: any) {
      console.error("Registration Error:", err.response || err);
      // Safely extract the exact error message from the backend
      setFormError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed. Check your API route.",
      );
    } finally {
      setActionLoading(null); // This ensures the loading spinner stops no matter what!
    }
  };

  // --- HELPER ---
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return " text-[#0038A8] ";
      case "office":
        return " text-blue-600 ";
      case "guard":
        return " text-emerald-600 ";
      default:
        return "bg-slate-100 text-slate-500";
    }
  };

  return (
    <div className="h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* ================= HEADER (BRANDING) ================= */}
      <div className="max-w-400 mx-auto w-full mb-6 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 lg:p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg shadow-blue-900/20">
              <FiShield className="text-2xl lg:text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
                User{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
                  Management
                </span>
              </h1>
              <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                System Access Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="p-3.5 text-[#0038A8] bg-white rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 hover:bg-slate-50"
            >
              <FiRefreshCcw
                className={loading ? "animate-spin" : ""}
                size={18}
              />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-4 bg-[#0038A8] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#002b82] transition-all active:scale-95"
            >
              <FiUserPlus size={16} /> <span>Add Personnel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MASSIVE WHITE CONTAINER ================= */}
      <div className="max-w-400 mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-4 lg:p-8 flex flex-col overflow-hidden">
        {/* TABLE WRAPPER */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-3xl bg-slate-50 custom-scrollbar relative">
          <table className="w-full text-left border-collapse table-auto">
            <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-200">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 w-1/3">
                  Identity
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Clearance Level
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Modify Access
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse bg-white">
                    <td className="px-8 py-6">
                      <div className="h-10 w-48 bg-slate-100 rounded-xl" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-8 w-24 bg-slate-100 rounded-full" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-10 w-full bg-slate-100 rounded-xl" />
                    </td>
                    <td className="px-8 py-6">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr className="bg-white">
                  <td
                    colSpan={4}
                    className="px-8 py-24 text-center text-slate-400 font-bold text-xs uppercase tracking-widest"
                  >
                    No Authorized Personnel Found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className="group hover:bg-blue-50/50 bg-white transition-colors"
                  >
                    {/* IDENTITY */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-black text-[#0038A8] text-sm uppercase">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CLEARANCE LEVEL BADGE */}
                    <td className="px-8 py-5">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg  text-[10px] font-black uppercase tracking-widest ${getRoleBadge(user.role)}`}
                      >
                        <FiShield /> {user.role}
                      </div>
                    </td>

                    {/* MODIFY ACCESS (Dropdown) */}
                    <td className="px-8 py-5">
                      <div className="relative w-full max-w-50">
                        <select
                          value={user.role}
                          disabled={actionLoading === user._id}
                          onChange={(e) =>
                            handleUpdateRole(
                              user._id,
                              e.target.value as UserRole,
                            )
                          }
                          className="appearance-none w-full text-[10px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 outline-none focus:border-[#0038A8] focus:ring-2 focus:ring-blue-50 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <option value="office">Office Staff</option>
                          <option value="guard">Security Guard</option>
                          <option value="admin">Administrator</option>
                        </select>
                        <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </td>

                    {/* ACTIONS (Delete) */}
                    <td className="px-8 py-5 text-right">
                      <button
                        // Prevent opening the delete modal for admins
                        onClick={() => {
                          if (user.role === "admin") {
                            alert(
                              "Action Denied: You cannot delete an Administrator account.",
                            );
                            return;
                          }
                          setUserToDelete(user);
                        }}
                        disabled={actionLoading === user._id}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30 border border-transparent hover:border-red-100"
                        title="Revoke Access"
                      >
                        {actionLoading === user._id ? (
                          <FiLoader className="animate-spin text-[#0038A8]" />
                        ) : (
                          <FiTrash2 size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BEAUTIFUL DELETE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-center"
            >
              <div className="bg-red-600 p-8 pb-10 relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl text-red-600 mb-4 relative z-10">
                  <FiAlertTriangle size={40} />
                </div>
                <h2 className="text-white font-black text-2xl uppercase tracking-wide relative z-10">
                  Revoke Access
                </h2>
              </div>

              <div className="p-8 -mt-6 bg-white rounded-t-4xl relative z-20">
                <h3 className="text-2xl font-black text-slate-800 uppercase leading-none">
                  {userToDelete.name}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-6">
                  Role: {userToDelete.role}
                </p>

                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-8">
                  <p className="text-xs text-red-800 font-bold uppercase tracking-wide leading-relaxed">
                    Warning: This action is permanent. They will immediately
                    lose all access to the UniVentry system.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setUserToDelete(null)}
                    disabled={actionLoading === userToDelete._id}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteUser}
                    disabled={actionLoading === userToDelete._id}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95 flex justify-center items-center gap-2"
                  >
                    {actionLoading === userToDelete._id ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      "Erase User"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= ADD USER MODAL ================= */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-[#0038A8] p-8 pb-10 text-center relative shrink-0">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3 text-white">
                  <FiUserPlus size={32} />
                </div>
                <h2 className="text-white font-black text-2xl uppercase tracking-wide relative z-10">
                  Personnel Auth
                </h2>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">
                  Initialize New Account
                </p>

                <button
                  onClick={() => setShowCreateModal(false)}
                  className="absolute top-6 right-6 p-2 text-white/50 hover:bg-white/10 hover:text-white rounded-full transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-8 -mt-6 bg-white rounded-t-4xl relative z-20 overflow-y-auto custom-scrollbar">
                {formError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 flex items-center gap-3">
                    <FiAlertTriangle className="text-lg shrink-0" /> {formError}
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-5">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                  />
                  <Input
                    label="Institutional Email"
                    type="email"
                    value={email}
                    onChange={(e: any) => setEmail(e.target.value)}
                    placeholder="employee@rtu.edu.ph"
                  />

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">
                      Access Level
                    </label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 uppercase focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="office">Office Staff</option>
                        <option value="guard">Security Guard</option>
                        <option value="admin">Administrator</option>
                      </select>
                      <FiChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e: any) => setPassword(e.target.value)}
                      placeholder="••••••"
                    />
                    <Input
                      label="Confirm Pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e: any) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                    />
                  </div>

                  <button
                    disabled={actionLoading === "create"}
                    className="w-full py-5 bg-[#0038A8] text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#002b82] transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {actionLoading === "create" ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      <>
                        Authorize Personnel <FiCheck size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- CUSTOM INPUT COMPONENT ---
const Input = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">
      {label}
    </label>
    <input
      {...props}
      required
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 outline-none transition-all"
    />
  </div>
);

export default UserManagement;
