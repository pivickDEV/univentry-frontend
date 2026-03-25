/* eslint-disable */
"use client";

import axios from "axios";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiHash,
  FiKey,
  FiLoader,
  FiLock,
  FiMail,
  FiShield,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // Change to next/navigation if using Next.js

// --- API INSTANCE ---
const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:9000/api" : "");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // --- HANDLERS ---

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim().includes("@"))
      return setError("Provide a valid institutional email.");

    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setStep(1);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to locate account beacon.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) return setError("Protocol code must be 6 digits.");

    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/verify-reset-otp", {
        email: email.trim().toLowerCase(),
        otp: otpCode,
      });
      setStep(2);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid or expired protocol code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8)
      return setError("Security key must be at least 8 characters.");
    if (newPassword !== confirmPassword)
      return setError("Security keys do not match.");

    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        newPassword,
      });
      setStep(3);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to encrypt new key.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --- ANIMATION VARIANTS ---
  const stepVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, scale: 1.05, y: -20, transition: { duration: 0.3 } },
  };

  return (
    // 🔥 CHANGED: Clean light mode wrapper matching your exact specs!
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 font-sans relative overflow-hidden bg-slate-50 selection:bg-[#FFD700]/30 selection:text-[#0038A8]">
      {/* 1. BACKGROUND LAYER (LIGHT MODE EFFECTS) */}
      <motion.div
        animate={{ backgroundPosition: ["0px 0px", "100px 100px"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0038A808_1px,transparent_1px),linear-gradient(to_bottom,#0038A808_1px,transparent_1px)] bg-size-[4rem_4rem]"
      />
      {/* Glow Orbs (Light Mode Opacities) */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#0038A8]/10 rounded-full blur-[120px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] bg-[#FFD700]/15 rounded-full blur-[120px] pointer-events-none z-0"
      />

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center">
        {/* BRANDING HEADER */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white text-[#0038A8] text-[9px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
            <FiShield className="text-lg text-[#FFD700]" /> RTU Security Node
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0038A8] uppercase leading-none">
            Access{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
              Recovery
            </span>
          </h1>
        </div>

        {/* MAIN HUD CONTAINER (Glassmorphic Light Mode) */}
        <div className="w-full bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,56,168,0.1)] overflow-hidden flex flex-col relative text-slate-800 border border-white">
          <div className="p-8 md:p-10 flex-1 flex flex-col justify-center min-h-112.5">
            {/* ERROR HUD */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold shadow-sm">
                    <div className="p-1.5 bg-white rounded-lg text-red-500 shadow-sm shrink-0 border border-red-50">
                      <FiAlertCircle size={16} />
                    </div>
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* === STEP 0: IDENTIFY EMAIL === */}
              {step === 0 && (
                <motion.form
                  key="step0"
                  onSubmit={handleSendOTP}
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col h-full"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-blue-50 text-[#0038A8] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-blue-100 transform rotate-3">
                      <FiMail size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                      Locate Credentials
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Enter your Email
                    </p>
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                      Account Identifier
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
                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300"
                        placeholder="admin@rtu.edu.ph"
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.2)] hover:bg-[#002b82] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        "Transmit Beacon"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="w-full py-4 text-slate-400 hover:text-[#0038A8] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiArrowLeft /> Return to Login
                    </button>
                  </div>
                </motion.form>
              )}

              {/* === STEP 1: VERIFY OTP === */}
              {step === 1 && (
                <motion.form
                  key="step1"
                  onSubmit={handleVerifyOTP}
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col h-full"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-amber-100 transform -rotate-3">
                      <FiHash size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                      Protocol Sent
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed max-w-[80%] mx-auto">
                      A 6-digit verification code was transmitted to <br />{" "}
                      <span className="text-[#0038A8]">{email}</span>
                    </p>
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                      Authentication Code
                    </label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors">
                        <FiKey size={18} />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, ""))
                        }
                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-xl font-black tracking-[0.5em] text-center text-slate-800 placeholder:text-slate-300"
                        placeholder="------"
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 6}
                      className="w-full py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.2)] hover:bg-[#002b82] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        "Verify Signal"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(0)}
                      className="w-full py-4 text-slate-400 hover:text-[#0038A8] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiArrowLeft /> Use Different Email
                    </button>
                  </div>
                </motion.form>
              )}

              {/* === STEP 2: NEW PASSWORD === */}
              {step === 2 && (
                <motion.form
                  key="step2"
                  onSubmit={handleResetPassword}
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col h-full"
                >
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-[#0038A8] text-[#FFD700] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-900/20">
                      <FiLock size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                      System Override
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                      Generate a new security key
                    </p>
                  </div>

                  <div className="space-y-5 flex-1">
                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                        New Passcode
                      </label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors">
                          <FiLock size={18} />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-14 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300"
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

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                        Confirm Passcode
                      </label>
                      <div className="relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors">
                          <FiCheckCircle size={18} />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full pl-14 pr-12 py-4 bg-slate-50 border-2 rounded-[1.25rem] outline-none transition-all text-sm font-bold text-slate-800 placeholder:text-slate-300 ${confirmPassword && newPassword !== confirmPassword ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-50" : "border-slate-100 focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50"}`}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <button
                      type="submit"
                      disabled={
                        loading ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword
                      }
                      className="w-full py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.2)] hover:bg-[#002b82] transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        "Encrypt New Key"
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* === STEP 3: SUCCESS === */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col items-center justify-center h-full py-8 text-center"
                >
                  <div className="relative w-28 h-28 mx-auto mb-6">
                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-30 rounded-full animate-pulse" />
                    <div className="relative w-full h-full bg-emerald-50 rounded-full flex items-center justify-center shadow-inner border-4 border-emerald-100">
                      <FiCheckCircle className="text-5xl text-emerald-500" />
                    </div>
                  </div>

                  <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter mb-2">
                    Protocol Complete
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed mb-10 max-w-[80%] mx-auto">
                    Your security credentials have been successfully overridden
                    and encrypted in the matrix.
                  </p>

                  <button
                    onClick={() => navigate("/login")}
                    className="w-full py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.2)] hover:bg-[#002b82] transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    Return to Login Node <FiArrowRight size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} RTU UniVentry Security Command
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
