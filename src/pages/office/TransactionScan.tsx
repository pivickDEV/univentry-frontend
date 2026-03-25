/* eslint-disable */
import { Scanner } from "@yudiel/react-qr-scanner";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  ScanLine,
  ShieldCheck,
  Tag,
  User,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

const TransactionScan = () => {
  const [scanStatus, setScanStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [visitorData, setVisitorData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffInfo, setStaffInfo] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const user = localStorage.getItem("userInfo");
    if (user) setStaffInfo(JSON.parse(user));
    return () => clearInterval(timer);
  }, []);

  const handleScan = async (detectedCodes: any) => {
    if (scanStatus === "processing" || isModalOpen || scanStatus === "error")
      return;
    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;

    setScanStatus("processing");

    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 🔥 Execute Transaction Immediately
      const { data } = await api.post(
        "/bookings/scan/transaction",
        { qrCode: rawValue },
        config,
      );

      setVisitorData(data.data);
      setScanStatus("success");
      setIsModalOpen(true);
    } catch (error: any) {
      setScanStatus("error");
      setErrorMessage(
        error.response?.data?.message || "Invalid QR or Connection Error",
      );
      setTimeout(() => setScanStatus("idle"), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVisitorData(null);
    setScanStatus("idle");
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* LEFT PANEL: SCANNER */}
      <div className="relative w-full lg:w-1/2 h-1/2 lg:h-full bg-[#001233] border-b-4 lg:border-r-4 border-[#FFD700] flex flex-col items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] bg-[size:20px_20px]"></div>

        <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
          <div className="p-3 bg-[#FFD700] rounded-2xl text-slate-900 shadow-[0_0_20px_rgba(255,215,0,0.4)]">
            <ScanLine size={24} strokeWidth={3} />
          </div>
          <div>
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">
              RTU Optical Link
            </h3>
            <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-widest animate-pulse">
              Scanning for valid tokens...
            </p>
          </div>
        </div>

        <div className="relative z-10 w-72 h-72">
          <div className="absolute inset-0 border-2 border-white/10 rounded-[2.5rem]"></div>
          <Scanner
            onScan={handleScan}
            allowMultiple={true}
            scanDelay={2000}
            styles={{
              container: { borderRadius: "2.5rem", overflow: "hidden" },
            }}
          />

          {/* Corner Accents */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-[#FFD700] rounded-tl-xl"></div>
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-[#FFD700] rounded-tr-xl"></div>
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-[#FFD700] rounded-bl-xl"></div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-[#FFD700] rounded-br-xl"></div>
        </div>

        <div className="absolute bottom-10 px-8 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white flex items-center gap-3">
          {scanStatus === "processing" ? (
            <Activity className="animate-spin text-[#FFD700]" size={16} />
          ) : (
            <ShieldCheck className="text-emerald-400" size={16} />
          )}
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            {scanStatus === "processing" ? "Verifying..." : "System Ready"}
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: TERMINAL INFO */}
      <div className="w-full lg:w-1/2 p-12 flex flex-col justify-between bg-white relative">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
            Office
            <br />
            <span className="text-[#FFD700]">Terminal</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">
            Transaction Validation Unit
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 opacity-20">
          <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center border-4 border-slate-50">
            <UserCheck size={48} className="text-[#0038A8]" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-center">
            Awaiting QR input from visitor mobile device
          </p>
        </div>

        <div className="flex justify-between items-end border-t pt-8">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Authenticated Operator
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0038A8] flex items-center justify-center text-white font-black text-xs uppercase">
                {staffInfo?.name?.substring(0, 2)}
              </div>
              <span className="text-sm font-black text-[#0038A8] uppercase">
                {staffInfo?.name || "System Staff"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-800 tabular-nums">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest">
              Live Sync Enabled
            </p>
          </div>
        </div>
      </div>

      {/* 🔥 THE CREATIVE SUCCESS MODAL 🔥 */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#001233]/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-[0_0_100px_rgba(0,56,168,0.3)] overflow-hidden"
            >
              {/* Animated Top Header */}
              <div className="h-2 bg-linear-to-r from-[#0038A8] via-[#FFD700] to-[#0038A8] animate-gradient-x" />

              <div className="p-10">
                <div className="flex flex-col items-center text-center mb-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 mb-6"
                  >
                    <CheckCircle size={48} strokeWidth={3} />
                  </motion.div>
                  <h2 className="text-4xl font-black text-[#0038A8] uppercase tracking-tighter mb-2">
                    Clearance Granted
                  </h2>
                  <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-emerald-100">
                    Transaction Recorded Successfully
                  </div>
                </div>

                {/* VISITOR DATA CARD */}
                <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck size={120} />
                  </div>

                  <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#0038A8] shadow-sm border border-slate-100 font-black text-xl uppercase">
                      {visitorData?.firstName[0]}
                      {visitorData?.lastName[0]}
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Subject Name
                      </p>
                      <h3 className="text-2xl font-black text-[#0038A8] uppercase tracking-tight">
                        {visitorData?.firstName} {visitorData?.lastName}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Building2 size={12} className="text-[#FFD700]" />{" "}
                        Target Hub
                      </p>
                      <p className="text-sm font-black text-slate-700 uppercase">
                        {visitorData?.office}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="flex items-center justify-end gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Tag size={12} className="text-[#FFD700]" /> Category
                      </p>
                      <p className="text-sm font-black text-slate-700 uppercase">
                        {visitorData?.category}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <FileText size={12} className="text-[#FFD700]" />{" "}
                        Declared Purpose
                      </p>
                      <p className="text-xs font-bold text-slate-500 uppercase leading-tight">
                        {visitorData?.purpose}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="flex items-center justify-end gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        <Clock size={12} className="text-[#FFD700]" /> Validated
                        At
                      </p>
                      <p className="text-sm font-black text-[#0038A8] font-mono">
                        {new Date(
                          visitorData?.transactionTime,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={12} className="text-[#0038A8]" />
                      <span className="text-[9px] font-black text-slate-400 uppercase">
                        Authorized By:
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-[#0038A8] uppercase">
                      {staffInfo?.name || "System Admin"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="w-full mt-8 py-5 bg-[#0038A8] hover:bg-[#002b82] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
                >
                  Return to Scanner <ScanLine size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ERROR TOAST */}
      <AnimatePresence>
        {scanStatus === "error" && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4"
          >
            <AlertCircle />
            <span className="text-xs font-black uppercase tracking-widest">
              {errorMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransactionScan;
