/* eslint-disable */
import { Scanner } from "@yudiel/react-qr-scanner";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Briefcase,
  CheckCircle,
  Clock,
  CreditCard,
  HelpCircle,
  LogIn,
  LogOut,
  MapPin,
  Maximize,
  ScanLine,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

// --- API INSTANCE ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// --- Types ---
interface VisitorLog {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  email: string;
  phoneNumber: string;
  office: string;
  purpose: string;
  bookingDate: string;
  status: string;
  timeIn?: string | null;
  timeOut?: string | null;
  transactionTime?: string | null;
  hours?: number;
  idFront: string;
  idBack: string;
  ocrFront: string;
  ocrBack: string;
  faceEmbedding: number[];
}

const TransactionScan = () => {
  // --- State ---
  const [scanStatus, setScanStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [scanStep, setScanStep] = useState<"verify" | "complete">("verify");
  const [visitorData, setVisitorData] = useState<VisitorLog | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // --- Clock Effect ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 1. SCAN HANDLER (PREVIEW ONLY) ---
  const handleScan = async (detectedCodes: any) => {
    if (scanStatus === "processing" || isModalOpen || scanStatus === "error")
      return;

    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;

    setScanStatus("processing");

    try {
      // 🔑 GET TOKEN
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 🔥 SEND TOKEN IN GET REQUEST USING CUSTOM API INSTANCE
      const { data } = await api.get(
        `/bookings/${rawValue}`,
        config, // 👈 Add config here
      );

      setVisitorData(data);
      setScanStep("verify");
      setScanStatus("success");
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Fetch Failed:", error);
      setScanStatus("error");
      setErrorMessage("Visitor Not Found or Network Error");
      setTimeout(() => setScanStatus("idle"), 3000);
    }
  };

  // --- 2. CONFIRM HANDLER (ACTUAL TRANSACTION) ---
  const handleConfirm = async () => {
    if (!visitorData) return;

    try {
      // 🔑 GET TOKEN
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // 🔥 SEND TOKEN IN POST REQUEST USING CUSTOM API INSTANCE
      const { data } = await api.post(
        "/bookings/scan/transaction", // Ensure this route exists on your backend
        { qrCode: visitorData._id }, // Payload
        config, // 👈 Add config here
      );

      setVisitorData(data.data);
      setScanStep("complete");
    } catch (error: any) {
      alert(error.response?.data?.message || "Transaction Failed");
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVisitorData(null);
    setScanStatus("idle");
    setScanStep("verify");
  };

  // Helper for Colors
  const getModalHeaderColor = () => {
    if (scanStep === "verify") return "border-blue-100 bg-blue-50/90";
    return "border-emerald-100 bg-emerald-50/90";
  };

  return (
    <div className="flex flex-col lg:flex-row h-225 w-full bg-slate-50 overflow-hidden font-sans">
      {/* LEFT PANEL: CAMERA CONSOLE */}
      <div className="relative w-full lg:w-1/2 h-1/2 lg:h-full bg-slate-900 border-b-4 lg:border-r-4 border-[#FFD700] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"></div>

        {/* Header Overlay */}
        <div className="absolute top-6 left-6 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700] rounded-lg text-slate-900 shadow-lg">
              <ScanLine size={20} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase tracking-widest text-sm">
                Optical Scanner
              </h3>
              <p className="text-[#FFD700] text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                Active
              </p>
            </div>
          </div>
        </div>

        {/* Reticle */}
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-12">
          <div
            className={`w-64 h-64 border-[3px] rounded-3xl relative transition-all duration-300 ${scanStatus === "error" ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.2)]"}`}
          >
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white -mb-1 -mr-1"></div>

            {scanStatus === "idle" && (
              <motion.div
                animate={{ top: ["5%", "95%", "5%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-2 right-2 h-0.5 bg-[#FFD700] shadow-[0_0_15px_#FFD700]"
              />
            )}
          </div>
        </div>

        {/* Camera Feed */}
        <div className="w-full h-full">
          {!isModalOpen && (
            <Scanner
              onScan={handleScan}
              allowMultiple={true}
              scanDelay={2000}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
          )}
          {isModalOpen && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white gap-4">
              <CheckCircle size={48} className="text-[#FFD700]" />
              <p className="font-bold uppercase tracking-widest text-sm">
                Scanner Paused
              </p>
            </div>
          )}
        </div>

        {/* 🔥 NEW: STATUS PILL (LOADING INDICATOR) */}
        <div className="absolute bottom-6 z-20 bg-slate-900/90 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700 text-white flex items-center gap-3 shadow-xl">
          {scanStatus === "processing" ? (
            <Activity className="w-4 h-4 animate-spin text-[#FFD700]" />
          ) : (
            <ScanLine className="w-4 h-4 text-[#FFD700]" />
          )}
          <span className="font-mono text-xs uppercase tracking-widest">
            {scanStatus === "idle"
              ? "Ready to Scan Transaction"
              : scanStatus === "processing"
                ? "Verifying Data..."
                : scanStatus === "success"
                  ? "Record Found"
                  : "Scan Error"}
          </span>
        </div>

        {/* Status Toast (Error) */}
        <AnimatePresence>
          {scanStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-20 z-30 bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-[90%]"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-black uppercase text-xs tracking-widest">
                  Transaction Error
                </h3>
                <p className="text-xs font-medium opacity-90">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT PANEL: INFO & STATUS */}
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-slate-50 flex flex-col p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0038A8]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter italic">
              Transaction Scan
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
              Office Validation Terminal
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono font-bold text-slate-800">
              {currentTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <p className="text-[10px] font-black text-[#0038A8] uppercase tracking-widest bg-[#0038A8]/10 px-2 py-1 rounded inline-block mt-1">
              System Online
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 space-y-6">
          <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center shadow-sm">
            <CreditCard className="w-10 h-10 text-[#0038A8]" />
          </div>
          <div className="max-w-xs">
            <h3 className="text-lg font-bold text-slate-500 mb-2">
              Ready for Transaction
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scan visitor QR code to verify details and mark transaction
              completion.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-200 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">
              SMS Gateway
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-600">
                Pending Approval
              </span>
            </div>
          </div>
          <Activity className="text-slate-200" size={32} />
        </div>
      </div>

      {/* 🔥 DUAL-MODE MODAL 🔥 */}
      {isModalOpen && visitorData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className={`sticky top-0 z-10 px-8 py-6 border-b flex items-center justify-between backdrop-blur-xl bg-white/90 ${getModalHeaderColor()}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2
                    ${
                      scanStep === "verify"
                        ? "bg-[#0038A8] border-blue-300 text-white"
                        : "bg-emerald-600 border-emerald-500 text-white"
                    }`}
                >
                  {scanStep === "verify" ? (
                    <HelpCircle className="text-2xl" />
                  ) : (
                    <CheckCircle className="text-2xl" />
                  )}
                </div>
                <div>
                  <h2
                    className={`text-xl font-black uppercase tracking-tight ${scanStep === "verify" ? "text-[#0038A8]" : "text-emerald-700"}`}
                  >
                    {scanStep === "verify"
                      ? "Confirm Transaction?"
                      : "Transaction Complete"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {scanStep === "verify"
                      ? "Confirm identity before proceeding"
                      : `ID: ${visitorData._id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="p-6 lg:p-8 space-y-8 overflow-y-auto no-scrollbar">
              {/* 30-Min Warning */}
              {scanStep === "complete" && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 bg-red-100 rounded-full text-red-500 mt-0.5">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-red-600 uppercase tracking-wide">
                      Exit Countdown Started
                    </h4>
                    <p className="text-xs text-red-800/80 font-medium leading-relaxed mt-1">
                      The visitor has <strong>30 minutes</strong> to return to
                      the gate.
                    </p>
                  </div>
                </div>
              )}

              {/* DETAILS GRID */}
              <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Personal Details
                  </h3>
                  <div className="space-y-3">
                    <DetailRow
                      label="Full Name"
                      value={`${visitorData.lastName}, ${visitorData.firstName}`}
                      highlight
                    />
                    <DetailRow label="Category" value={visitorData.category} />
                    <DetailRow label="Email" value={visitorData.email} />
                    <DetailRow label="Phone" value={visitorData.phoneNumber} />
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Logistics
                  </h3>
                  <div className="space-y-3">
                    <DetailRow
                      label="Destination"
                      value={visitorData.office}
                      highlight
                    />
                    <DetailRow label="Date" value={visitorData.bookingDate} />
                    <DetailRow label="Purpose" value={visitorData.purpose} />
                    <DetailRow
                      label="Status"
                      value={visitorData.status}
                      customColor={
                        visitorData.status === "Approved" ||
                        visitorData.status === "On Campus"
                          ? "text-emerald-600"
                          : "text-slate-700"
                      }
                    />
                  </div>
                </div>
              </div>

              {/* TIMESTAMPS */}
              <div className="bg-[#0038A8] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {/* Time In */}
                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div className="p-2 bg-white/10 rounded-xl mb-1">
                    <LogIn className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Time In
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {visitorData.timeIn
                      ? new Date(visitorData.timeIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </p>
                </div>

                <div className="h-px w-full md:w-px md:h-12 bg-white/20" />

                {/* Office Scan */}
                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div
                    className={`p-2 rounded-xl mb-1 ${scanStep === "complete" || visitorData.transactionTime ? "bg-[#FFD700] text-[#0038A8] shadow-lg scale-110" : "bg-white/10 text-white"}`}
                  >
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Office Scan
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {scanStep === "complete" && visitorData.transactionTime
                      ? new Date(
                          visitorData.transactionTime,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : visitorData.transactionTime
                        ? new Date(
                            visitorData.transactionTime,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "PENDING"}
                  </p>
                </div>

                <div className="h-px w-full md:w-px md:h-12 bg-white/20" />

                {/* Time Out */}
                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div className="p-2 bg-white/10 rounded-xl mb-1">
                    <LogOut className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Time Out
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {visitorData.timeOut
                      ? new Date(visitorData.timeOut).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
                  </p>
                </div>
              </div>

              {/* IMAGES */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> ID Verification (Front)
                  </h3>
                  <div
                    className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer shadow-sm hover:shadow-md transition-all"
                    onClick={() => setFullscreenImage(visitorData.idFront)}
                  >
                    <img
                      src={visitorData.idFront}
                      alt="ID Front"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> ID Verification (Back)
                  </h3>
                  <div
                    className="relative h-48 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group cursor-pointer shadow-sm hover:shadow-md transition-all"
                    onClick={() => setFullscreenImage(visitorData.idBack)}
                  >
                    <img
                      src={visitorData.idBack}
                      alt="ID Back"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-4 flex items-center justify-between z-20">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                  {scanStep === "verify"
                    ? "Action Required"
                    : "Process Complete"}
                </div>

                {scanStep === "verify" ? (
                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={handleCloseModal}
                      className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-[#0038A8] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 hover:bg-blue-800"
                    >
                      <CheckCircle size={16} /> Confirm Transaction
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCloseModal}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                  >
                    <Maximize className="w-4 h-4" /> Scan Next Visitor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
          <button className="absolute top-6 right-6 text-white bg-white/10 p-4 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

const DetailRow = ({ label, value, highlight = false, customColor }: any) => (
  <div className="flex justify-start items-center gap-4 border-b border-slate-100 pb-2 last:border-0 last:pb-0">
    <span className="w-24 shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
      {label}
    </span>
    <span
      className={`text-xs font-bold truncate ${customColor ? customColor : highlight ? "text-[#0038A8]" : "text-slate-700"}`}
    >
      {value || "N/A"}
    </span>
  </div>
);

export default TransactionScan;
