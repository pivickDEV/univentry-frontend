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

// 🚀 VERCEL PREP: Global API Instance with Tunnel Headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

const CCTVContext = createContext<any>(null);

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

      // Safely handle different backend response structures
      if (Array.isArray(res.data)) {
        rawData = res.data;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        rawData = res.data.data;
      } else if (res.data.logs && Array.isArray(res.data.logs)) {
        rawData = res.data.logs;
      }

      // Sort newest to oldest
      const sortedData = rawData.sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setLogs(sortedData);
    } catch (err) {
      console.error("🔥 Context Error: Could not fetch initial logs", err);
    }
  };

  // 🛡️ 2. INITIALIZE SYSTEM (AI + Faces from Bookings)
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

        // 🔥 FETCH FROM BOOKINGS DB
        const res = await api.get("/face-recognition/visitors");
        const visitors = res.data?.bookings || res.data?.data || res.data || [];

        // Get Today's Date in Manila Time (YYYY-MM-DD)
        const todayStr = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Manila",
        });

        const labeledDescriptors: any[] = [];
        let loadedCount = 0; // Track how many faces were successfully loaded

        visitors.forEach((v: any) => {
          // Extract just the YYYY-MM-DD from the DB bookingDate
          const vDate = v.bookingDate ? v.bookingDate.split("T")[0] : "";

          // =========================================================================
          // ⚠️ CAPSTONE SECURITY RULE: Only allow visitors booked for TODAY
          // =========================================================================
          if (vDate !== todayStr) return;

          if (!v.faceEmbedding) return;

          // Safely parse the Face Embedding array from MongoDB
          let arr: number[] = [];
          if (typeof v.faceEmbedding === "string") {
            try {
              arr = JSON.parse(v.faceEmbedding);
            } catch (e) {}
          } else if (Array.isArray(v.faceEmbedding)) {
            arr = v.faceEmbedding;
          } else if (typeof v.faceEmbedding === "object") {
            arr = Object.values(v.faceEmbedding);
          }

          // If it successfully extracted the 128-d matrix, memorize the face!
          if (arr.length === 128) {
            const floatArray = new Float32Array(arr.map(Number));
            labeledDescriptors.push(
              new faceapi.LabeledFaceDescriptors(
                `${v.firstName} ${v.lastName}__${v._id}`,
                [floatArray],
              ),
            );
            loadedCount++;
          }
        });

        // Initialize Face Matcher
        if (labeledDescriptors.length > 0) {
          // 🔥 BUMPED TO 0.65: This makes the CCTV slightly more forgiving to bad lighting/angles!
          setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.65));
          setSystemStatus(`${loadedCount} VECTORS ACTIVE`);
        } else {
          setSystemStatus(`NO BOOKINGS FOR TODAY`);
        }

        // Fetch UI logs and mark as ready
        await fetchLogs();
        setModelsLoaded(true);
      } catch (e) {
        console.error("Context Init Error:", e);
        setSystemStatus("OFFLINE");
      }
    };

    init();
  }, []);

  // 🛡️ 3. ADD LOG (Triggered by CCTVMonitor when someone walks by)
  const addLog = useCallback(async (newLog: any) => {
    const key = `${newLog.visitorId}|||${newLog.cameraName}`;
    const now = Date.now();

    // 5 MINUTE COOLDOWN: Prevent spamming the DB if the person stands there
    if (now - (cooldownMap.current.get(key) || 0) < 300000) return;

    cooldownMap.current.set(key, now);

    // Optimistic UI Update (Pops instantly on the right sidebar)
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
