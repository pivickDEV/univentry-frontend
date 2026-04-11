/* eslint-disable */
"use client";

import * as faceapi from "face-api.js";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
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
  const { logs, deleteLog, modelsLoaded, systemStatus, faceMatcher, addLog } =
    useCCTV();

  // --- FILTER STATES ---
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "all">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<"recent" | "old">("recent");

  // --- UI STATES ---
  const [logToDelete, setLogToDelete] = useState<any>(null);
  const [selectedLogDetails, setSelectedLogDetails] = useState<any>(null);

  // --- 🔥 BULK VISUAL REPORT DOWNLOAD LOGIC ---
  const handleDownloadBulkReport = () => {
    if (filteredLogs.length === 0) return alert("No data found in this range.");
    window.print(); // Triggers the high-end print CSS defined below
  };

  // --- FILTER & SORT LOGIC ---
  const filteredLogs = logs
    .filter((l: any) =>
      l.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((l: any) => {
      if (!l.timestamp) return false;
      const logTime = new Date(l.timestamp).getTime();

      if (dateFrom) {
        const start = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (logTime < start) return false;
      }
      if (dateTo) {
        const end = new Date(dateTo).setHours(23, 59, 59, 999);
        if (logTime > end) return false;
      }

      if (!dateFrom && !dateTo && timeRange !== "all") {
        const logDate = new Date(l.timestamp).toDateString();
        const now = new Date();
        if (timeRange === "today") return logDate === now.toDateString();
        if (timeRange === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          return logDate === yesterday.toDateString();
        }
      }
      return true;
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === "recent" ? timeB - timeA : timeA - timeB;
    });

  const handleConfirmDelete = async () => {
    if (logToDelete) {
      await deleteLog(logToDelete._id);
      setLogToDelete(null);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-y-auto lg:overflow-hidden relative print:bg-white print:p-0">
      {/* 🖨️ 🔥 HIDDEN PRINT TEMPLATE (Generates the "Picture" report with BIG IMAGES) */}
      <div className="hidden print:block w-full p-10 bg-white">
        <div className="flex justify-between items-center border-b-4 border-[#0038A8] pb-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-[#0038A8] uppercase tracking-tighter">
              UNIVENTRY SYSTEM
            </h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">
              Official Surveillance Intelligence Report
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-slate-400">
              Generation Date
            </p>
            <p className="text-sm font-bold text-[#0038A8]">
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {filteredLogs.map((log: any, index: number) => (
            <div
              key={log._id}
              className="border-2 border-slate-200 rounded-[2rem] overflow-hidden bg-white p-6 page-break-inside-avoid shadow-sm"
            >
              <div className="flex gap-8">
                {/* THE BIG PICTURE */}
                <div className="w-1/2 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-100">
                  <img
                    src={log.screenshotBase64}
                    className="w-full h-72 object-contain"
                  />
                </div>
                {/* THE DATA */}
                <div className="w-1/2 flex flex-col justify-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Index #{index + 1}
                  </span>
                  <h2 className="text-3xl font-black text-[#0038A8] uppercase mb-4">
                    {log.visitorName}
                  </h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                        Status
                      </p>
                      <p className="text-xs font-black text-[#0038A8] uppercase">
                        {log.status || "DETECTED"}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                        Confidence
                      </p>
                      <p className="text-xs font-black text-emerald-600 uppercase">
                        {log.confidence}%
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                        Camera Node
                      </p>
                      <p className="text-xs font-black text-slate-700 uppercase">
                        {log.cameraName?.split("|||")[0]}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                        Timestamp
                      </p>
                      <p className="text-xs font-black text-slate-700 uppercase">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- STANDARD UI (HIDDEN DURING PRINT) --- */}
      <AnimatePresence>
        {selectedLogDetails && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 print:hidden">
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
              className="relative bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row border-4 border-white"
            >
              <div className="lg:w-3/5 bg-slate-950 flex items-center justify-center border-r border-slate-100">
                <img
                  src={selectedLogDetails.screenshotBase64}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="lg:w-2/5 p-10 flex flex-col justify-between">
                <div>
                  <h2 className="text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none mb-6">
                    {selectedLogDetails.visitorName}
                  </h2>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase">
                        Confidence
                      </span>
                      <span className="text-emerald-600 font-black text-lg">
                        {selectedLogDetails.confidence}%
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Date/Time
                      </p>
                      <p className="text-sm font-bold text-[#0038A8]">
                        {new Date(
                          selectedLogDetails.timestamp,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogDetails(null)}
                  className="w-full mt-10 py-5 bg-[#0038A8] text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl"
                >
                  Dismiss
                </button>
              </div>
              <button
                onClick={() => setSelectedLogDetails(null)}
                className="absolute top-6 right-6 p-3 bg-slate-100 rounded-full hover:bg-red-500 hover:text-white transition-all"
              >
                <FiX />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1800px] mx-auto w-full mb-6 shrink-0 flex flex-col lg:flex-row justify-between lg:items-end gap-4 print:hidden">
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
          className={`px-6 py-3 rounded-2xl border-2 flex items-center gap-3 transition-all duration-500 ${modelsLoaded ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-600"}`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest">
            {systemStatus}
          </span>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col xl:flex-row gap-8 lg:overflow-hidden print:hidden">
        {/* --- LEFT: LIVE FEED --- */}
        <div className="flex-[2.5] bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 flex flex-col shadow-xl min-h-[450px]">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl">
              <FiCamera size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
              Tactical Node Feed
            </h3>
          </div>
          <div className="flex-1 bg-slate-950 rounded-[2.2rem] overflow-hidden relative border-[6px] border-slate-50 shadow-inner group">
            <CameraNode
              wsUrl={import.meta.env.VITE_WS_CAM_1}
              name="Main Entrance"
              faceMatcher={faceMatcher}
              modelsLoaded={modelsLoaded}
              onMatch={addLog}
            />
          </div>
        </div>

        {/* --- RIGHT: DETECTION REGISTRY --- */}
        <div className="flex-1 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl p-6 lg:p-8 flex flex-col xl:max-w-md min-h-[500px] lg:min-h-0">
          <div className="shrink-0 mb-6 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#0038A8]">
                Activity Logs
              </h3>

              {/* 🔥 TACTICAL BULK DOWNLOAD BUTTON */}
              <button
                onClick={handleDownloadBulkReport}
                className="p-3 bg-[#FFD700] text-[#0038A8] rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all flex items-center gap-2"
                title="Generate Visual Report"
              >
                <FiDownload size={18} />
              </button>
            </div>

            <div className="space-y-4">
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

              {/* 🔥 TACTICAL RANGE PICKERS */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <label className="text-[7px] font-black text-slate-400 uppercase block mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase text-[#0038A8] w-full outline-none"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <label className="text-[7px] font-black text-slate-400 uppercase block mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase text-[#0038A8] w-full outline-none"
                  />
                </div>
              </div>

              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                {["today", "yesterday", "all"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeRange(t as any);
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === t && !dateFrom ? "bg-white text-[#0038A8] shadow-md" : "text-slate-400"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                <FiLayers size={12} className="text-slate-400" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-transparent text-[10px] font-black uppercase text-[#0038A8] outline-none w-full cursor-pointer"
                >
                  <option value="recent">Recent First</option>
                  <option value="old">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 mt-10 space-y-4">
                  <FiAlertCircle size={32} />
                  <p className="font-black text-slate-400 uppercase text-[10px]">
                    No Active Matches Found
                  </p>
                </div>
              ) : (
                filteredLogs.map((log: any) => (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative group bg-[#F8FAFC] border-2 border-slate-100 p-4 rounded-4xl flex gap-4 items-center hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer overflow-hidden"
                    onClick={() => setSelectedLogDetails(log)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogToDelete(log);
                      }}
                      className="absolute -top-1 -right-1 p-3 bg-red-600 text-white rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all z-30 active:scale-90"
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
                          {log.status}
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

// HELPER CAMERA NODE (UNCHANGED)
const CameraNode = ({
  wsUrl,
  name,
  faceMatcher,
  modelsLoaded,
  onMatch,
}: any) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);
  const [status, setStatus] = useState("LINKING...");

  useEffect(() => {
    if (!canvasRef.current || !(window as any).JSMpeg) return;
    playerRef.current = new (window as any).JSMpeg.Player(wsUrl, {
      canvas: canvasRef.current,
      autoplay: true,
      audio: false,
      onPlay: () => setStatus("LIVE"),
    });
    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
  }, [wsUrl]);

  useEffect(() => {
    if (!modelsLoaded || status !== "LIVE") return;
    let scanTimeout: any;
    const scanFace = async () => {
      if (!canvasRef.current || !drawCanvasRef.current) return;
      try {
        const detections = await faceapi
          .detectAllFaces(
            canvasRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }),
          )
          .withFaceLandmarks()
          .withFaceDescriptors();
        const displaySize = {
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        };
        faceapi.matchDimensions(drawCanvasRef.current, displaySize);
        const resized = faceapi.resizeResults(detections, displaySize);
        const ctx = drawCanvasRef.current.getContext("2d");
        ctx?.clearRect(
          0,
          0,
          drawCanvasRef.current.width,
          drawCanvasRef.current.height,
        );
        resized.forEach((det) => {
          if (faceMatcher) {
            const match = faceMatcher.findBestMatch(det.descriptor);
            if (match.label !== "unknown") {
              const [vName, vId] = match.label.split("__");
              onMatch({
                visitorId: vId,
                visitorName: vName,
                cameraName: name,
                confidence: Math.round((1 - match.distance) * 100),
                screenshotBase64: canvasRef.current!.toDataURL(
                  "image/jpeg",
                  0.6,
                ),
                status: "Detected",
                timestamp: new Date().toISOString(),
              });
            }
            new faceapi.draw.DrawBox(det.detection.box, {
              label:
                match.label !== "unknown"
                  ? match.label.split("__")[0]
                  : "UNAUTHORIZED",
              boxColor: match.label !== "unknown" ? "#FFD700" : "#ef4444",
            }).draw(drawCanvasRef.current!);
          }
        });
      } catch (e) {}
      scanTimeout = setTimeout(scanFace, 500);
    };
    scanFace();
    return () => clearTimeout(scanTimeout);
  }, [faceMatcher, modelsLoaded, status]);

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#0a0f1c]">
      <canvas ref={canvasRef} className="w-full h-full object-cover" />
      <canvas
        ref={drawCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
        <div
          className={`w-2 h-2 rounded-full ${status === "LIVE" ? "bg-red-500 animate-pulse" : "bg-slate-500"}`}
        />
        <span className="text-white text-[10px] font-black uppercase tracking-widest">
          {name}
        </span>
      </div>
    </div>
  );
};

export default CCTVMonitor;
