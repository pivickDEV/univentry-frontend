/* eslint-disable */
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCamera,
  FiClock,
  FiLoader,
  FiMaximize2,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUserCheck,
  FiWifiOff,
  FiX,
} from "react-icons/fi";
import { useCCTV } from "../context/CCTVContext";

const CCTVMonitor = () => {
  // 🔥 Global State: Pulling logs and actions from Background Context
  const { logs, deleteLog, modelsLoaded, systemStatus } = useCCTV();

  const [cameras] = useState([
    {
      id: "CAM_1",
      name: "Main Entrance Hallway",
      wsUrl: import.meta.env.VITE_WS_CAM_1 || "ws://localhost:9999",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Filter & Sort Logic for the Sidebar
  const filteredLogs = logs
    .filter((l: any) =>
      l.visitorName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((l: any) => {
      if (!filterDate) return true;
      return l.timestamp.startsWith(filterDate);
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-y-auto lg:overflow-hidden relative">
      {/* --- TACTICAL IMAGE ZOOM OVERLAY --- */}
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-[#001233]/95 backdrop-blur-2xl p-4 cursor-zoom-out"
            onClick={() => setZoomedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="relative"
            >
              <img
                src={zoomedImage}
                className="max-w-[90vw] max-h-[85vh] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,56,168,0.4)] border-4 border-white/10 object-contain"
              />
              <button className="absolute -top-4 -right-4 bg-red-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform">
                <FiX size={24} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- COMMAND HEADER --- */}
      <div className="max-w-400 mx-auto w-full mb-6 shrink-0 flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#0038A8] text-[#FFD700] rounded-[1.8rem] shadow-2xl shadow-blue-900/30 ring-4 ring-white/50">
            <FiShield size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter italic leading-none">
              Intelligence{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
                Monitor
              </span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">
              Biometric Surveillance Matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all duration-500 ${modelsLoaded ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"}`}
          >
            {modelsLoaded ? (
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
            ) : (
              <FiLoader className="animate-spin" />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {systemStatus}
            </span>
          </div>
          <div className="bg-[#0038A8] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 flex items-center gap-2">
            <FiCamera size={14} /> 1 ACTIVE NODE
          </div>
        </div>
      </div>

      {/* --- MONITORING GRID --- */}
      <div className="max-w-400 mx-auto w-full flex-1 flex flex-col xl:flex-row gap-8 lg:overflow-hidden">
        {/* LEFT PANEL: LIVE TACTICAL FEED */}
        <div className="flex-[2.5] bg-white rounded-[2.5rem] border-2 border-slate-100 p-6 lg:p-8 flex flex-col overflow-hidden shadow-xl min-h-[450px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl border border-blue-100">
                <FiCamera size={20} />
              </div>
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                Tactical Stream: {cameras[0].name}
              </h3>
            </div>
          </div>

          <div className="flex-1 bg-slate-950 rounded-[2.2rem] overflow-hidden relative border-[6px] border-slate-50 shadow-inner group">
            <CameraNode wsUrl={cameras[0].wsUrl} name={cameras[0].name} />
          </div>
        </div>

        {/* RIGHT PANEL: DETECTION REGISTRY (WITH PERSISTENT LOGS) */}
        <div className="flex-1 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl p-6 lg:p-8 flex flex-col xl:max-w-md min-h-[500px] lg:min-h-0">
          <div className="shrink-0 mb-6 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl">
                  <FiUserCheck size={20} />
                </div>
                <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-widest">
                  Identification Logs
                </h3>
              </div>
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1.5 animate-pulse shadow-sm">
                SYNCED
              </span>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH RECENT MATCHES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:border-[#0038A8] outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2 border border-slate-100">
                  <FiCalendar className="text-slate-400" size={12} />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase text-slate-500 outline-none w-full"
                  />
                </div>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-slate-500 outline-none cursor-pointer"
                >
                  <option value="newest">Latest</option>
                  <option value="oldest">History</option>
                </select>
              </div>
            </div>
          </div>

          {/* REAL-TIME LOG FEED */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 mt-10 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                    <FiAlertCircle size={32} />
                  </div>
                  <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.3em] text-center">
                    No Active Matches Found
                  </p>
                </div>
              ) : (
                filteredLogs.map((log: any) => (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group bg-slate-50 border border-slate-100 p-4 rounded-[2rem] flex gap-4 items-center hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer"
                  >
                    {/* 🔥 TRASH BUTTON (Visible on Hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLog(log._id);
                      }}
                      className="absolute -top-2 -right-2 p-2.5 bg-red-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 z-30 shadow-red-900/20 active:scale-90"
                      title="Remove track"
                    >
                      <FiTrash2 size={14} />
                    </button>

                    {/* Screenshot Box */}
                    <div
                      className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md transition-transform group-hover:scale-105"
                      onClick={() => setZoomedImage(log.screenshotBase64)}
                    >
                      <img
                        src={log.screenshotBase64}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[#0038A8] text-[13px] uppercase truncate tracking-tight mb-1">
                        {log.visitorName}
                      </h4>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <FiCamera size={10} className="text-blue-300" />{" "}
                        {log.cameraName}
                      </p>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-[9px] font-black">
                            {log.confidence}% MATCH
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 font-mono">
                          <FiClock size={12} className="text-blue-200" />
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

// ============================================================================
// HELPER COMPONENT: JSMPEG STREAMING NODE
// ============================================================================
const CameraNode = ({ wsUrl, name }: { wsUrl: string; name: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const [status, setStatus] = useState("ESTABLISHING LINK...");

  useEffect(() => {
    if (!canvasRef.current || !(window as any).JSMpeg) return;

    // Note: Models are being detected by SurveillanceWorker.
    // This component is strictly for human viewing.
    playerRef.current = new (window as any).JSMpeg.Player(wsUrl, {
      canvas: canvasRef.current,
      autoplay: true,
      audio: false,
      onPlay: () => setStatus("LIVE"),
      onStalled: () => setStatus("BUFFERING..."),
    });

    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
  }, [wsUrl]);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#0a0f1c]">
      {/* The actual video context */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
      />

      {/* Overlay UI */}
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
        <div
          className={`w-2 h-2 rounded-full ${status === "LIVE" ? "bg-red-500 animate-pulse shadow-[0_0_10px_red]" : "bg-slate-500"}`}
        />
        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">
          {name}
        </span>
      </div>

      {/* Tactical Corners */}
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#FFD700]/30 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#FFD700]/30 rounded-bl-lg" />

      {/* Fullscreen Button */}
      <button className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-white/10 hover:bg-[#FFD700] hover:text-[#0038A8] shadow-2xl">
        <FiMaximize2 size={20} />
      </button>

      {status !== "LIVE" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <FiWifiOff size={48} className="mb-4 text-slate-700 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">
            {status}
          </span>
        </div>
      )}
    </div>
  );
};

export default CCTVMonitor;
