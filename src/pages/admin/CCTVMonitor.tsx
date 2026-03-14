/* eslint-disable */
"use client";

import axios from "axios";
import * as faceapi from "face-api.js";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCalendar,
  FiCamera,
  FiFilter,
  FiLoader,
  FiLogOut,
  FiMaximize,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiWifiOff,
} from "react-icons/fi";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
  },
});

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

// ============================================================================
// TYPES
// ============================================================================
interface Camera {
  id: string;
  name: string;
  wsUrl: string;
}

interface DBVisitor {
  _id: string;
  firstName?: string;
  lastName?: string;
  visitorId?: string;
  visitor?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    faceEmbedding?: any;
  };
  faceEmbedding?: any;
}

interface RecognitionLog {
  _id: string;
  visitorId?: string;
  visitorName: string;
  cameraName: string;
  confidence: number;
  screenshotBase64: string;
  status: "IN" | "OUT";
  date: string;
  timestamp: string;
}

// ============================================================================
// HELPERS
// ============================================================================
const getCurrentPHDate = () =>
  new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });

const normalizeEmbedding = (rawEmbedding: any): number[] => {
  if (!rawEmbedding) return [];

  let arr: any[] = [];

  // Case 1: already a proper JS array
  if (Array.isArray(rawEmbedding)) {
    arr = rawEmbedding;
  }
  // Case 2: JSON string
  else if (typeof rawEmbedding === "string") {
    try {
      const parsed = JSON.parse(rawEmbedding);
      if (Array.isArray(parsed)) arr = parsed;
    } catch (err) {
      return [];
    }
  }
  // Case 3: mongoose/buffer-like object { data: [...] }
  else if (
    typeof rawEmbedding === "object" &&
    rawEmbedding !== null &&
    Array.isArray(rawEmbedding.data)
  ) {
    arr = rawEmbedding.data;
  }
  // Case 4: object with numeric keys
  else if (typeof rawEmbedding === "object" && rawEmbedding !== null) {
    const values = Object.values(rawEmbedding);
    if (Array.isArray(values)) arr = values;
  }

  const numeric = arr.map((v) => Number(v)).filter((v) => !Number.isNaN(v));

  if (numeric.length !== 128) return [];

  return numeric;
};

const extractVisitorIdentity = (record: DBVisitor) => {
  const _id = record._id || record.visitorId || record.visitor?._id || "";
  const firstName = record.firstName || record.visitor?.firstName || "";
  const lastName = record.lastName || record.visitor?.lastName || "";
  const faceEmbedding = record.faceEmbedding || record.visitor?.faceEmbedding;

  return {
    _id,
    firstName,
    lastName,
    faceEmbedding,
    fullName: `${firstName} ${lastName}`.trim(),
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const CCTVMonitor = () => {
  const [cameras] = useState<Camera[]>([
    {
      id: "CAM_1",
      name: "Main Gate Camera",
      wsUrl: import.meta.env.VITE_WS_CAM_1 || "ws://localhost:9999",
    },
  ]);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(
    null,
  );
  const [logs, setLogs] = useState<RecognitionLog[]>([]);
  const [systemStatus, setSystemStatus] = useState("LOADING NEURAL NETS...");

  const [searchQuery, setSearchQuery] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const [filterDate, setFilterDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const activeVisitors = useRef<
    Map<string, { lastSeen: number; status: "IN" | "OUT"; visitorName: string }>
  >(new Map());

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  useEffect(() => {
    let isMounted = true;

    const initSystem = async () => {
      try {
        setSystemStatus("LOADING NEURAL NETS...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        if (!isMounted) return;

        // CHANGE THIS PART
        const visitorsRes = await api
          .get("/face-recognition/visitors")
          .catch((err) => {
            console.error("Failed to load visitor faces:", err);
            return { data: [] };
          });

        setSystemStatus("SYNCING DB VECTORS...");

        const logsRes = await api.get("/cctv-logs").catch(() => {
          console.warn(
            "Notice: /cctv-logs unavailable. Proceeding without history.",
          );
          return { data: [] };
        });

        const rawVisitors = Array.isArray(visitorsRes.data)
          ? visitorsRes.data
          : Array.isArray(visitorsRes.data?.data)
            ? visitorsRes.data.data
            : Array.isArray(visitorsRes.data?.bookings)
              ? visitorsRes.data.bookings
              : [];

        console.log("Visitors response:", visitorsRes.data);
        console.log("Resolved visitors array:", rawVisitors);

        const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];

        rawVisitors.forEach((record: DBVisitor, index: number) => {
          const { _id, faceEmbedding, fullName } =
            extractVisitorIdentity(record);

          if (!_id) {
            console.warn(`Visitor [${index}] skipped: missing _id`, record);
            return;
          }

          if (!faceEmbedding) {
            console.warn(
              `Visitor [${index}] skipped: missing faceEmbedding`,
              record,
            );
            return;
          }

          const normalized = normalizeEmbedding(faceEmbedding);

          if (normalized.length !== 128) {
            console.warn(
              `Visitor [${index}] skipped: invalid embedding length`,
              {
                _id,
                name: fullName,
                length: normalized.length,
                rawFaceEmbedding: faceEmbedding,
              },
            );
            return;
          }

          try {
            labeledDescriptors.push(
              new faceapi.LabeledFaceDescriptors(
                `${fullName || "Unknown Visitor"}__${_id}`,
                [new Float32Array(normalized)],
              ),
            );
          } catch (err) {
            console.warn(
              `Visitor [${index}] skipped: failed descriptor build`,
              {
                _id,
                name: fullName,
                err,
              },
            );
          }
        });

        console.log("Loaded labeled descriptors:", labeledDescriptors.length);

        if (labeledDescriptors.length > 0 && isMounted) {
          // Slightly more forgiving than 0.6 for live CCTV conditions
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.65));
          console.log("FaceMatcher initialized successfully.");
        } else {
          console.warn("⚠️ No faces found in DB to match against.");
          setFaceMatcher(null);
        }

        if (isMounted) {
          const logsArray = Array.isArray(logsRes.data)
            ? logsRes.data
            : Array.isArray(logsRes.data?.data)
              ? logsRes.data.data
              : [];

          if (Array.isArray(logsArray)) {
            const sorted = logsArray.sort(
              (a: any, b: any) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            );
            setLogs(sorted);
          }

          setModelsLoaded(true);
          setSystemStatus(
            labeledDescriptors.length > 0
              ? "CCTV ACTIVE"
              : "NO FACE VECTORS LOADED",
          );
        }
      } catch (err) {
        console.error("AI Init Error:", err);
        if (isMounted) {
          setSystemStatus("SYSTEM OFFLINE");
          setFaceMatcher(null);
        }
      }
    };

    initSystem();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================================================
  // AUTO-LOGOUT
  // ============================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const currentDate = getCurrentPHDate();

      activeVisitors.current.forEach((data, key) => {
        if (data.status === "IN" && now - data.lastSeen > 30000) {
          activeVisitors.current.set(key, { ...data, status: "OUT" });

          const [visitorId, cameraName] = key.split("|||");

          const outLog: RecognitionLog = {
            _id: Math.random().toString(),
            visitorId,
            visitorName: data.visitorName,
            cameraName,
            confidence: 0,
            screenshotBase64: "",
            status: "OUT",
            date: currentDate,
            timestamp: new Date().toISOString(),
          };

          setLogs((prev) =>
            [outLog, ...prev]
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              )
              .slice(0, 50),
          );

          api.post("/cctv-logs", outLog).catch(() => {});
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // MATCH HANDLER
  // ============================================================================
  const handleFaceDetected = useCallback(
    async (
      matchInfo: string,
      distance: number,
      imageBase64: string,
      cameraName: string,
    ) => {
      if (matchInfo === "unknown") return;

      const [visitorName, visitorId] = matchInfo.split("__");
      const now = Date.now();
      const currentDate = getCurrentPHDate();
      const key = `${visitorId}|||${cameraName}`;
      const activeInfo = activeVisitors.current.get(key);

      if (activeInfo && activeInfo.status === "IN") {
        activeVisitors.current.set(key, { ...activeInfo, lastSeen: now });
        return;
      }

      activeVisitors.current.set(key, {
        lastSeen: now,
        status: "IN",
        visitorName,
      });

      const newLog: RecognitionLog = {
        _id: Math.random().toString(),
        visitorId,
        visitorName,
        cameraName,
        confidence: Math.round((1 - distance) * 100),
        screenshotBase64: imageBase64,
        status: "IN",
        date: currentDate,
        timestamp: new Date().toISOString(),
      };

      setLogs((prev) =>
        [newLog, ...prev]
          .sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          .slice(0, 50),
      );

      try {
        await api.post("/cctv-logs", newLog);
      } catch (err) {
        console.warn("Failed to save CCTV log:", err);
      }
    },
    [],
  );

  const filteredLogs = logs
    .filter((l) =>
      l.visitorName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((l) => {
      if (!filterDate) return true;
      return l.date === filterDate || l.timestamp.startsWith(filterDate);
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {zoomedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 cursor-zoom-out"
            onClick={() => setZoomedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              src={zoomedImage}
              className="max-w-[90vw] max-h-[90vh] rounded-3xl shadow-[0_0_50px_rgba(0,56,168,0.3)] border-4 border-white/10 object-contain"
            />
            <span className="absolute bottom-10 text-white/50 text-xs font-black uppercase tracking-[0.2em] animate-pulse">
              Click anywhere to close
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-400 mx-auto w-full mb-6 shrink-0 flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 lg:p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg shadow-blue-900/20">
            <FiShield className="text-2xl lg:text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
              Surveillance{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
                Grid
              </span>
            </h1>
            <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              AI Face Recognition Monitor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
          <span
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl shadow-sm transition-colors duration-500 border ${
              modelsLoaded
                ? "bg-white text-[#0038A8] border-slate-200"
                : "bg-[#FFD700]/10 text-amber-600 border-[#FFD700]/50"
            }`}
          >
            {modelsLoaded ? (
              <div className="flex items-center justify-center w-3 h-3 relative">
                <div className="absolute w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75" />
                <div className="relative w-2 h-2 bg-emerald-500 rounded-full" />
              </div>
            ) : (
              <FiLoader className="text-lg animate-spin" />
            )}
            {systemStatus}
          </span>

          <span className="hidden md:flex items-center gap-2 text-white bg-[#0038A8] border border-blue-800 px-5 py-3 rounded-2xl shadow-lg">
            <FiCamera /> {cameras.length} NODE(S) ONLINE
          </span>
        </div>
      </div>

      <div className="max-w-400 mx-auto w-full flex-1 flex flex-col xl:flex-row gap-8 overflow-hidden">
        <div className="flex-[2.5] bg-white rounded-[2.5rem] border border-slate-200 p-6 lg:p-8 flex flex-col overflow-hidden shadow-xl">
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2 bg-blue-50 text-[#0038A8] rounded-lg">
              <FiCamera size={16} />
            </div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Live CCTV Feeds
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-min">
            {cameras.map((cam) => (
              <CameraNode
                key={cam.id}
                camera={cam}
                faceMatcher={faceMatcher}
                modelsLoaded={modelsLoaded}
                onMatch={handleFaceDetected}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-6 lg:p-8 flex flex-col overflow-hidden xl:max-w-md">
          <div className="shrink-0 mb-6 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#0038A8] rounded-lg">
                  <FiUserCheck size={16} />
                </div>
                <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-widest">
                  Detection Logs
                </h3>
              </div>
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg shadow-sm tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search visitor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold focus:outline-none focus:border-[#0038A8] focus:ring-2 focus:ring-blue-50 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="date"
                    value={filterDate}
                    onClick={(e: any) => e.currentTarget.showPicker()}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-[10px] font-black text-slate-600 focus:outline-none focus:border-[#0038A8] transition-colors cursor-pointer uppercase"
                  />
                </div>

                <div className="relative flex-1">
                  <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    value={sortOrder}
                    onChange={(e) =>
                      setSortOrder(e.target.value as "newest" | "oldest")
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-[10px] font-black text-slate-600 focus:outline-none focus:border-[#0038A8] transition-colors cursor-pointer appearance-none uppercase"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            <AnimatePresence>
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40 mt-10">
                  <FiAlertCircle size={48} className="mb-4 text-slate-300" />
                  <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest text-center px-4">
                    No matching logs found.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-[#F8FAFC] border border-slate-200 p-4 rounded-3xl flex gap-4 items-center shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(0,56,168,0.2)] ${
                        log.screenshotBase64
                          ? "cursor-zoom-in border-white group-hover:border-[#0038A8]"
                          : "bg-slate-200 border-slate-300"
                      }`}
                      onClick={() =>
                        log.screenshotBase64 &&
                        setZoomedImage(log.screenshotBase64)
                      }
                    >
                      {log.screenshotBase64 ? (
                        <img
                          src={log.screenshotBase64}
                          alt="Match"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiLogOut className="text-slate-400 text-2xl" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 text-sm uppercase truncate tracking-tight group-hover:text-[#0038A8] transition-colors">
                        {log.visitorName}
                      </h4>
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 mb-2">
                        <FiCamera className="text-slate-300" /> {log.cameraName}
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black px-2.5 py-1 rounded border uppercase tracking-widest ${
                            log.status === "OUT"
                              ? "bg-slate-100 text-slate-500 border-slate-200"
                              : "bg-blue-50 text-[#0038A8] border-blue-100 shadow-sm"
                          }`}
                        >
                          {log.status === "OUT"
                            ? "EXITED (OUT)"
                            : "DETECTED (IN)"}
                        </span>

                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString("en-PH", {
                            timeZone: "Asia/Manila",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
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
// CAMERA NODE
// ============================================================================
const CameraNode = ({ camera, faceMatcher, modelsLoaded, onMatch }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<any>(null);

  const [streamStatus, setStreamStatus] = useState("CONNECTING TO NODE...");
  const [refreshKey, setRefreshKey] = useState(0);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!videoCanvasRef.current) return;

    let socketInterval: NodeJS.Timeout;

    const connectStream = () => {
      if (!(window as any).JSMpeg) {
        setStreamStatus("ERROR: JSMPEG SCRIPT MISSING");
        return;
      }

      try {
        setStreamStatus("CONNECTING TO NODE...");

        if (playerRef.current) {
          playerRef.current.destroy();
          playerRef.current = null;
        }

        playerRef.current = new (window as any).JSMpeg.Player(camera.wsUrl, {
          canvas: videoCanvasRef.current,
          autoplay: true,
          audio: false,
          loop: true,
          disableGl: true,
          onPlay: () => setStreamStatus("LIVE"),
          onStalled: () => setStreamStatus("BUFFERING..."),
        });

        socketInterval = setInterval(() => {
          if (playerRef.current?.source?.socket) {
            const rs = playerRef.current.source.socket.readyState;
            if (rs === 2 || rs === 3) {
              setStreamStatus("OFFLINE");
              if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
              }
            }
          }
        }, 2000);
      } catch (err) {
        setStreamStatus("CONNECTION REFUSED");
      }
    };

    const timer = setTimeout(connectStream, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(socketInterval);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [camera.wsUrl, refreshKey]);

  useEffect(() => {
    if (!modelsLoaded || streamStatus !== "LIVE") return;

    let isScanning = false;
    let scanTimeout: NodeJS.Timeout;

    const scanFace = async () => {
      if (isScanning || !videoCanvasRef.current || !drawCanvasRef.current)
        return;
      isScanning = true;

      try {
        if (
          videoCanvasRef.current.width === 0 ||
          videoCanvasRef.current.height === 0
        ) {
          throw new Error("Canvas zero dimension");
        }

        const detections = await faceapi
          .detectAllFaces(
            videoCanvasRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.4,
            }),
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        const canvas = drawCanvasRef.current;
        const displaySize = {
          width: videoCanvasRef.current.clientWidth || 640,
          height: videoCanvasRef.current.clientHeight || 360,
        };

        faceapi.matchDimensions(canvas, displaySize);
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize,
        );

        const ctx = canvas.getContext("2d", {
          willReadFrequently: true,
        }) as CanvasRenderingContext2D;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        resizedDetections.forEach((detection) => {
          const jaw = detection.landmarks.getJawOutline();
          const nose = detection.landmarks.getNose();
          const leftJaw = jaw[0];
          const rightJaw = jaw[16];
          const noseTip = nose[3];

          const leftDist = Math.abs(noseTip.x - leftJaw.x);
          const rightDist = Math.max(Math.abs(rightJaw.x - noseTip.x), 0.1);
          const ratio = leftDist / rightDist;

          const isSideView = ratio > 2.2 || ratio < 0.45;
          const box = detection.detection.box;

          if (isSideView) {
            const drawBox = new faceapi.draw.DrawBox(box, {
              label: "IGNORED (SIDE PROFILE)",
              boxColor: "#f97316",
              lineWidth: 3,
            });
            drawBox.draw(canvas);
            return;
          }

          let label = "unknown";
          let distance = 1;

          if (faceMatcher) {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
            label = bestMatch.label;
            distance = bestMatch.distance;

            console.log("Best match:", {
              label,
              distance,
              confidence: Math.round((1 - distance) * 100),
            });
          }

          const isKnown = label !== "unknown";

          const drawLabel = isKnown
            ? `${label.split("__")[0]} (${Math.round((1 - distance) * 100)}%)`
            : "UNAUTHORIZED";

          const drawBox = new faceapi.draw.DrawBox(box, {
            label: drawLabel,
            boxColor: isKnown ? "#FFD700" : "#ef4444",
            lineWidth: 3,
          });
          drawBox.draw(canvas);

          if (isKnown) {
            const screenshot = videoCanvasRef.current!.toDataURL(
              "image/jpeg",
              0.6,
            );
            onMatch(label, distance, screenshot, camera.name);
          }
        });
      } catch (err) {
        console.warn("Face scan error:", err);
      } finally {
        isScanning = false;
        scanTimeout = setTimeout(scanFace, 600);
      }
    };

    scanFace();

    return () => clearTimeout(scanTimeout);
  }, [faceMatcher, modelsLoaded, camera.name, streamStatus, onMatch]);

  return (
    <div
      ref={containerRef}
      className="relative bg-[#0a0f1c] rounded-4xl overflow-hidden aspect-video shadow-2xl group border-[6px] border-slate-100 flex items-center justify-center"
    >
      {streamStatus !== "LIVE" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0f1c] z-50 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[20px_20px] opacity-20"></div>

          {streamStatus === "BUFFERING..." ||
          streamStatus.includes("CONNECTING") ? (
            <div className="flex flex-col items-center justify-center z-20">
              <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(255,215,0,0.4)]"></div>
              <span className="text-[#FFD700] text-xs font-black uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">
                {streamStatus}
              </span>
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-2">
                Waiting for Edge Node transmission...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center z-20">
              <FiWifiOff className="text-red-500 text-5xl mb-4 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
              <span className="text-red-500 text-xs font-black uppercase tracking-[0.3em] drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                {streamStatus === "OFFLINE"
                  ? "STREAM OFFLINE"
                  : "CAMERA DISCONNECTED"}
              </span>
              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-2 text-center max-w-[80%] mb-6">
                Cannot reach local CCTV Server. Ensure backend and tunneling are
                active.
              </span>

              <button
                onClick={() => setRefreshKey((prev) => prev + 1)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-600 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_0_15px_rgba(52,211,153,0.3)] active:scale-95 group cursor-pointer"
              >
                <FiRefreshCw className="text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-50">
                  Reconnect Node
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      <canvas
        ref={videoCanvasRef}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${
          streamStatus === "LIVE" ? "opacity-100" : "opacity-0"
        }`}
      />

      <canvas
        ref={drawCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      />

      <div className="absolute top-4 left-4 z-30 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
        <div
          className={`w-2 h-2 rounded-full ${
            streamStatus === "LIVE"
              ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              : "bg-slate-500"
          }`}
        />
        <span className="text-white text-[10px] font-black uppercase tracking-widest">
          {camera.name}
        </span>
      </div>

      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-30 text-white/70 hover:text-[#FFD700] bg-black/40 p-3 rounded-xl backdrop-blur-md transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
      >
        <FiMaximize size={18} />
      </button>
    </div>
  );
};

export default CCTVMonitor;
