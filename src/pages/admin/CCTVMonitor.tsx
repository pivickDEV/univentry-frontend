/* eslint-disable */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCamera,
  FiClock,
  FiDownload,
  FiLayers,
  FiSearch,
  FiShield,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useCCTV } from "../context/CCTVContext";

const CCTVMonitor = () => {
  const { logs, deleteLog, modelsLoaded, systemStatus } = useCCTV();

  // --- UI STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(""); // 🔥 NEW
  const [dateTo, setDateTo] = useState(""); // 🔥 NEW
  const [sortOrder, setSortOrder] = useState<"recent" | "old">("recent");

  const [logToDelete, setLogToDelete] = useState<any>(null);
  const [selectedLogDetails, setSelectedLogDetails] = useState<any>(null);

  // --- 🔥 ADVANCED RANGE FILTER & SORT LOGIC ---
  const filteredLogs = logs
    .filter((l: any) =>
      l.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((l: any) => {
      if (!l.timestamp) return false;
      const logTime = new Date(l.timestamp).getTime();

      // If Date From is set, check if log is after start of that day
      if (dateFrom) {
        const start = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (logTime < start) return false;
      }

      // If Date To is set, check if log is before end of that day
      if (dateTo) {
        const end = new Date(dateTo).setHours(23, 59, 59, 999);
        if (logTime > end) return false;
      }

      return true;
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === "recent" ? timeB - timeA : timeA - timeB;
    });

  // --- 🔥 DOWNLOAD EXPORT FUNCTION ---
  const handleExportCSV = () => {
    if (filteredLogs.length === 0)
      return alert("No logs found for current filter.");

    const headers = [
      "Visitor Name",
      "Status",
      "Confidence",
      "Camera Node",
      "Date",
      "Time",
    ];
    const rows = filteredLogs.map((l: any) => [
      l.visitorName,
      l.status,
      `${l.confidence}%`,
      l.cameraName,
      new Date(l.timestamp).toLocaleDateString(),
      new Date(l.timestamp).toLocaleTimeString(),
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `CCTV_Report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmDelete = async () => {
    if (logToDelete) {
      await deleteLog(logToDelete._id);
      setLogToDelete(null);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-y-auto lg:overflow-hidden relative">
      {/* DOSSIER MODAL & DELETE MODAL (Kept from previous version) */}
      <AnimatePresence>
        {selectedLogDetails && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLogDetails(null)}
              className="absolute inset-0 bg-[#001233]/95 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row"
            >
              <div className="lg:w-3/5 bg-slate-950 flex items-center justify-center border-r border-slate-100">
                <img
                  src={selectedLogDetails.screenshotBase64}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="lg:w-2/5 p-10 flex flex-col justify-between">
                <div>
                  <h2 className="text-4xl font-black text-[#0038A8] uppercase tracking-tighter mb-6">
                    {selectedLogDetails.visitorName}
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase">
                        Confidence
                      </span>
                      <span className="text-emerald-600 font-black">
                        {selectedLogDetails.confidence}%
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Timestamp
                      </p>
                      <p className="text-xs font-bold text-[#0038A8]">
                        {new Date(
                          selectedLogDetails.timestamp,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogDetails(null)}
                  className="w-full mt-10 py-5 bg-[#0038A8] text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl"
                >
                  Close Dossier
                </button>
              </div>
              <button
                onClick={() => setSelectedLogDetails(null)}
                className="absolute top-6 right-6 p-3 bg-slate-100 rounded-full"
              >
                <FiX />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL (Simplified for space) */}
      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogToDelete(null)}
              className="absolute inset-0 bg-[#001233]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center shadow-2xl"
            >
              <FiAlertTriangle
                size={50}
                className="text-red-500 mx-auto mb-4"
              />
              <h2 className="text-2xl font-black text-[#0038A8] uppercase mb-10">
                Delete this track?
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px]"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="max-w-[1800px] mx-auto w-full mb-6 shrink-0 flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#0038A8] text-[#FFD700] rounded-[1.8rem] shadow-2xl shadow-blue-900/30 ring-4 ring-white/50">
            <FiShield size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter italic leading-none">
              Intelligence Monitor
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
              Biometric Surveillance Matrix
            </p>
          </div>
        </div>
        <div
          className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-3 ${modelsLoaded ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"}`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            {systemStatus}
          </span>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col xl:flex-row gap-8 lg:overflow-hidden">
        {/* LEFT: LIVE FEED */}
        <div className="flex-[2.5] bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 flex flex-col overflow-hidden shadow-xl min-h-[450px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl">
                <FiCamera size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                Tactical Node Feed
              </h3>
            </div>
          </div>
          <div className="flex-1 bg-slate-950 rounded-[2.2rem] overflow-hidden relative border-[6px] border-slate-50 shadow-inner group">
            <CameraNode
              wsUrl={import.meta.env.VITE_WS_CAM_1}
              name="Main Entrance"
            />
          </div>
        </div>

        {/* RIGHT: DETECTION REGISTRY */}
        <div className="flex-1 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl p-6 lg:p-8 flex flex-col xl:max-w-md min-h-[500px] lg:min-h-0">
          <div className="shrink-0 mb-6 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0038A8]">
                Identification Logs
              </h3>
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg animate-pulse tracking-widest uppercase">
                Live Link
              </span>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div className="relative group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH IDENTITIES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:border-[#0038A8] outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              {/* 🔥 TACTICAL DATE RANGE PICKER */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                  <label className="text-[7px] font-black text-slate-400 uppercase block mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase text-[#0038A8] outline-none w-full cursor-pointer"
                  />
                </div>
                <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                  <label className="text-[7px] font-black text-slate-400 uppercase block mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase text-[#0038A8] outline-none w-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {/* Sort Picker */}
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2 border border-slate-100">
                  <FiLayers size={12} className="text-slate-400" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-transparent text-[10px] font-black uppercase text-[#0038A8] outline-none cursor-pointer w-full"
                  >
                    <option value="recent">Recent</option>
                    <option value="old">Old</option>
                  </select>
                </div>
                {/* 🔥 DOWNLOAD BUTTON */}
                <button
                  onClick={handleExportCSV}
                  className="px-6 bg-[#FFD700] text-[#0038A8] rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase shadow-lg shadow-amber-400/20 active:scale-95 transition-transform"
                >
                  <FiDownload size={14} /> Export
                </button>
              </div>
            </div>
          </div>

          {/* DETECTIONS FEED */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 mt-10 space-y-4">
                  <FiAlertCircle size={32} />
                  <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.3em]">
                    No Logs In Range
                  </p>
                </div>
              ) : (
                filteredLogs.map((log: any) => (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group bg-[#F8FAFC] border-2 border-slate-100 p-4 rounded-4xl flex gap-4 items-center hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer overflow-hidden"
                    onClick={() => setSelectedLogDetails(log)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogToDelete(log);
                      }}
                      className="absolute -top-1 -right-1 p-3 bg-red-600 text-white rounded-bl-[1.5rem] opacity-0 group-hover:opacity-100 transition-all shadow-lg z-30 active:scale-90"
                    >
                      <FiTrash2 size={14} />
                    </button>
                    <img
                      src={log.screenshotBase64}
                      className="w-18 h-18 rounded-2xl border-2 border-white shadow-md transition-transform group-hover:scale-105"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[#0038A8] text-[13px] uppercase truncate tracking-tight mb-0.5">
                        {log.visitorName}
                      </h4>
                      <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">
                        {new Date(log.timestamp).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[8px] font-black">
                          MATCH: {log.confidence}%
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 font-mono">
                          <FiClock size={10} className="text-blue-200" />
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// HELPER CAMERA NODE (Unchanged)
const CameraNode = ({ wsUrl }: { wsUrl: string; name: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current || !(window as any).JSMpeg) return;
    const player = new (window as any).JSMpeg.Player(wsUrl, {
      canvas: canvasRef.current,
      autoplay: true,
    });
    return () => {
      player.destroy();
    };
  }, [wsUrl]);
  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
};

export default CCTVMonitor;
