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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: { "ngrok-skip-browser-warning": "69420" },
});

const CCTVContext = createContext<any>(null);

export const CCTVProvider = ({ children }: { children: React.ReactNode }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(
    null,
  );
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [systemStatus, setSystemStatus] = useState("INITIALIZING...");
  const cooldownMap = useRef<Map<string, number>>(new Map());

  /* eslint-disable */

  // 🛡️ 1. IMPROVED FETCH LOGS (Handles different response shapes)
  const fetchLogs = async () => {
    try {
      const res = await api.get("/cctv-logs");
      console.log("📥 CCTV Logs Received:", res.data); // DEBUG LOG

      // Handle nested data structures (res.data, res.data.data, or res.data.logs)
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

  // 🛡️ 2. SEPARATED INITIALIZATION
  useEffect(() => {
    // Fetch logs IMMEDIATELY, don't wait for AI
    fetchLogs();

    const initAI = async () => {
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
        const res = await api.get("/bookings");
        const visitors = res.data?.bookings || res.data?.data || res.data || [];

        // 🔥 NEW: Get today's date in Manila timezone
        const todayStr = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Manila",
        });

        const labeledDescriptors: any[] = [];

        visitors.forEach((v: any) => {
          // 🔥 NEW: Only process visitors whose bookingDate is exactly TODAY
          if (v.bookingDate !== todayStr) return;

          if (v.faceEmbedding && v.faceEmbedding.length === 128) {
            labeledDescriptors.push(
              new faceapi.LabeledFaceDescriptors(
                `${v.firstName} ${v.lastName}__${v._id}`,
                [new Float32Array(v.faceEmbedding)],
              ),
            );
          }
        });

        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
          setSystemStatus("SURVEILLANCE ACTIVE");
        } else {
          setSystemStatus("NO VECTORS LOADED");
        }

        setModelsLoaded(true);
      } catch (e) {
        console.error("AI Initialization Failed:", e);
        setSystemStatus("AI OFFLINE");
        // Don't set ModelsLoaded to false if you want the logs to show anyway
      }
    };

    initAI();
  }, []);

  // 🛡️ 2. INITIALIZE SYSTEM
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
        const res = await api.get("/face-recognition/visitors");
        const visitors = res.data?.bookings || res.data || [];

        const labeledDescriptors: any[] = [];
        visitors.forEach((v: any) => {
          if (v.faceEmbedding && v.faceEmbedding.length === 128) {
            labeledDescriptors.push(
              new faceapi.LabeledFaceDescriptors(
                `${v.firstName} ${v.lastName}__${v._id}`,
                [new Float32Array(v.faceEmbedding)],
              ),
            );
          }
        });

        if (labeledDescriptors.length > 0) {
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
        }

        // 🔥 CRITICAL: Fetch the logs after models/matcher are ready
        await fetchLogs();

        setModelsLoaded(true);
        setSystemStatus("SURVEILLANCE ACTIVE");
      } catch (e) {
        setSystemStatus("OFFLINE");
      }
    };
    init();
  }, []);

  // 🛡️ 3. ADD LOG (Real-time)
  const addLog = useCallback(async (newLog: any) => {
    const key = `${newLog.visitorId}|||${newLog.cameraName}`;
    const now = Date.now();
    if (now - (cooldownMap.current.get(key) || 0) < 300000) return;

    cooldownMap.current.set(key, now);

    // Update local state immediately for UI response
    setLogs((prev) => [newLog, ...prev].slice(0, 50));

    try {
      await api.post("/cctv-logs", newLog);
    } catch (e) {
      console.error("Failed to save log to DB");
    }
  }, []);

  // 🛡️ 4. DELETE LOG
  const deleteLog = async (id: string) => {
    try {
      await api.delete(`/cctv-logs/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (e) {
      alert("Delete failed");
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
