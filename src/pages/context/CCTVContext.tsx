/* eslint-disable */
import axios from "axios";
import * as faceapi from "face-api.js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// --- API INSTANCE ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// 🔥 1. CRITICAL FIX: Add Token Interceptor so backend accepts saves/deletes!
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const CCTVContext = createContext<any>(null);

// ============================================================================
// 🔥 ROBUST HELPER: Forces any weird DB format into a clean 128-d Array
// ============================================================================
const normalizeEmbedding = (rawEmbedding: any): number[] => {
  if (!rawEmbedding) return [];

  let arr: any[] = [];

  if (Array.isArray(rawEmbedding)) {
    arr = rawEmbedding;
  } else if (typeof rawEmbedding === "string") {
    try {
      const parsed = JSON.parse(rawEmbedding);
      if (Array.isArray(parsed)) arr = parsed;
    } catch (err) {
      return [];
    }
  } else if (
    typeof rawEmbedding === "object" &&
    rawEmbedding !== null &&
    Array.isArray(rawEmbedding.data)
  ) {
    arr = rawEmbedding.data;
  } else if (typeof rawEmbedding === "object" && rawEmbedding !== null) {
    const values = Object.values(rawEmbedding);
    if (Array.isArray(values)) arr = values;
  }

  const numeric = arr.map((v) => Number(v)).filter((v) => !Number.isNaN(v));

  if (numeric.length !== 128) return [];

  return numeric;
};

export const CCTVProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(
    null,
  );
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [systemStatus, setSystemStatus] = useState("INITIALIZING...");

  // 🔥 2. SMART TRACKING MAPS (For Loitering & Out of Bounds)
  const cooldownMap = useRef<Map<string, number>>(new Map());
  const visitorDataMap = useRef<Map<string, any>>(new Map());

  const fetchLogs = async () => {
    try {
      const res = await api.get("/cctv-logs");
      let rawData = [];

      if (Array.isArray(res.data)) {
        rawData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        rawData = res.data.data;
      } else if (res.data.logs && Array.isArray(res.data.logs)) {
        rawData = res.data.logs;
      }

      const sortedData = rawData.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setLogs(sortedData);
    } catch (err) {
      console.error("🔥 Context Error: Could not fetch initial logs", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setSystemStatus("LOADING MODELS...");
        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setSystemStatus("SYNCING VECTORS...");

        // Fetching full bookings data so we have 'office' and 'timeIn' for the Loitering tracking!
        const res = await api.get("/bookings");
        const visitors = res.data?.data || res.data || [];

        const labeledDescriptors: any[] = [];
        let loadedCount = 0;

        // Reset Tracker
        visitorDataMap.current.clear();

        visitors.forEach((v: any, index: number) => {
          // Save Visitor Info to map for Area Coverage / Loitering calculations
          visitorDataMap.current.set(v._id, {
            office: v.office || "Unknown",
            timeIn: v.timeIn ? new Date(v.timeIn).getTime() : Date.now(),
          });

          const normalizedEmbedding = normalizeEmbedding(v.faceEmbedding);

          if (normalizedEmbedding.length === 128) {
            const floatArray = new Float32Array(normalizedEmbedding);
            labeledDescriptors.push(
              new faceapi.LabeledFaceDescriptors(
                `${v.firstName} ${v.lastName}__${v._id}`,
                [floatArray],
              ),
            );
            loadedCount++;
          } else {
            console.warn(`Visitor [${index}] skipped: invalid embedding`);
          }
        });

        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.65));
          setSystemStatus(`${loadedCount} VECTORS ACTIVE`);
        } else {
          setFaceMatcher(null);
          setSystemStatus(`NO FACES IN DATABASE`);
        }

        await fetchLogs();
        setModelsLoaded(true);
      } catch (e) {
        console.error("Context Init Error:", e);
        setSystemStatus("SYSTEM OFFLINE");
      }
    };

    init();
  }, []);

  // 🛡️ 3. ADD LOG & AREA TRACKING (Point A to Point B)
  const addLog = useCallback(async (newLog: Omit<any, "_id">) => {
    const key = `${newLog.visitorId}|||${newLog.cameraName}`;
    const now = Date.now();

    // 1-Minute Cooldown to prevent spam
    if (now - (cooldownMap.current.get(key) || 0) < 60000) return;
    cooldownMap.current.set(key, now);

    // ========================================================
    // 🚨 SENSOR TRIGGER: Out of Bounds & Loitering Check
    // ========================================================
    let alertStatus = "Detected";
    let alertNote = "Normal";

    const vData = visitorDataMap.current.get(newLog.visitorId);

    if (vData) {
      const destOffice = vData.office;
      const currentCam = newLog.cameraName;
      const timeIn = vData.timeIn;

      // Calculate minutes since entry
      const minutesInside = (now - timeIn) / 60000;

      // Safe zones include the main gate and their actual destination
      const safeZones = ["Main Entrance Hallway", "Gate", destOffice];

      // RULE 1: OUT OF BOUNDS (Wrong Area)
      if (!safeZones.includes(currentCam)) {
        alertStatus = "Out of Bounds";
        alertNote = `Unauthorized Area. Destination is ${destOffice}.`;
      }
      // RULE 2: LOITERING (Time Allotted > 15 mins without reaching destination)
      else if (minutesInside > 15 && currentCam !== destOffice) {
        alertStatus = "Loitering";
        alertNote = `In transit for ${Math.floor(minutesInside)} mins.`;
      }
    }

    const payload = {
      ...newLog,
      visitorName: `${newLog.firstName} ${newLog.lastName}`,
      status: alertStatus,
      purpose: alertNote, // Using 'purpose' or 'notes' field to store the alert info
    };

    try {
      // Send to DB FIRST
      const res = await api.post("/cctv-logs", payload);
      const savedLog = res.data?.data || res.data?.log || res.data;

      // Ensure successful DB Save
      if (savedLog && savedLog._id) {
        setLogs((prev) => [savedLog, ...prev].slice(0, 50));

        // If alert was triggered, you can log it to console or trigger UI notification
        if (alertStatus !== "Detected") {
          console.warn(
            `🚨 SECURITY ALERT: ${payload.visitorName} - ${alertStatus} (${alertNote})`,
          );
        }
      }
    } catch (e: any) {
      console.error(
        "Failed to save log. Auth or DB Error:",
        e.response?.data || e.message,
      );
    }
  }, []);

  // 🛡️ 4. DELETE LOG
  const deleteLog = async (id: string) => {
    try {
      await api.delete(`/cctv-logs/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (e) {
      alert("Delete failed! Check the browser console for details.");
    }
  };

  return (
    <CCTVContext.Provider
      value={{
        logs,
        setLogs,
        faceMatcher,
        modelsLoaded,
        systemStatus,
        addLog,
        deleteLog,
      }}
    >
      {children}
    </CCTVContext.Provider>
  );
};

export const useCCTV = () => useContext(CCTVContext);
