"use client";

import axios from "axios";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import React, { useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCpu,
  FiCrosshair,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// --- API INSTANCE ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });

      const { user, token } = res.data;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      // Save Data
      localStorage.setItem("userInfo", JSON.stringify(user));
      localStorage.setItem("token", token);

      const routes: Record<string, string> = {
        admin: "/admin",
        office: "/office",
        guard: "/guard",
        "super-admin": "/super-admin",
      };

      const targetPath = routes[user.role as string] || "/guard";
      navigate(targetPath, { replace: true });
    } catch (err: unknown) {
      console.error("Login Error:", err);
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Authentication failed. Verify credentials.",
        );
      } else {
        setError("Network error. Check connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVars: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    // 🔥 CHANGED: bg-slate-950 -> bg-slate-50
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 font-sans relative overflow-hidden bg-slate-50 selection:bg-[#FFD700]/30 selection:text-[#0038A8]">
      {/* 1. BACKGROUND LAYER (LIGHT MODE EFFECTS) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0038A808_1px,transparent_1px),linear-gradient(to_bottom,#0038A808_1px,transparent_1px)] bg-size-[4rem_4rem]"></div>
      {/* Glow Orbs */}
      <div className="absolute top-0 right-0 w-150 h-150 bg-[#0038A8]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-125 h-125 bg-[#FFD700]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* 2. MAIN CARD */}
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        // 🔥 Updated shadow for light background
        className="relative z-10 w-full max-w-6xl bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,56,168,0.15)] overflow-hidden flex flex-col md:flex-row min-h-160 lg:min-h-184 border border-white"
      >
        {/* === LEFT SIDE: INSTITUTIONAL BRANDING (Bright Blue) === */}
        <div className="md:w-5/12 relative overflow-hidden bg-linear-to-b from-[#0038A8] to-blue-800 p-10 lg:p-16 text-white flex flex-col justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[20px_20px]" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FFD700] opacity-20 rounded-full blur-[80px]" />

          {/* Top Logo */}
          <motion.div variants={itemVars} className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="relative w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <FiLock className="text-2xl text-[#FFD700]" />
              </div>
              <div>
                <span className="block text-2xl font-black tracking-tighter uppercase leading-none">
                  Uni<span className="text-[#FFD700]">Ventry</span>
                </span>
                <span className="block text-[8px] font-bold text-blue-200 uppercase tracking-[0.3em] mt-1">
                  RTU Smart Campus
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-[3.25rem] font-black leading-[1.1] mb-6 tracking-tight">
              SECURE <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FFD700] to-yellow-200">
                STAFF LOGIN
              </span>
            </h1>
            <p className="text-blue-100 font-medium text-sm lg:text-base leading-relaxed max-w-sm">
              Authorized personnel only. Access the Central IoT Surveillance and
              Visitor Management Grid.
            </p>
          </motion.div>

          {/* Bottom Status Grid */}
          <motion.div
            variants={itemVars}
            className="relative z-10 pt-8 border-t border-white/10 mt-12 grid grid-cols-2 gap-4"
          >
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-sm">
              <FiCpu className="text-[#FFD700] text-xl mb-2" />
              <p className="text-[8px] text-blue-200 uppercase tracking-widest font-black">
                Server Status
              </p>
              <p className="text-xs text-white font-bold">Online</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-sm">
              <FiCrosshair className="text-emerald-400 text-xl mb-2" />
              <p className="text-[8px] text-blue-200 uppercase tracking-widest font-black">
                Security Protocol
              </p>
              <p className="text-xs text-white font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />{" "}
                Active
              </p>
            </div>
          </motion.div>
        </div>

        {/* === RIGHT SIDE: CLEAN FORM CONSOLE === */}
        <div className="flex-1 p-8 md:p-12 lg:p-20 flex flex-col justify-center bg-white relative">
          {/* FLOATING BACK TO HOME BUTTON */}
          <button
            onClick={() => navigate("/")}
            type="button"
            className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-2 px-5 py-2.5 rounded-full text-slate-400 hover:bg-blue-50 hover:text-[#0038A8] transition-all group z-20 border border-transparent hover:border-blue-100"
          >
            <FiArrowLeft className="text-base group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
              Go back to Homepage
            </span>
          </button>

          {/* Subtle Watermark */}
          <div className="absolute bottom-10 right-10 opacity-[0.03] pointer-events-none">
            <FiShield className="w-64 h-64 text-[#0038A8]" />
          </div>

          <div className="max-w-md mx-auto w-full relative z-10">
            <motion.div variants={itemVars} className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-[#0038A8] rounded-lg mb-4 shadow-sm">
                <FiLock size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Authentication
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-[#0038A8] mb-2 tracking-tighter">
                System Access
              </h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.15em]">
                Enter your institutional credentials
              </p>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold shadow-sm">
                    <div className="p-1.5 bg-white rounded-lg text-red-500 shadow-sm shrink-0 border border-red-50">
                      <FiAlertTriangle size={16} />
                    </div>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form
              variants={itemVars}
              className="space-y-6"
              onSubmit={handleLogin}
            >
              {/* EMAIL INPUT */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Official Email
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors">
                    <FiMail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-50 focus:border-[#0038A8] outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                    placeholder="name@rtu.edu.ph"
                  />
                </div>
              </div>

              {/* PASSWORD INPUT WITH SHOW/HIDE */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                  Passcode
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors">
                    <FiLock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-50 focus:border-[#0038A8] outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0038A8] transition-colors p-1"
                  >
                    {showPassword ? (
                      <FiEyeOff size={16} />
                    ) : (
                      <FiEye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <motion.button
                variants={itemVars}
                type="submit"
                disabled={loading}
                className="group w-full bg-[#0038A8] text-white py-5 rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-900/20 hover:bg-[#002b82] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8 border border-blue-600/50"
              >
                {loading ? (
                  <FiLoader className="animate-spin text-lg text-[#FFD700]" />
                ) : (
                  <>
                    Authorize Access
                    <FiArrowRight className="text-[#FFD700] group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* FOOTER TEXT */}
            <motion.div
              variants={itemVars}
              className="mt-12 text-center pt-8 border-t border-slate-100"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                Need Credentials?
                <span className="text-[#0038A8] bg-blue-50 border border-blue-100 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors shadow-sm">
                  Contact ICT
                </span>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
