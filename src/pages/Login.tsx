"use client";

import axios from "axios";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import React, { useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiArrowRight,
  FiCpu,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 🔥 NEW: Password Toggle
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
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 font-sans relative overflow-hidden bg-slate-950 selection:bg-[#FFD700]/30 selection:text-[#0038A8]">
      {/* 1. BACKGROUND LAYER */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay"
        style={{ backgroundImage: "url('/BGLogin.png')" }}
      />

      {/* 2. IoT GRID & OVERLAY */}
      <div className="absolute inset-0 z-0 bg-linear-to-br from-[#001d54]/95 via-[#000b21]/95 to-slate-950/95 backdrop-blur-[2px]">
        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0038A811_1px,transparent_1px),linear-gradient(to_bottom,#0038A811_1px,transparent_1px)] bg-size-4rem_4rem"></div>
      </div>

      {/* 3. MAIN CARD */}
      <motion.div
        variants={containerVars}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-6xl bg-white rounded-[2.5rem] lg:rounded-[3rem] shadow-[0_0_80px_rgba(0,56,168,0.3)] overflow-hidden flex flex-col md:flex-row min-h-160 lg:min-h-184"
      >
        {/* === LEFT SIDE: HIGH-TECH BRANDING === */}
        <div className="md:w-5/12 relative overflow-hidden bg-linear-to-b from-[#0038A8] to-[#001d54] p-10 lg:p-16 text-white flex flex-col justify-between">
          {/* Abstract Geometry */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFD700] opacity-[0.04] rounded-full -mr-40 -mt-40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-[0.04] rounded-full -ml-20 -mb-20 blur-2xl" />

          {/* Top Logo */}
          <motion.div variants={itemVars} className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="relative w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                <FiCpu className="text-2xl text-[#FFD700]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FFD700] rounded-full animate-ping" />
              </div>
              <div>
                <span className="block text-2xl font-black tracking-tighter uppercase leading-none">
                  UniVentry
                </span>
                <span className="block text-[8px] font-bold text-blue-200 uppercase tracking-[0.3em] mt-1">
                  Core System
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-[3.25rem] font-black leading-[1.1] mb-6 tracking-tight">
              RTU <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#FFD700] to-amber-300 drop-shadow-sm">
                Smart Campus
              </span>
              <br />
              Portal
            </h1>
            <p className="text-blue-100/70 font-medium text-sm lg:text-base leading-relaxed max-w-sm">
              Authorized access required. Connected to the Central IoT
              Surveillance and Visitor Management Grid.
            </p>
          </motion.div>

          {/* Bottom Status */}
          <motion.div
            variants={itemVars}
            className="relative z-10 pt-8 border-t border-white/10 mt-12"
          >
            <div className="flex items-center gap-4 bg-black/20 w-max px-4 py-2.5 rounded-2xl border border-white/5 backdrop-blur-md">
              <div className="relative flex items-center justify-center w-3 h-3">
                <div className="absolute w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75" />
                <div className="relative w-2 h-2 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                Secure Uplink Active
              </span>
            </div>
          </motion.div>
        </div>

        {/* === RIGHT SIDE: FORM CONSOLE === */}
        <div className="flex-1 p-8 md:p-12 lg:p-20 flex flex-col justify-center bg-white relative">
          {/* 🔥 NEW: FLOATING BACK TO HOME BUTTON */}
          <button
            onClick={() => navigate("/")}
            type="button"
            className="absolute top-6 right-6 lg:top-8 lg:right-8 flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:bg-blue-50 hover:text-[#0038A8] transition-all group z-20"
          >
            <FiArrowLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
              Public Portal
            </span>
          </button>

          {/* Subtle Watermark */}
          <div className="absolute bottom-10 right-10 opacity-[0.02] pointer-events-none">
            <FiShield className="w-64 h-64 text-[#0038A8]" />
          </div>

          <div className="max-w-md mx-auto w-full relative z-10">
            <motion.div variants={itemVars} className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-[#0038A8] rounded-lg mb-4">
                <FiLock size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Authentication
                </span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-2 tracking-tight">
                System Login
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
                    <div className="p-1.5 bg-white rounded-lg text-red-500 shadow-sm shrink-0">
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
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors">
                    <FiMail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#0038A8]/10 focus:border-[#0038A8] focus:bg-white outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300"
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
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors">
                    <FiLock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#0038A8]/10 focus:border-[#0038A8] focus:bg-white outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0038A8] transition-colors p-1"
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
                className="group w-full bg-[#0038A8] text-white py-4 lg:py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-900/20 hover:bg-[#002b82] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
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
                <span className="text-[#0038A8] bg-blue-50 px-2 py-1 rounded cursor-pointer hover:bg-blue-100 transition-colors">
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
