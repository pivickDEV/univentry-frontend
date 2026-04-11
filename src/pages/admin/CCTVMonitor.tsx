/* eslint-disable */
"use client";

import * as faceapi from "face-api.js";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCalendar,
  FiCamera,
  FiClock,
  FiLayers,
  FiLoader,
  FiMaximize,
  FiSearch,
  FiShield,
  FiTarget,
  FiTrash2,
  FiUserCheck,
  FiWifiOff,
  FiX,
} from "react-icons/fi";
import { useCCTV } from "../context/CCTVContext";

const CCTVMonitor = () => {
  const { logs, deleteLog, modelsLoaded, systemStatus, faceMatcher, addLog } =
    useCCTV();

  const [cameras] = useState([
    {
      id: "CAM_1",
      name: "Main Entrance Hallway",
      wsUrl: import.meta.env.VITE_WS_CAM_1 || "ws://localhost:9999",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "all">(
    "all",
  );
  const [sortOrder, setSortOrder] = useState<"recent" | "old">("recent");

  const [logToDelete, setLogToDelete] = useState<any>(null);
  const [selectedLogDetails, setSelectedLogDetails] = useState<any>(null);

  // --- FILTER & SORT LOGIC ---
  const filteredLogs = logs
    .filter((l: any) =>
      l.visitorName?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((l: any) => {
      if (!l.timestamp) return false; // Safety check

      if (filterDate) {
        return new Date(l.timestamp).toISOString().split("T")[0] === filterDate;
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
    <div className="min-h-screen lg:h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-y-auto lg:overflow-hidden relative">
      {/* --- DOSSIER MODAL --- */}
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
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,56,168,0.4)] flex flex-col lg:flex-row"
            >
              <div className="lg:w-3/5 bg-slate-950 relative flex items-center justify-center border-r border-slate-100">
                <img
                  src={selectedLogDetails.screenshotBase64}
                  className="w-full h-full object-contain"
                  alt="High Res Detection"
                />
                <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">
                    Raw Surveillance Frame
                  </span>
                </div>
              </div>
              <div className="lg:w-2/5 p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#0038A8] mb-2">
                    <FiTarget size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">
                      Target Identified
                    </span>
                  </div>
                  <h2 className="text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none mb-6">
                    {selectedLogDetails.visitorName}
                  </h2>
                  <div className="space-y-6">
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Biometric Data
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 uppercase">
                          Match Confidence
                        </span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs font-black">
                          {selectedLogDetails.confidence}%
                        </span>
                      </div>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                        Timestamp & Logistics
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase">
                          <span className="flex items-center gap-2">
                            <FiCamera size={14} /> Node
                          </span>
                          <span className="text-[#0038A8]">
                            {selectedLogDetails.cameraName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase">
                          <span className="flex items-center gap-2">
                            <FiClock size={14} /> Time
                          </span>
                          <span className="text-[#0038A8]">
                            {new Date(
                              selectedLogDetails.timestamp,
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase">
                          <span className="flex items-center gap-2">
                            <FiCalendar size={14} /> Date
                          </span>
                          <span className="text-[#0038A8]">
                            {new Date(
                              selectedLogDetails.timestamp,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLogDetails(null)}
                  className="w-full mt-10 py-5 bg-[#0038A8] text-white rounded-[1.8rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#002b82] transition-all active:scale-95"
                >
                  Close Dossier
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

      {/* --- DELETION CONFIRMATION --- */}
      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
              <h2 className="text-2xl font-black text-[#0038A8] uppercase tracking-tighter mb-2">
                Erase Track?
              </h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10 px-4">
                Remove detection log for{" "}
                <span className="text-red-600">
                  "{logToDelete.visitorName}"
                </span>
                ?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-900/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HEADER --- */}
      <div className="max-w-[1800px] mx-auto w-full mb-6 shrink-0 flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div className="flex items-center gap-5">
          <div className="p-4 bg-[#0038A8] text-[#FFD700] rounded-[1.8rem] shadow-2xl">
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
          {modelsLoaded ? (
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
          ) : (
            <FiLoader className="animate-spin" />
          )}
          <span className="text-[10px] font-black uppercase tracking-widest">
            {systemStatus}
          </span>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto w-full flex-1 flex flex-col xl:flex-row gap-8 lg:overflow-hidden">
        {/* --- LEFT: LIVE FEED --- */}
        <div className="flex-[2.5] bg-white rounded-[2.5rem] border-2 border-slate-100 p-8 flex flex-col overflow-hidden shadow-xl min-h-[450px]">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl">
              <FiCamera size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
              Tactical Node: {cameras[0].name}
            </h3>
          </div>
          <div className="flex-1 bg-slate-950 rounded-[2.2rem] overflow-hidden relative border-[6px] border-slate-50 shadow-inner group">
            {/* 🔥 INTEGRATED CAMERA NODE WITH AI DRAWING */}
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
        <div className="flex-1 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-2xl p-6 lg:p-8 flex flex-col xl:max-w-md min-h-[500px] lg:min-h-0">
          <div className="shrink-0 mb-6 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-[#0038A8] rounded-xl">
                  <FiUserCheck size={20} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#0038A8]">
                  Identification Logs
                </h3>
              </div>
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg tracking-widest animate-pulse">
                SYNCED
              </span>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0038A8] transition-colors" />
                <input
                  type="text"
                  placeholder="SEARCH IDENTITIES..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 pl-12 text-xs font-bold focus:border-[#0038A8] outline-none transition-all placeholder:text-slate-300"
                />
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                {["today", "yesterday", "all"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeRange(t as any);
                      setFilterDate("");
                    }}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === t && !filterDate ? "bg-white text-[#0038A8] shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2 border border-slate-100">
                  <FiCalendar size={12} className="text-slate-400" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-transparent text-[10px] font-black uppercase text-slate-500 outline-none w-full cursor-pointer"
                  />
                </div>
                <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-2 border border-slate-100">
                  <FiLayers size={12} className="text-slate-400" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="bg-transparent text-[10px] font-black uppercase text-slate-500 outline-none cursor-pointer w-full"
                  >
                    <option value="recent">Recent</option>
                    <option value="old">Old</option>
                  </select>
                </div>
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
                    No Registry Matches
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
                    className="relative group bg-[#F8FAFC] border-2 border-slate-100 p-4 rounded-4xl flex gap-4 items-center hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer overflow-hidden"
                    onClick={() => setSelectedLogDetails(log)}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogToDelete(log);
                      }}
                      className="absolute -top-1 -right-1 p-3 bg-red-600 text-white rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all shadow-lg z-30 active:scale-90"
                    >
                      <FiTrash2 size={14} />
                    </button>
                    <div className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md transition-transform group-hover:scale-105">
                      <img
                        src={log.screenshotBase64}
                        className="w-full h-full object-cover"
                        alt="Hit"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[#0038A8] text-[13px] uppercase truncate tracking-tight mb-0.5">
                        {log.visitorName}
                      </h4>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
                        {new Date(log.timestamp).toLocaleDateString("en-PH", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                          <span className="text-[8px] font-black">
                            {log.confidence}%
                          </span>
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

// ============================================================================
// 🔥 CAMERA NODE WITH INLINE FACE-API DRAWING
// ============================================================================
const CameraNode = ({
  wsUrl,
  name,
  faceMatcher,
  modelsLoaded,
  onMatch,
}: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For Video
  const drawCanvasRef = useRef<HTMLCanvasElement>(null); // For AI Boxes
  const playerRef = useRef<any>(null);
  const [status, setStatus] = useState("LINKING...");

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  // 1. Connect JSMpeg Video Stream
  useEffect(() => {
    if (!canvasRef.current || !(window as any).JSMpeg) return;

    playerRef.current = new (window as any).JSMpeg.Player(wsUrl, {
      canvas: canvasRef.current,
      autoplay: true,
      audio: false,
      disableGl: true, // IMPORTANT: Needed so FaceAPI can read the canvas!
      onPlay: () => setStatus("LIVE"),
      onStalled: () => setStatus("BUFFERING..."),
    });

    return () => {
      if (playerRef.current) playerRef.current.destroy();
    };
  }, [wsUrl]);

  // 2. Start AI Scanning Loop
  useEffect(() => {
    if (!modelsLoaded || status !== "LIVE") return;

    let scanTimeout: NodeJS.Timeout;
    let isScanning = false;

    const scanFace = async () => {
      if (isScanning || !canvasRef.current || !drawCanvasRef.current) return;
      isScanning = true;

      try {
        const videoCanvas = canvasRef.current;
        const overlayCanvas = drawCanvasRef.current;

        if (videoCanvas.width === 0 || videoCanvas.height === 0) {
          throw new Error("Canvas zero dimension");
        }

        const detections = await faceapi
          .detectAllFaces(
            videoCanvas,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.4,
            }),
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        const displaySize = {
          width: videoCanvas.clientWidth || 640,
          height: videoCanvas.clientHeight || 360,
        };

        faceapi.matchDimensions(overlayCanvas, displaySize);
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize,
        );
        const ctx = overlayCanvas.getContext("2d");
        ctx?.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        resizedDetections.forEach((detection) => {
          let drawLabel = "UNAUTHORIZED";
          let boxColor = "#ef4444"; // Red for unknown/unauthorized

          // Only attempt to match if there are actually visitors booked today
          if (faceMatcher) {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            const isKnown = bestMatch.label !== "unknown";

            if (isKnown) {
              const [visitorName, visitorId] = bestMatch.label.split("__");
              const confidence = Math.round((1 - bestMatch.distance) * 100);
              drawLabel = `${visitorName} (${confidence}%)`;
              boxColor = "#FFD700"; // RTU Gold for known

              // Trigger Log creation in Context
              const screenshot = videoCanvas.toDataURL("image/jpeg", 0.6);
              onMatch({
                visitorId,
                visitorName,
                cameraName: name,
                confidence,
                screenshotBase64: screenshot,
                status: "Detected",
                timestamp: new Date().toISOString(),
              });
            }
          }

          // Draw the Box and Label on the overlay canvas (even for strangers!)
          const box = detection.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label: drawLabel,
            boxColor: boxColor,
            lineWidth: 3,
          });
          drawBox.draw(overlayCanvas);
        });
      } catch (err) {
        // Suppress benign canvas errors
      } finally {
        isScanning = false;
        // Adjust this timeout to balance performance (800ms = ~1.2 FPS)
        scanTimeout = setTimeout(scanFace, 500);
      }
    };

    scanFace();

    return () => clearTimeout(scanTimeout);
  }, [faceMatcher, modelsLoaded, status, name, onMatch]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center bg-[#0a0f1c] group"
    >
      {/* Video Stream Layer */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover opacity-90 transition-opacity duration-700"
      />

      {/* Transparent AI Drawing Layer */}
      <canvas
        ref={drawCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Overlay Status Badge */}
      <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-2xl z-20">
        <div
          className={`w-2 h-2 rounded-full ${status === "LIVE" ? "bg-red-500 animate-pulse shadow-[0_0_10px_red]" : "bg-slate-500"}`}
        />
        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">
          {name}
        </span>
      </div>

      {/* Maximize Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 p-3 bg-black/60 backdrop-blur-md text-white/50 hover:text-[#FFD700] rounded-xl transition-all opacity-0 group-hover:opacity-100 z-30"
      >
        <FiMaximize size={18} />
      </button>

      {/* Offline Screen */}
      {status !== "LIVE" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-30">
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
