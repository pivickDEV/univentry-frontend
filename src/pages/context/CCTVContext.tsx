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

// 🔥 CRITICAL FIX: Add Token Interceptor so backend accepts saves/deletes!
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const CCTVContext = createContext<any>(null);

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

  const cooldownMap = useRef<Map<string, number>>(new Map());
  const visitorDataMap = useRef<Map<string, any>>(new Map()); // 🔥 Tracks Office & TimeIn

  const fetchLogs = async () => {
    try {
      const res = await api.get("/cctv-logs");
      let rawData = [];
      if (Array.isArray(res.data)) rawData = res.data;
      else if (res.data.data && Array.isArray(res.data.data))
        rawData = res.data.data;
      else if (res.data.logs && Array.isArray(res.data.logs))
        rawData = res.data.logs;

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

        // 🔥 Use optimized route. NO DATE RESTRICTION. Load EVERYONE.
        const res = await api.get("/face-recognition/visitors");
        const visitors = res.data?.data || res.data || [];

        const labeledDescriptors: any[] = [];
        let loadedCount = 0;

        visitorDataMap.current.clear();

        visitors.forEach((v: any) => {
          // Store data for Out of Bounds / Loitering checks
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

  const addLog = useCallback(async (newLog: Omit<any, "_id">) => {
    const key = `${newLog.visitorId}|||${newLog.cameraName}`;
    const now = Date.now();

    if (now - (cooldownMap.current.get(key) || 0) < 60000) return;
    cooldownMap.current.set(key, now);

    // ========================================================
    // 🚨 SENSOR TRIGGER: Out of Bounds & Loitering Check
    // ========================================================
    let finalStatus = "Detected";

    const vData = visitorDataMap.current.get(newLog.visitorId);
    if (vData && vData.office !== "Unknown") {
      const destOffice = vData.office;
      const currentCam = newLog.cameraName;
      const secondsInside = (now - vData.timeIn) / 1000;

      const safeZones = ["Main Entrance Hallway", "Gate", destOffice];

      if (!safeZones.includes(currentCam)) {
        finalStatus = `Out of Bounds (Headed to ${destOffice})`;
      } else if (secondsInside > 10 && currentCam !== destOffice) {
        finalStatus = `Loitering (${Math.floor(secondsInside)} secs)`;
      }
    }

    const payload = { ...newLog, status: finalStatus };

    try {
      // SEND TO DATABASE FIRST
      const res = await api.post("/cctv-logs", payload);
      const savedLog = res.data?.data || res.data?.log || res.data;

      // UPDATE UI ONLY IF DB ACCEPTS IT
      if (savedLog && savedLog._id) {
        setLogs((prev) => [savedLog, ...prev].slice(0, 50));
      }
    } catch (e: any) {
      console.error(
        "🚨 Failed to save CCTV log. Token missing or invalid schema.",
        e.response?.data || e.message,
      );
    }
  }, []);

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
