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

  const handleScan = async (detectedCodes: any) => {
    // 1. Prevent spam/double scans
    if (scanStatus === "processing" || isModalOpen || scanStatus === "error")
      return;

    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;

    setScanStatus("processing");

    try {
      // 2. 🔑 GET TOKEN (Required to identify the Guard)
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("Authentication Error: You are not logged in.");
        setScanStatus("error");
        return;
      }

      // 3. 🚀 SEND REQUEST WITH TOKEN
      const config = {
        headers: {
          Authorization: `Bearer ${token}`, // This tells the backend WHO you are
        },
      };

      const { data } = await axios.post(
        "http://localhost:9000/api/bookings/scan",
        {
          qrCode: rawValue,
          scanType: scanMode, // 'in' or 'out' based on your button selection
        },
        config, // <--- PASS THE CONFIG HERE
      );

      // 4. Success
      setSelectedLog(data.data);
      setScanStatus(scanMode === "in" ? "success" : "exit");
      setIsModalOpen(true);
    } catch (error: any) {
      console.error("Scan Failed:", error);
      setScanStatus("error");
      setErrorMessage(error.response?.data?.message || "Invalid QR Code");

      setTimeout(() => {
        setScanStatus("idle");
      }, 3000);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
    setScanStatus("idle");
  };

  const getThemeColor = () =>
    scanMode === "in" ? "bg-emerald-600" : "bg-yellow-500";
  const getBorderColor = () =>
    scanMode === "in" ? "border-emerald-500" : "border-yellow-500";

  return (
    <div className="flex flex-col lg:flex-row h-225 w-full bg-slate-50 overflow-hidden font-sans">
      {/* LEFT PANEL: CAMERA */}
      <div
        className={`relative w-full lg:w-1/2 h-1/2 lg:h-full bg-black flex flex-col items-center justify-start border-b-4 lg:border-r-4 lg:border-b-0 transition-all duration-500 ${getBorderColor()}`}
      >
        {/* MODE SWITCHER */}
        <div className="absolute top-6 z-30 flex gap-4 bg-slate-900/80 p-2 rounded-2xl backdrop-blur-md border border-slate-700 shadow-2xl">
          <button
            onClick={() => setScanMode("in")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all
                ${scanMode === "in" ? "bg-emerald-600 text-white shadow-lg scale-105" : "bg-transparent text-slate-400 hover:text-white"}`}
          >
            <LogIn size={16} /> Time In
          </button>
          <div className="w-px bg-slate-700 h-8 self-center"></div>
          <button
            onClick={() => setScanMode("out")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all
                ${scanMode === "out" ? "bg-yellow-500 text-slate-900 shadow-lg scale-105" : "bg-transparent text-slate-400 hover:text-white"}`}
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
            <div className="w-full h-full bg-slate-900/90 backdrop-blur-sm flex items-center justify-center text-white">
              Scanner Paused
            </div>
          )}
        </div>

        {/* Status Pill */}
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

        {/* Error Toast */}
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
              UniVentry Security Protocol{" "}
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

      {/* MODAL */}
      {isModalOpen && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-200 no-scrollbar flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`sticky top-0 z-10 px-8 py-6 border-b flex items-center justify-between backdrop-blur-xl bg-white/90
                ${scanStatus === "exit" ? "border-yellow-100 bg-yellow-50/90" : "border-emerald-100 bg-emerald-50/90"}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2
                    ${
                      scanStatus === "exit"
                        ? "bg-yellow-500 border-yellow-300 text-white"
                        : "bg-emerald-600 border-emerald-500 text-white"
                    }`}
                >
                  {scanStatus === "exit" ? (
                    <LogOut className="text-2xl" />
                  ) : (
                    <LogIn className="text-2xl" />
                  )}
                </div>
                <div>
                  <h2
                    className={`text-xl font-black uppercase tracking-tight ${scanStatus === "exit" ? "text-yellow-700" : "text-emerald-700"}`}
                  >
                    {scanStatus === "exit"
                      ? "Departure Confirmed"
                      : "Entry Approved"}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    ID: {selectedLog._id}
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

            <div className="p-6 lg:p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Personal Details
                  </h3>
                  <div className="space-y-3">
                    <DetailRow
                      label="Full Name"
                      value={`${selectedLog.lastName}, ${selectedLog.firstName}`}
                      highlight
                    />
                    <DetailRow label="Category" value={selectedLog.category} />
                    <DetailRow label="Email" value={selectedLog.email} />
                    <DetailRow label="Phone" value={selectedLog.phoneNumber} />
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Logistics
                  </h3>
                  <div className="space-y-3">
                    <DetailRow
                      label="Destination"
                      value={selectedLog.office}
                      highlight
                    />
                    <DetailRow label="Date" value={selectedLog.bookingDate} />
                    <DetailRow label="Purpose" value={selectedLog.purpose} />
                    <DetailRow
                      label="Status"
                      value={selectedLog.status}
                      customColor={
                        selectedLog.status === "Approved" ||
                        selectedLog.status === "On Campus"
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
                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div
                    className={`p-2 rounded-xl mb-1 ${scanStatus === "success" ? "bg-emerald-500 text-white shadow-lg scale-110" : "bg-white/10 text-[#FFD700]"}`}
                  >
                    <LogIn className="w-5 h-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Time In
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {selectedLog.timeIn
                      ? new Date(selectedLog.timeIn).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--:--"}
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
                        })
                      : "--:--"}
                  </p>
                </div>
                <div className="h-px w-full md:w-px md:h-12 bg-white/20" />
                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                  <div
                    className={`p-2 rounded-xl mb-1 ${scanStatus === "exit" ? "bg-yellow-500 text-white shadow-lg scale-110" : "bg-white/10 text-[#FFD700]"}`}
                  >
                    <LogOut className="w-5 h-5" />
                  </div>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                    Time Out
                  </p>
                  <p className="text-xl font-mono font-bold">
                    {selectedLog.timeOut
                      ? new Date(selectedLog.timeOut).toLocaleTimeString([], {
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
                    onClick={() => setFullscreenImage(selectedLog.idFront)}
                  >
                    <img
                      src={selectedLog.idFront}
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
                    onClick={() => setFullscreenImage(selectedLog.idBack)}
                  >
                    <img
                      src={selectedLog.idBack}
                      alt="ID Back"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-4 flex items-center justify-between z-20">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                  Action Required
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#0038A8] hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  <CheckCircle className="w-4 h-4" /> Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN */}
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

export default GateScanner;
