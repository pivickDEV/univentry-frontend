/* eslint-disable */
"use client";

import * as faceapi from "face-api.js";
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
  FiUserCheck,
} from "react-icons/fi";
import { useCCTV } from "../context/CCTVContext";

const CCTVMonitor = () => {
  const { logs, deleteLog, modelsLoaded, systemStatus, faceMatcher, addLog } =
    useCCTV();

  const [cameras] = useState([
    {
      id: "CAM_1",
      name: "Hallway Cam 1",
      wsUrl: import.meta.env.VITE_WS_CAM_1 || "ws://localhost:9999",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  // 🔥 NEW STATE FOR RANGE
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "all">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<"recent" | "old">("recent");

  const [logToDelete, setLogToDelete] = useState<any>(null);
  const [, setSelectedLogDetails] = useState<any>(null);

  // --- 🔥 DOWNLOAD AS PICTURE LOGIC ---
  const handleDownloadReport = () => {
    const element = document.getElementById("detection-registry");
    if (!element) return;
    // This triggers the browser's visual print capture focused on the logs
    window.print();
  };

  // --- FILTER & SORT LOGIC ---
  const filteredLogs = logs
    .filter((l: any) =>
      l.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((l: any) => {
      if (!l.timestamp) return false;
      const logTime = new Date(l.timestamp).getTime();

      // 🔥 DATE RANGE LOGIC
      if (dateFrom) {
        const start = new Date(dateFrom).setHours(0, 0, 0, 0);
        if (logTime < start) return false;
      }
      if (dateTo) {
        const end = new Date(dateTo).setHours(23, 59, 59, 999);
        if (logTime > end) return false;
      }

      // Existing logic for quick filters (if no range is set)
      if (!dateFrom && !dateTo) {
        if (filterDate) {
          return (
            new Date(l.timestamp).toISOString().split("T")[0] === filterDate
          );
        }
        if (timeRange === "all") return true;
        const logDate = new Date(l.timestamp);
        const now = new Date();
        if (timeRange === "today")
          return logDate.toDateString() === now.toDateString();
        if (timeRange === "yesterday") {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          return logDate.toDateString() === yesterday.toDateString();
        }
      }
      return true;
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
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
      {/* ... (Existing Dossier Modal and Delete Confirmation code stays exactly the same) ... */}

      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 print:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLogToDelete(null)}
              className="absolute inset-0 bg-[#001233]/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center border-4 border-white"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FiAlertTriangle size={40} />
              </div>
              <h2 className="text-2xl font-black text-[#0038A8] uppercase mb-10">
                Erase Track?
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
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="max-w-[1800px] mx-auto w-full mb-6 shrink-0 flex flex-col lg:flex-row justify-between lg:items-end gap-4 print:hidden">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#0038A8] text-[#FFD700] rounded-[1.8rem] shadow-2xl">
            <FiShield size={32} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter italic">
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
        {/* --- LEFT: LIVE FEED --- */}
        <div className="flex-[2.5] bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 flex flex-col overflow-hidden shadow-xl min-h-[450px] print:hidden">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl">
              <FiCamera size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
              Tactical Node: {cameras[0].name}
            </h3>
          </div>
          <div className="flex-1 bg-slate-950 rounded-[2.2rem] overflow-hidden relative border-[6px] border-slate-50 shadow-inner group">
            <CameraNode
              wsUrl={cameras[0].wsUrl}
              name={cameras[0].name}
              faceMatcher={faceMatcher}
              modelsLoaded={modelsLoaded}
              onMatch={addLog}
            />
          </div>
        </div>

        {/* --- RIGHT: DETECTION REGISTRY --- */}
        <div
          id="detection-registry"
          className="flex-1 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl p-6 lg:p-8 flex flex-col xl:max-w-md min-h-[500px] lg:min-h-0 print:border-0 print:shadow-none print:max-w-none"
        >
          <div className="shrink-0 mb-6 border-b border-slate-100 pb-6 print:hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl">
                  <FiUserCheck size={20} />
                </div>
                <h3 className="text-xs font-black uppercase text-[#0038A8]">
                  Identification Logs
                </h3>
              </div>
              {/* 🔥 DOWNLOAD BUTTON */}
              <button
                onClick={handleDownloadReport}
                className="p-3 bg-[#FFD700] text-[#0038A8] rounded-xl shadow-lg hover:scale-110 transition-transform active:scale-90"
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
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:border-[#0038A8] outline-none"
                />
              </div>

              {/* 🔥 DATE RANGE PICKER */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[7px] font-black text-slate-400 uppercase mb-1">
                    Date From
                  </p>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-transparent text-[10px] font-black uppercase text-[#0038A8] outline-none cursor-pointer"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[7px] font-black text-slate-400 uppercase mb-1">
                    Date To
                  </p>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-transparent text-[10px] font-black uppercase text-[#0038A8] outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                {["today", "yesterday", "all"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeRange(t as any);
                      setFilterDate("");
                      setDateFrom("");
                      setDateTo("");
                    }}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${timeRange === t && !dateFrom ? "bg-white text-[#0038A8] shadow-md" : "text-slate-400"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
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

          {/* DETECTIONS FEED */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 print:overflow-visible">
            <AnimatePresence mode="popLayout">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 mt-10 space-y-4">
                  <FiAlertCircle size={32} />
                  <p className="font-black text-slate-400 uppercase text-[10px]">
                    No Matches In Range
                  </p>
                </div>
              ) : (
                filteredLogs.map((log: any) => (
                  <motion.div
                    key={log._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group bg-[#F8FAFC] border-2 border-slate-100 p-4 rounded-4xl flex gap-4 items-center hover:bg-white transition-all cursor-pointer overflow-hidden print:border-slate-300 print:mb-4"
                    onClick={() => setSelectedLogDetails(log)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogToDelete(log);
                      }}
                      className="absolute -top-1 -right-1 p-3 bg-red-600 text-white rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all z-30 print:hidden"
                    >
                      <FiTrash2 size={14} />
                    </button>
                    <div className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md">
                      <img
                        src={log.screenshotBase64}
                        className="w-full h-full object-cover"
                      />
                    </div>
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
                          {log.status || "Detected"}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 font-mono">
                          <FiClock size={10} />
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

// ... (Existing CameraNode component stays exactly the same) ...
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
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/10">
        <div
          className={`w-2 h-2 rounded-full ${status === "LIVE" ? "bg-red-500 animate-pulse" : "bg-slate-500"}`}
        />
        <span className="text-white text-[10px] font-black uppercase">
          {name}
        </span>
      </div>
    </div>
  );
};

export default CCTVMonitor;
