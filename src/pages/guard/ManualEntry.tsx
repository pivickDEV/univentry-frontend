/* eslint-disable */
import axios from "axios";
import * as faceapi from "face-api.js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckCircle,
  CreditCard,
  Download,
  Loader2,
  Printer,
  RefreshCcw,
  ScanFace,
  Shield,
  User,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";

// --- API INSTANCE ---
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""),
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// --- CONFIGURATION ---
const VIDEO_CONSTRAINTS = { width: 1280, height: 720, facingMode: "user" };
const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

const ID_OPTIONS = {
  Primary: [
    "PhilID (National ID)",
    "Driver's License",
    "Philippine Passport",
    "UMID (SSS/GSIS)",
    "PRC ID",
    "Postal ID (Digital/PVC)",
  ],
  Secondary: [
    "School ID",
    "Company ID",
    "TIN ID",
    "PhilHealth ID",
    "PWD ID",
    "Senior Citizen ID",
    "Voter's ID",
    "Barangay ID",
  ],
};

const ManualEntry = () => {
  // --- REFS ---
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const captureTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modelsLoadedRef = useRef(false);

  // --- GLOBAL STATE ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);

  // --- MODAL STATES ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [registeredBookingId, setRegisteredBookingId] = useState<string | null>(
    null,
  );

  // --- ENTRY FORM STATE ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [category, setCategory] = useState("");
  const [office, setOffice] = useState("");
  const [purpose, setPurpose] = useState("Walk-in Inquiry");
  const [offices, setOffices] = useState<{ _id: string; name: string }[]>([]);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });

  const [bookingDate, setBookingDate] = useState(today);
  const [slots, setSlots] = useState<{ current: number; max: number | null }>({
    current: 0,
    max: null,
  });
  const [isValidating, setIsValidating] = useState(false);

  const [idCategory, setIdCategory] = useState<"Primary" | "Secondary">(
    "Primary",
  );
  const [idType, setIdType] = useState(ID_OPTIONS.Primary[0]);

  // --- CAMERA & AI STATE ---
  const [faceScan, setFaceScan] = useState<string | null>(null);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [faceStatus, setFaceStatus] = useState<
    "scanning" | "stable" | "no_face" | "success"
  >("no_face");

  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [ocrFront, setOcrFront] = useState("");
  const [ocrBack, setOcrBack] = useState("");

  // 🔥 NEW: ID Authenticity State
  const [idStatusFront, setIdStatusFront] = useState<
    "idle" | "scanning" | "valid" | "fake"
  >("idle");
  const [idStatusBack, setIdStatusBack] = useState<
    "idle" | "scanning" | "valid" | "fake"
  >("idle");

  const [processing, setProcessing] = useState({
    face: false,
    ocrFront: false,
    ocrBack: false,
  });

  // ==========================================================
  // 1. INITIALIZATION
  // ==========================================================
  useEffect(() => {
    const init = async () => {
      try {
        const officeRes = await api.get("/offices");
        setOffices(officeRes.data);

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        modelsLoadedRef.current = true;
        setLoadingModels(false);
      } catch (err) {
        console.error("Initialization error:", err);
        setError("AI Models Failed to Load");
        setLoadingModels(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const fetchCapacity = async () => {
      if (!bookingDate || !office) {
        setSlots({ current: 0, max: null });
        return;
      }

      setIsValidating(true);
      setError(null);

      try {
        const res = await api.get("/offices/slots", {
          params: {
            date: bookingDate,
            office: office.trim(),
          },
        });

        console.log("SLOTS RESPONSE:", res.data);

        setSlots({
          current: Number(res.data?.current ?? 0),
          max: typeof res.data?.max === "number" ? res.data.max : null,
        });
      } catch (err: any) {
        console.error("Slot fetch failed:", {
          status: err?.response?.status,
          data: err?.response?.data,
          url: err?.config?.url,
          fullUrl: `${err?.config?.baseURL}${err?.config?.url}`,
          params: err?.config?.params,
        });

        setSlots({ current: 0, max: null });

        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Failed to check office availability.",
        );
      } finally {
        setIsValidating(false);
      }
    };

    fetchCapacity();
  }, [bookingDate, office]);

  // ==========================================================
  // 2. CAMERA LOOP
  // ==========================================================
  const detectFace = useCallback(async () => {
    if (
      faceScan ||
      !modelsLoadedRef.current ||
      registeredBookingId ||
      showConfirmModal
    ) {
      return;
    }

    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      video.readyState !== 4 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
      return;
    }

    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const detection = await faceapi
        .detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.5,
          }),
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        const box = detection.detection.box;
        ctx.strokeStyle = "#0038A8";
        ctx.lineWidth = 4;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        setFaceStatus("stable");

        if (!captureTimerRef.current) {
          captureTimerRef.current = setTimeout(() => {
            if (webcamRef.current) {
              const screenshot = webcamRef.current.getScreenshot();
              if (screenshot) {
                setFaceScan(screenshot);
                setFaceEmbedding(Array.from(detection.descriptor));
                setFaceStatus("success");
                if (animationFrameRef.current) {
                  cancelAnimationFrame(animationFrameRef.current);
                }
              }
            }
          }, 1500);
        }
      } else {
        setFaceStatus("no_face");
        if (captureTimerRef.current) {
          clearTimeout(captureTimerRef.current);
          captureTimerRef.current = null;
        }
      }
    } catch (e) {
      // ignore benign canvas/face timing errors
    }

    if (!faceScan) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
    }
  }, [faceScan, registeredBookingId, showConfirmModal]);

  useEffect(() => {
    if (
      !faceScan &&
      !loadingModels &&
      !registeredBookingId &&
      !showConfirmModal
    ) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      detectFace();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
      }
    };
  }, [
    faceScan,
    loadingModels,
    detectFace,
    registeredBookingId,
    showConfirmModal,
  ]);

  // ==========================================================
  // 3. CAPTURE & AI FORGERY ACTIONS
  // ==========================================================
  const handleRetakeFace = () => {
    setFaceScan(null);
    setFaceEmbedding(null);
    setFaceStatus("no_face");

    if (captureTimerRef.current) {
      clearTimeout(captureTimerRef.current);
    }
    captureTimerRef.current = null;
  };

  const handleCaptureID = (side: "front" | "back") => {
    if (!webcamRef.current) return;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    if (side === "front") {
      setIdFront(screenshot);
      runOcr(screenshot, "front");
    } else {
      setIdBack(screenshot);
      runOcr(screenshot, "back");
    }
  };

  // 🔥 NEW: Authenticity Validation Engine
  const verifyDocumentAuthenticity = (
    text: string,
    idTypeStr: string,
  ): "valid" | "fake" => {
    const upperText = text.toUpperCase();
    const baselineMarkers = [
      "REPUBLIC OF THE PHILIPPINES",
      "REPUBLIKA NG PILIPINAS",
      "DATE OF BIRTH",
      "DOB",
      "NAME",
      "NO.",
      "SIGNATURE",
      "ADDRESS",
    ];
    let specificMarkers: string[] = [];

    if (idTypeStr.includes("PhilID") || idTypeStr.includes("National ID"))
      specificMarkers = [
        "PHILID",
        "NATIONAL ID",
        "PSA",
        "PHILIPPINE STATISTICS AUTHORITY",
      ];
    else if (idTypeStr.includes("Driver"))
      specificMarkers = [
        "DRIVER",
        "LICENSE",
        "LTO",
        "LAND TRANSPORTATION OFFICE",
      ];
    else if (idTypeStr.includes("Passport"))
      specificMarkers = [
        "PASSPORT",
        "PASAPORTE",
        "DEPARTMENT OF FOREIGN AFFAIRS",
      ];
    else if (idTypeStr.includes("UMID"))
      specificMarkers = ["UMID", "SSS", "GSIS", "UNIFIED MULTI-PURPOSE"];
    else if (idTypeStr.includes("TIN"))
      specificMarkers = ["TIN", "BUREAU OF INTERNAL REVENUE", "BIR"];
    else if (idTypeStr.includes("School"))
      specificMarkers = [
        "STUDENT",
        "UNIVERSITY",
        "COLLEGE",
        "SCHOOL",
        "ID NUMBER",
        "CAMPUS",
      ];

    const baseMatches = baselineMarkers.filter((m) =>
      upperText.includes(m),
    ).length;
    const specificMatches = specificMarkers.filter((m) =>
      upperText.includes(m),
    ).length;

    // Minimum criteria to consider an ID valid
    if (specificMatches >= 1 || baseMatches >= 2) return "valid";
    return "fake";
  };

  const runOcr = async (image: string, side: "front" | "back") => {
    const key = side === "front" ? "ocrFront" : "ocrBack";
    setProcessing((prev) => ({ ...prev, [key]: true }));

    if (side === "front") setIdStatusFront("scanning");
    else setIdStatusBack("scanning");

    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(image);

      const cleanText = text.replace(/[^a-zA-Z0-9\s]/g, "").trim();

      if (side === "front") {
        setOcrFront(cleanText);
        setIdStatusFront(verifyDocumentAuthenticity(text, idType));
      } else {
        setOcrBack(cleanText);
        // Ensure back has some valid markers or generic text to pass, else fake
        setIdStatusBack(
          text.length > 10 ? verifyDocumentAuthenticity(text, idType) : "fake",
        );
      }

      await worker.terminate();
    } catch (err) {
      console.error(`OCR ${side} failed:`, err);
      if (side === "front") setIdStatusFront("fake");
      else setIdStatusBack("fake");
    } finally {
      setProcessing((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ==========================================================
  // 4. SUBMITS & MODALS
  // ==========================================================
  const triggerConfirmation = () => {
    if (!firstName || !lastName || !email || !office || !category) {
      return setError("Missing form details.");
    }

    if (!faceEmbedding) {
      return setError("Face scan required (look at camera).");
    }

    if (!idFront || !idBack) {
      return setError("ID images required.");
    }

    // 🔥 NEW: Check for Forgery
    if (idStatusFront === "fake" || idStatusBack === "fake") {
      return setError(
        "Document verification failed. Please upload a clear, valid ID.",
      );
    }

    if (slots.max === 0) {
      return setError("Office is closed on the selected date.");
    }

    if (slots.max !== null && slots.current >= slots.max) {
      return setError("Office is full for the selected date.");
    }

    setError(null);
    setShowConfirmModal(true);
  };

  const executeRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber || null,
        category,
        office,
        purpose,
        bookingDate,
        faceEmbedding,
        idCategory,
        idType,
        idFront,
        idBack,
        ocrFront,
        ocrBack,
        actionBy: "Walk-In Registration",
      };

      const { data } = await api.post("/bookings", payload);

      setRegisteredBookingId(data.bookingId);
      setShowConfirmModal(false);
      resetFormBackground();
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Registration failed",
      );
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const resetFormBackground = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setPurpose("");
    setCategory("");
    setOffice("");
    setBookingDate(today);
    setSlots({ current: 0, max: null });

    setFaceScan(null);
    setFaceEmbedding(null);
    setIdFront(null);
    setIdBack(null);
    setOcrFront("");
    setOcrBack("");
    setIdStatusFront("idle");
    setIdStatusBack("idle");

    handleRetakeFace();
  };

  // --- PRINTER / DOWNLOAD LOGIC ---
  const qrUrl = registeredBookingId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${registeredBookingId}`
    : "";

  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `UniVentry-Pass-${registeredBookingId?.slice(-6).toUpperCase()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const printQR = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Pass</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 40px; }
              .card { border: 2px dashed #0038A8; padding: 30px; display: inline-block; border-radius: 20px; }
              h1 { color: #0038A8; margin-bottom: 5px; font-weight: 900; letter-spacing: 2px; }
              h3 { color: #333; margin-top: 0; }
              .id-text { font-family: monospace; font-size: 24px; font-weight: bold; color: #0038A8; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="card">
               <h1>UNIVENTRY</h1>
               <h3>Official Digital Access Pass</h3>
               <img src="${qrUrl}" style="width: 300px; height: 300px; margin-top: 20px;" onload="window.print();window.close();" />
               <p class="id-text">ID: #${registeredBookingId?.slice(-6).toUpperCase()}</p>
               <p style="margin-top: 5px; font-weight: bold; color: #666;">Date: ${bookingDate}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const inputStyle =
    "w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400";

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col">
      <div className="max-w-400 mx-auto w-full mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 lg:p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg shadow-blue-900/20">
            <UserPlus size={28} className="lg:w-8 lg:h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
              Walk-In{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
                Registration
              </span>
            </h1>
            <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Public Override Console
            </p>
          </div>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
          className="max-w-400 mx-auto w-full"
        >
          <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold flex items-center gap-2 border border-red-200 shadow-sm text-xs">
            <XCircle size={18} /> {error}
          </div>
        </motion.div>
      )}

      <div className="max-w-400 mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-10 flex-1 items-start">
        <div className="lg:col-span-6 xl:col-span-5 bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
          <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-widest mb-6 flex items-center gap-2">
            <User size={16} /> Visitor Details
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="col-span-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                First Name
              </label>
              <input
                type="text"
                className={inputStyle}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Juan"
              />
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Last Name
              </label>
              <input
                type="text"
                className={inputStyle}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Dela Cruz"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="visitor@example.com"
                className={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="date"
                  className={`${inputStyle} pl-12`}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={today}
                />
              </div>
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Destination
              </label>
              <select
                className={inputStyle}
                value={office}
                onChange={(e) => {
                  setOffice(e.target.value);
                  setError(null);
                }}
              >
                <option value="">Select Office</option>
                {offices.map((o) => (
                  <option key={o._id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <div
                className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border transition-colors ${
                  !isValidating && office && slots.max === 0
                    ? "bg-red-50 border-red-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    Availability
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      !isValidating && office && slots.max === 0
                        ? "text-red-600"
                        : "text-[#0038A8]"
                    }`}
                  >
                    {isValidating
                      ? "Checking Cloud..."
                      : !office
                        ? "Select Office First"
                        : slots.max === null
                          ? "Availability Unknown"
                          : slots.max === 0
                            ? "OFFICE CLOSED"
                            : `${slots.current} / ${slots.max} Taken`}
                  </span>
                </div>

                {office && !isValidating && slots.max !== null && (
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      slots.max === 0 || slots.current >= slots.max
                        ? "bg-red-500"
                        : "bg-emerald-500 animate-pulse"
                    }`}
                  />
                )}
              </div>
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Category
              </label>
              <select
                className={inputStyle}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="Student">Student</option>
                <option value="Alumni">Alumni</option>
                <option value="Parent/Guardian">Parent/Guardian</option>
                <option value="Supplier">Supplier</option>
                <option value="Applicant Student">Applicant Student</option>
                <option value="Applicant Employee">Applicant Employee</option>
                <option value="Guest">Guest</option>
                <option value="Merchant">Merchant</option>
              </select>
            </div>

            <div className="col-span-1 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Phone
              </label>
              <input
                type="text"
                className={inputStyle}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="09xxxxxxxxx"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Purpose
              </label>
              <input
                type="text"
                className={inputStyle}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Submitting requirements"
              />
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  ID Category
                </label>
                <select
                  className={inputStyle}
                  value={idCategory}
                  onChange={(e) => {
                    const cat = e.target.value as "Primary" | "Secondary";
                    setIdCategory(cat);
                    setIdType(ID_OPTIONS[cat][0]);
                  }}
                >
                  <option value="Primary">Primary ID</option>
                  <option value="Secondary">Secondary ID</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  ID Type
                </label>
                <select
                  className={inputStyle}
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                >
                  {ID_OPTIONS[idCategory].map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={triggerConfirmation}
            className="w-full py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-[#002b82] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <UserPlus size={18} /> Process Registration
          </button>
        </div>

        <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] p-6 lg:p-8 border border-slate-200 shadow-xl flex flex-col">
            <div className="relative rounded-4xl overflow-hidden bg-slate-900 mb-6 aspect-video border-4 border-slate-50 shadow-inner group flex items-center justify-center">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={VIDEO_CONSTRAINTS}
                forceScreenshotSourceSize={true}
              />

              {!faceScan && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
              )}

              {!faceScan && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full shadow-lg border border-slate-200 z-20">
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                      faceStatus === "stable"
                        ? "text-[#0038A8]"
                        : "text-slate-500"
                    }`}
                  >
                    {loadingModels ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> AI
                        Loading...
                      </>
                    ) : faceStatus === "stable" ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-[#0038A8]" />{" "}
                        Hold Still...
                      </>
                    ) : (
                      "Align Face in Frame"
                    )}
                  </p>
                </div>
              )}

              {faceScan && (
                <div className="absolute top-4 right-4 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-emerald-400">
                  <CheckCircle size={14} /> Biometric Secured
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <ModernCaptureBtn
                onClick={handleRetakeFace}
                active={!!faceScan}
                icon={
                  faceScan ? (
                    <RefreshCcw size={20} />
                  ) : (
                    <ScanFace size={20} className="text-[#0038A8]" />
                  )
                }
                label={faceScan ? "Retake Face" : "Auto-Scan Face"}
              />

              <ModernCaptureBtn
                onClick={() => handleCaptureID("front")}
                active={!!idFront}
                loading={processing.ocrFront}
                icon={<CreditCard size={20} className="text-[#0038A8]" />}
                label="Snap ID Front"
              />

              <ModernCaptureBtn
                onClick={() => handleCaptureID("back")}
                active={!!idBack}
                loading={processing.ocrBack}
                icon={<Shield size={20} className="text-[#0038A8]" />}
                label="Snap ID Back"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ModernPreviewBox label="Biometric Profile" img={faceScan} />
            {/* 🔥 NEW: Show Validation Status in Previews */}
            <ModernPreviewBox
              label="ID Front"
              img={idFront}
              status={idStatusFront}
            />
            <ModernPreviewBox
              label="ID Back"
              img={idBack}
              status={idStatusBack}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-center"
            >
              <div className="bg-[#0038A8] p-8 pb-10 relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl text-[#0038A8] mb-4 relative z-10">
                  <UserPlus size={36} />
                </div>
                <h2 className="text-white font-black text-2xl uppercase tracking-wide relative z-10">
                  Verify Registration
                </h2>
              </div>

              <div className="p-8 -mt-6 bg-white rounded-t-4xl relative z-20">
                <h3 className="text-2xl font-black text-slate-800 uppercase leading-none">
                  {firstName} {lastName}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-6">
                  {office} • {category}
                </p>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8">
                  <p className="text-xs text-[#0038A8] font-bold uppercase tracking-wide leading-relaxed">
                    Are you sure you want to register this visitor into the
                    system database?
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={loading}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={executeRegistration}
                    disabled={loading}
                    className="flex-1 py-4 bg-[#0038A8] hover:bg-[#002b82] text-[#FFD700] font-black rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} /> Yes, Register
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {registeredBookingId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col"
            >
              <div className="bg-[#0038A8] p-8 text-center border-b border-blue-800">
                <h1 className="text-[#FFD700] m-0 tracking-widest text-3xl font-black uppercase">
                  UNIVENTRY
                </h1>
                <p className="text-white text-[10px] uppercase tracking-widest opacity-80 mt-1">
                  IoT Visitor Management System
                </p>
              </div>

              <div className="p-8 text-center text-slate-800 bg-white">
                <h2 className="text-[#0038A8] text-2xl font-black mb-2 uppercase tracking-tight">
                  Hello, {firstName}!
                </h2>
                <p className="text-sm text-slate-500 font-medium">
                  Your walk-in registration for{" "}
                  <strong className="text-emerald-600">{office}</strong> is
                  confirmed.
                </p>

                <div className="my-8 p-6 border-2 border-dashed border-slate-200 rounded-4xl bg-slate-50 inline-block relative shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-56 h-56 object-contain rounded-xl mx-auto"
                  />
                  <p className="mt-6 font-mono font-black text-[#0038A8] text-xl tracking-widest bg-blue-50 py-2 rounded-xl border border-blue-100">
                    ID: #{registeredBookingId.slice(-6).toUpperCase()}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center text-left">
                  <div>
                    <span className="text-[9px] font-black text-[#0038A8] uppercase tracking-widest">
                      Valid Date
                    </span>
                    <br />
                    <span className="text-sm font-black text-slate-800">
                      {bookingDate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-[#0038A8] uppercase tracking-widest">
                      Category
                    </span>
                    <br />
                    <span className="text-sm font-black text-slate-800 uppercase">
                      {category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center gap-4">
                <button
                  onClick={downloadQR}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 hover:text-[#0038A8] hover:border-[#0038A8] rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-sm flex justify-center items-center gap-2 active:scale-95"
                >
                  <Download size={18} /> Download
                </button>

                <button
                  onClick={printQR}
                  className="flex-1 py-4 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-900/20 hover:bg-[#002b82] flex justify-center items-center gap-2 active:scale-95"
                >
                  <Printer size={18} /> Print
                </button>
              </div>

              <button
                onClick={() => setRegisteredBookingId(null)}
                className="absolute top-6 right-6 p-2 text-white/50 hover:bg-white/10 hover:text-white rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ModernCaptureBtn = ({ onClick, active, loading, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all active:scale-95 shadow-sm ${
      active
        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
        : "bg-white border-slate-100 hover:border-[#0038A8]/30 hover:shadow-md text-slate-500"
    }`}
  >
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
        active ? "bg-emerald-500 text-white" : "bg-blue-50"
      }`}
    >
      {loading ? (
        <Loader2 className="animate-spin text-[#0038A8]" />
      ) : active ? (
        <Check size={20} strokeWidth={3} />
      ) : (
        icon
      )}
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight px-2">
      {label}
    </span>
  </button>
);

// 🔥 NEW: Visual UI warning inside Preview Box for Fake IDs
const ModernPreviewBox = ({ label, img, status }: any) => (
  <div className="bg-white rounded-3xl p-2.5 border border-slate-200 shadow-sm flex flex-col items-center justify-center h-47 relative overflow-hidden group">
    {img ? (
      <>
        <img src={img} className="w-full h-full object-cover rounded-2xl" />

        {/* Fake Warning Overlay */}
        {status === "fake" && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center rounded-2xl backdrop-blur-sm">
            <span className="text-white text-[10px] font-black uppercase tracking-widest bg-red-600 px-3 py-1.5 rounded shadow-lg border border-red-400">
              Fake ID Detected
            </span>
          </div>
        )}

        {/* Valid Status Marker */}
        {status === "valid" && (
          <div className="absolute top-3 right-3 bg-emerald-500 w-3 h-3 rounded-full border-2 border-white shadow-sm" />
        )}
      </>
    ) : (
      <div className="flex flex-col items-center justify-center opacity-40">
        <Shield size={28} className="mb-2 text-slate-400" />
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest text-center leading-tight">
          {label}
          <br />
          Missing
        </p>
      </div>
    )}
  </div>
);

export default ManualEntry;
