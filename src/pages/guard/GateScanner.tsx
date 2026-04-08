/* eslint-disable */
import { Scanner } from "@yudiel/react-qr-scanner";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  CheckCircle,
  CreditCard,
  LogIn,
  LogOut,
  MapPin,
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

const GateScanner = () => {
  // --- State ---
  const [scanMode, setScanMode] = useState<"in" | "out">("in");
  const [scanStatus, setScanStatus] = useState<
    "idle" | "processing" | "success" | "exit" | "error"
  >("idle");
  const [scanStep, setScanStep] = useState<"verify" | "complete">("verify");

  const [selectedLog, setSelectedLog] = useState<VisitorLog | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [guardName, setGuardName] = useState("Identifying...");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setGuardName(`${parsed.firstName} ${parsed.lastName}`.toUpperCase());
    } else {
      setGuardName("UNKNOWN STATION");
    }
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
      const { data } = await api.get(`/bookings/${rawValue}`);

      setSelectedLog(data);
      setScanStep("verify");
      setScanStatus("success");
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Fetch Failed:", error);
      setScanStatus("error");
      setErrorMessage(
        error.response?.status === 404
          ? "Visitor ID Not Found"
          : "Invalid QR or Connection Error",
      );
      setTimeout(() => setScanStatus("idle"), 3000);
    }
  };

  // --- 2. CONFIRM HANDLER (ACTUAL DB UPDATE) ---
  const handleConfirm = async () => {
    if (!selectedLog) return;
    setScanStatus("processing");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication Error: You are not logged in.");
        return handleCloseModal();
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const { data } = await api.post(
        "/bookings/scan",
        {
          qrCode: selectedLog._id,
          scanType: scanMode,
        },
        config,
      );

      setSelectedLog(data.data);
      setScanStep("complete");
      setScanStatus(scanMode === "in" ? "success" : "exit");
    } catch (error: any) {
      alert(error.response?.data?.message || "Action Failed");
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
    setScanStatus("idle");
    setScanStep("verify");
  };

  const getThemeColor = () =>
    scanMode === "in" ? "bg-emerald-600" : "bg-yellow-500";
  const getBorderColor = () =>
    scanMode === "in" ? "border-emerald-500" : "border-yellow-500";

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* LEFT PANEL: CAMERA */}
      <div
        className={`relative w-full lg:w-1/2 h-1/2 lg:h-full bg-black flex flex-col items-center justify-start border-b-4 lg:border-r-4 lg:border-b-0 transition-all duration-500 ${getBorderColor()}`}
      >
        <div className="absolute top-6 z-30 flex gap-4 bg-slate-900/80 p-2 rounded-2xl backdrop-blur-md border border-slate-700 shadow-2xl">
          <button
            onClick={() => setScanMode("in")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${scanMode === "in" ? "bg-emerald-600 text-white shadow-lg scale-105" : "bg-transparent text-slate-400 hover:text-white"}`}
          >
            <LogIn size={16} /> Time In
          </button>
          <div className="w-px bg-slate-700 h-8 self-center"></div>
          <button
            onClick={() => setScanMode("out")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${scanMode === "out" ? "bg-yellow-500 text-slate-900 shadow-lg scale-105" : "bg-transparent text-slate-400 hover:text-white"}`}
          >
            <LogOut size={16} /> Time Out
          </button>
        </div>

        {/* Reticle */}
        <div className="absolute inset-0 z-10 pointer-events-none p-12 lg:p-24 flex items-center justify-center mt-12">
          <div
            className={`w-full h-full border-2 rounded-3xl relative opacity-50 ${scanStatus === "error" ? "border-red-500" : scanMode === "in" ? "border-emerald-400" : "border-yellow-400"}`}
          >
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -mt-1 -ml-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white -mt-1 -mr-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -mb-1 -ml-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white -mb-1 -mr-1"></div>

            {scanStatus === "idle" && (
              <motion.div
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className={`absolute left-0 right-0 h-0.5 shadow-[0_0_15px_rgba(255,255,255,0.8)] ${scanMode === "in" ? "bg-emerald-500" : "bg-yellow-500"}`}
              />
            )}
          </div>
        </div>

        {/* Camera */}
        <div className="w-full h-full object-cover">
          {!isModalOpen && (
            <Scanner
              onScan={handleScan}
              allowMultiple={true}
              scanDelay={2000}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
          )}
          {isModalOpen && (
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-sm flex items-center justify-center text-white font-bold tracking-widest uppercase">
              Scanner Paused
            </div>
          )}
        </div>

        <div className="absolute bottom-6 z-20 bg-slate-900/90 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700 text-white flex items-center gap-3 shadow-xl">
          {scanStatus === "processing" ? (
            <Activity className="w-4 h-4 animate-spin text-[#FFD700]" />
          ) : (
            <ScanLine className="w-4 h-4 text-[#FFD700]" />
          )}
          <span className="font-mono text-xs uppercase tracking-widest">
            {scanStatus === "idle"
              ? `Ready to ${scanMode === "in" ? "Time In" : "Time Out"}`
              : scanStatus === "processing"
                ? "Processing..."
                : "Result"}
          </span>
        </div>

        <AnimatePresence>
          {scanStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-24 mx-auto bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-30 max-w-[90%]"
            >
              <AlertTriangle className="w-8 h-8" />
              <div>
                <h3 className="font-bold uppercase tracking-wider">
                  Stop: Access Denied
                </h3>
                <p className="text-sm opacity-90">{errorMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT PANEL: DASHBOARD */}
      <div className="w-full lg:w-1/2 h-1/2 lg:h-full bg-slate-50 flex flex-col p-6 lg:p-10 relative">
        <div className="flex justify-between items-start mb-6 border-b-2 border-slate-200 pb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#0038A8] uppercase tracking-tighter">
              Command Gate
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              UniVentry Security Protocol
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xl lg:text-3xl font-mono font-bold text-slate-800">
              {currentTime.toLocaleTimeString([], { hour12: false })}
            </div>
            <div
              className={`text-[10px] font-black text-white uppercase tracking-widest px-2 py-0.5 rounded inline-block mt-1 ${getThemeColor()}`}
            >
              {scanMode === "in" ? "ENTRY GATE ACTIVE" : "EXIT GATE ACTIVE"}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-40">
          <div
            className={`w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center transition-colors ${scanMode === "in" ? "text-emerald-500" : "text-yellow-500"}`}
          >
            {scanMode === "in" ? <LogIn size={64} /> : <LogOut size={64} />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-400">
              {scanMode === "in"
                ? "Entry Scanner Active"
                : "Exit Scanner Active"}
            </h2>
            <p className="text-slate-400 text-sm">
              Select mode above and scan QR code.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-200 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
              Active Officer
            </p>
            <p className="text-[#0038A8] font-bold text-sm lg:text-base truncate">
              {guardName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
              Zone Status
            </p>
            <p className="text-emerald-600 font-bold text-sm lg:text-base flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
              SECURE
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🔥 THE EXACT AUDIT TRAIL MODAL DESIGN 🔥 */}
      {/* ======================================================== */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-[2.5rem] shadow-2xl flex flex-col no-scrollbar relative border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- MODAL HEADER (Blue Header matching Audit Trail) --- */}
            <div className="bg-[#0038A8] p-8 pb-12 text-center relative shrink-0 shadow-lg">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg text-white">
                <User size={32} />
              </div>
              <h2 className="text-white font-black text-3xl uppercase tracking-tighter">
                Visitor Details
              </h2>
              <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                Registry Record: {selectedLog._id}
              </p>
              <button
                onClick={handleCloseModal}
                className="absolute top-6 right-6 p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all z-20"
              >
                <X size={20} />
              </button>
            </div>

            {/* --- 3 COLUMN INFO GRID --- */}
            <div className="p-10 -mt-8 bg-white rounded-t-[2.5rem] relative z-20 overflow-y-auto custom-scrollbar flex-1 space-y-10">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Panel 1 */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                    <User size={16} /> Subject Identity
                  </h3>
                  <DetailRow
                    label="Full Name"
                    value={`${selectedLog.lastName}, ${selectedLog.firstName}`}
                    highlight
                  />
                  <DetailRow label="Category" value={selectedLog.category} />
                  <DetailRow label="Email" value={selectedLog.email} />
                  <DetailRow label="Contact" value={selectedLog.phoneNumber} />
                </div>

                {/* Panel 2 */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                    <MapPin size={16} /> Logistics
                  </h3>
                  <DetailRow
                    label="Destination"
                    value={selectedLog.office}
                    highlight
                  />
                  <DetailRow
                    label="Booking Date"
                    value={selectedLog.bookingDate}
                  />
                  <DetailRow
                    label="Declared Purpose"
                    value={selectedLog.purpose}
                  />
                  <DetailRow
                    label="Registry Status"
                    value={selectedLog.status}
                    customColor={
                      selectedLog.status === "Approved" ||
                      selectedLog.status === "On Campus"
                        ? "text-emerald-600"
                        : "text-[#0038A8]"
                    }
                  />
                </div>

                {/* Panel 3 */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                    <ShieldCheck size={16} /> Authorized Handlers
                  </h3>
                  <DetailRow
                    label="Entry Guard"
                    value={selectedLog.timeIn}
                    highlight
                  />
                  <DetailRow
                    label="Office Staff"
                    value={
                      selectedLog.transactionTime ? "OFFICE STAFF" : undefined
                    }
                    highlight
                  />
                  <DetailRow
                    label="Exit Guard"
                    value={selectedLog.timeOut}
                    highlight
                  />
                  <DetailRow
                    label="Stay Duration"
                    value={
                      selectedLog.hours
                        ? `${selectedLog.hours.toFixed(2)} Hours`
                        : "---"
                    }
                  />
                </div>
              </div>

              {/* --- TIMESTAMPS (Dark Blue Bar) --- */}
              <div className="bg-[#0038A8] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div
                    className={`p-2 rounded-xl mb-1 ${scanStep === "complete" && scanStatus === "success" ? "bg-emerald-500 text-white shadow-lg scale-110" : "bg-white/10 text-[#FFD700]"}`}
                  >
                    <LogIn className="w-5 h-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Time In
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {scanStep === "complete" &&
                    scanMode === "in" &&
                    !selectedLog.timeIn
                      ? new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : selectedLog.timeIn
                        ? new Date(selectedLog.timeIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                  </p>
                </div>

                <div className="h-px w-full md:w-px md:h-12 bg-white/20" />

                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div className="p-2 bg-white/10 rounded-xl mb-1">
                    <Briefcase className="w-5 h-5 text-[#FFD700]" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Transaction
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {selectedLog.transactionTime
                      ? new Date(
                          selectedLog.transactionTime,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "--:--:--"}
                  </p>
                </div>

                <div className="h-px w-full md:w-px md:h-12 bg-white/20" />

                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div
                    className={`p-2 rounded-xl mb-1 ${scanStep === "complete" && scanStatus === "exit" ? "bg-yellow-500 text-slate-900 shadow-lg scale-110" : "bg-white/10 text-[#FFD700]"}`}
                  >
                    <LogOut className="w-5 h-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Time Out
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {scanStep === "complete" &&
                    scanMode === "out" &&
                    !selectedLog.timeOut
                      ? new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : selectedLog.timeOut
                        ? new Date(selectedLog.timeOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                  </p>
                </div>
              </div>

              {/* --- IMAGES SECTION --- */}
              <div className="grid md:grid-cols-2 gap-8">
                <DocumentCard
                  title="ID Credential (Front)"
                  image={selectedLog.idFront}
                  text={selectedLog.ocrFront}
                  onClick={() => setFullscreenImage(selectedLog.idFront)}
                />
                <DocumentCard
                  title="ID Credential (Back)"
                  image={selectedLog.idBack}
                  text={selectedLog.ocrBack}
                  onClick={() => setFullscreenImage(selectedLog.idBack)}
                />
              </div>
            </div>

            {/* --- ACTION FOOTER --- */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-6 flex items-center justify-between z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                {scanStep === "verify"
                  ? "Confirm identity matches physical ID"
                  : "Action Complete"}
              </div>

              {scanStep === "verify" ? (
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleCloseModal}
                    className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={scanStatus === "processing"}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-4 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 ${scanMode === "in" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-yellow-500 hover:bg-yellow-600 text-slate-900"}`}
                  >
                    {scanStatus === "processing" ? (
                      <Activity className="animate-spin w-5 h-5" />
                    ) : scanMode === "in" ? (
                      <LogIn size={18} />
                    ) : (
                      <LogOut size={18} />
                    )}
                    {scanMode === "in"
                      ? "Confirm & Time In"
                      : "Confirm & Time Out"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCloseModal}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-[#0038A8] hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  <CheckCircle className="w-5 h-5" /> Next Visitor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
            onClick={() => setFullscreenImage(null)}
          >
            <img
              src={fullscreenImage}
              className="max-w-full max-h-full rounded-2xl shadow-2xl border-2 border-white/10"
            />
            <X className="absolute top-8 right-8 text-white text-3xl opacity-50 hover:opacity-100 transition-opacity" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- HELPER COMPONENTS (Required for Audit Trail Design) ---
const DetailRow = ({ label, value, highlight = false, customColor }: any) => (
  <div className="flex flex-col py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
      {label}
    </span>
    <span
      className={`text-[11px] font-black uppercase tracking-wide leading-relaxed wrap-break-word ${customColor ? customColor : highlight ? "text-[#0038A8]" : "text-slate-700"}`}
    >
      {value || "N/A / PENDING"}
    </span>
  </div>
);

const DocumentCard = ({ title, image, text, onClick }: any) => (
  <div className="space-y-4">
    <h3 className="text-[#0038A8] font-black uppercase text-[10px] flex items-center gap-2 tracking-[0.4em]">
      <CreditCard size={14} /> {title}
    </h3>
    <div
      className="relative h-56 bg-slate-100 rounded-4xl overflow-hidden border-2 border-slate-200 group cursor-pointer flex items-center justify-center shadow-sm"
      onClick={image ? onClick : undefined}
    >
      {image ? (
        <img
          src={image}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />
      ) : (
        <div className="text-slate-300 flex flex-col items-center">
          <ShieldCheck size={32} />
        </div>
      )}
    </div>
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-[9px] font-mono text-slate-500 overflow-y-auto max-h-24 custom-scrollbar leading-relaxed uppercase shadow-inner italic">
      {text || "AI Processing Data not found."}
    </div>
  </div>
);

export default GateScanner;
