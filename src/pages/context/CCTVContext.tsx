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

// 🔥 CRITICAL FIX: Ensure the Auth Token is always sent for saves/deletes!
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
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

  // 5 Minute Cooldown Map
  const cooldownMap = useRef<Map<string, number>>(new Map());

  // 🛡️ 1. FETCH LOGS
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

  // 🛡️ 2. INITIALIZE SYSTEM (AI + Faces)
  useEffect(() => {
    const init = async () => {
      try {
        setSystemStatus("LOADING MODELS...");
        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";

        // Load Neural Nets
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        setSystemStatus("SYNCING VECTORS...");

        // 🔥 FETCH FROM MAIN BOOKINGS
        const res = await api.get("/bookings");

        // 🚨 INDESTRUCTIBLE ARRAY EXTRACTION:
        let visitors: any[] = [];
        if (Array.isArray(res.data)) {
          visitors = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          visitors = res.data.data;
        } else if (res.data?.bookings && Array.isArray(res.data.bookings)) {
          visitors = res.data.bookings;
        } else if (res.data?.visitors && Array.isArray(res.data.visitors)) {
          visitors = res.data.visitors;
        }

        console.log(
          `[CCTV DB Check] Found ${visitors.length} total visitors in database.`,
        );

        // Get Today's Date in exact "YYYY-MM-DD" format for Manila
        const todayStr = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Manila",
        });

        const labeledDescriptors: any[] = [];
        let loadedCount = 0;
        let todayMatches = 0;

        visitors.forEach((v: any) => {
          // Get "YYYY-MM-DD" from DB's bookingDate safely
          const dbDate = v.bookingDate
            ? String(v.bookingDate).split("T")[0]
            : null;

          // ⚠️ SECURITY RULE: ONLY allow bookings matching today's Manila date!
          if (dbDate !== todayStr) return;

          todayMatches++;

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
            console.warn(
              `[CCTV] Skipping ${v.firstName}: Invalid face data (Length: ${normalizedEmbedding.length})`,
            );
          }
        });

        console.log(
          `[CCTV Metrics] Matched ${todayMatches} bookings for today. Loaded ${loadedCount} valid faces.`,
        );

        // Initialize Face Matcher
        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.65)); // 0.65 is optimal for CCTV
          setSystemStatus(`${loadedCount} VECTORS ACTIVE`);
        } else {
          setFaceMatcher(null);
          setSystemStatus(`NO BOOKINGS TODAY`);
        }

        // Fetch UI logs and mark as ready
        await fetchLogs();
        setModelsLoaded(true);
      } catch (e) {
        console.error("Context Init Error:", e);
        setSystemStatus("SYSTEM OFFLINE");
      }
    };

    init();
  }, []);

  // 🛡️ 3. ADD LOG (Waits for Real DB ID before displaying)
  const addLog = useCallback(async (newLog: Omit<any, "_id">) => {
    const key = `${newLog.visitorId}|||${newLog.cameraName}`;
    const now = Date.now();

    // 5 Minute Cooldown per person per camera
    if (now - (cooldownMap.current.get(key) || 0) < 300000) return;
    cooldownMap.current.set(key, now);

    try {
      // Send to DB FIRST
      const res = await api.post("/cctv-logs", newLog);

      // Only display it on screen IF it successfully saved and has a real _id
      const savedLog = res.data?.data || res.data?.log || res.data;
      if (savedLog && savedLog._id) {
        setLogs((prev) => [savedLog, ...prev].slice(0, 50));
      }
    } catch (e: any) {
      // 🔥 EXPOSED BACKEND ERROR: This will tell you exactly why MongoDB rejected the save
      console.error(
        "🚨 Failed to save CCTV log to Database. Backend says:",
        e.response?.data || e.message,
      );
    }
  }, []);

  // 🛡️ 4. DELETE LOG
  const deleteLog = async (id: string) => {
    try {
      await api.delete(`/cctv-logs/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (e: any) {
      console.error("Delete Error:", e.response?.data || e.message);
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
