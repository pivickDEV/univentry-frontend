/* eslint-disable */
"use client";

import axios from "axios";
import * as faceapi from "face-api.js";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiCpu,
  FiCrosshair,
  FiDownload,
  FiHash,
  FiImage,
  FiLoader,
  FiMail,
  FiPhone,
  FiPrinter,
  FiRefreshCw,
  FiShield,
  FiUser,
} from "react-icons/fi";
import Webcam from "react-webcam";
import { createWorker } from "tesseract.js";

const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:9000/api" : "");

if (!API_URL) {
  console.error("Missing VITE_API_URL in production");
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// Debugging Interceptors
api.interceptors.request.use((config) => {
  console.log("API REQUEST:", {
    method: config.method,
    url: `${config.baseURL}${config.url}`,
  });
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("API ERROR:", {
      status: error.response?.status,
      url: `${error.config?.baseURL}${error.config?.url}`,
      data: error.response?.data,
    });
    return Promise.reject(error);
  },
);

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

type FaceStatus = "scanning" | "stable" | "no_face" | "too_far" | "success";
type IDStatus = "idle" | "scanning" | "valid" | "fake";

const BookAppointment = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modelsLoadedRef = useRef(false);
  const captureTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [step, setStep] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [category, setCategory] = useState("");

  const [office, setOffice] = useState("");
  const [purpose, setPurpose] = useState("");
  const [bookingDate, setBookingDate] = useState("");

  const [slots, setSlots] = useState<{ current: number; max: number | null }>({
    current: 0,
    max: null,
  });
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [faceScan, setFaceScan] = useState<string | null>(null);
  const [faceEmbedding, setFaceEmbedding] = useState<number[] | null>(null);
  const [, setFaceStatus] = useState<FaceStatus>("no_face");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offices, setOffices] = useState<{ _id: string; name: string }[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila",
  });

  const [idCategory, setIdCategory] = useState("Primary");
  const [idType, setIdType] = useState("");
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [ocrFront, setOcrFront] = useState("");
  const [ocrBack, setOcrBack] = useState("");
  const [idStatusFront, setIdStatusFront] = useState<IDStatus>("idle");
  const [idStatusBack, setIdStatusBack] = useState<IDStatus>("idle");
  const [, setIsOcrLoading] = useState(false);

  const idOptions = {
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

  const qrUrl = bookingId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${bookingId}`
    : "";

  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `UniVentry-Pass-${bookingId ? bookingId.slice(-6).toUpperCase() : "PASS"}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
      alert("Download failed due to network settings.");
    }
  };

  const printQR = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Access Pass</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 40px; color: #1e293b; }
              .card { border: 3px dashed #0038A8; padding: 40px; display: inline-block; border-radius: 20px; max-width: 400px; margin: 0 auto; }
              h1 { color: #0038A8; margin-bottom: 5px; font-weight: 900; letter-spacing: 2px; font-size: 32px; text-transform: uppercase; }
              h3 { color: #475569; margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
              .details { margin-top: 20px; text-align: left; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; }
              .details p { margin: 8px 0; font-size: 14px; font-weight: bold; }
              .details span { color: #0038A8; }
              .id-text { font-family: monospace; font-size: 28px; font-weight: bold; color: #0038A8; margin-top: 25px; letter-spacing: 2px; background: #eff6ff; padding: 10px; border-radius: 10px; display: inline-block; }
              @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <div class="card">
               <h1>UNIVENTRY</h1>
               <h3>Digital Access Pass</h3>
               <div class="details">
                  <p>Name: <span>${firstName} ${lastName}</span></p>
                  <p>Destination: <span>${office}</span></p>
                  <p>Category: <span>${category}</span></p>
                  <p>Valid Date: <span>${bookingDate}</span></p>
               </div>
               <img src="${qrUrl}" style="width: 250px; height: 250px; margin-top: 25px; border-radius: 10px;" onload="setTimeout(() => { window.print(); window.close(); }, 500);" />
               <br />
               <p class="id-text">#${bookingId ? bookingId.slice(-6).toUpperCase() : "XXXXXX"}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const verifyDocumentAuthenticity = (
    text: string,
    idTypeStr: string,
  ): IDStatus => {
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

    if (specificMatches >= 1 || baseMatches >= 2) return "valid";
    return "fake";
  };

  const handleOcr = async (image: string, side: "front" | "back") => {
    setIsOcrLoading(true);
    if (side === "front") setIdStatusFront("scanning");
    else setIdStatusBack("scanning");

    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(image);

      if (side === "front") {
        setOcrFront(text);
        setIdStatusFront(verifyDocumentAuthenticity(text, idType));
      } else {
        setOcrBack(text);
        setIdStatusBack(
          text.length > 10 ? verifyDocumentAuthenticity(text, idType) : "fake",
        );
      }

      await worker.terminate();
    } catch (err) {
      console.error("OCR Error:", err);
      if (side === "front") setIdStatusFront("fake");
      else setIdStatusBack("fake");
    } finally {
      setIsOcrLoading(false);
    }
  };

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await api.get("/offices");
        setOffices(res.data);
      } catch (err: any) {
        console.error("Office fetch failed:", err);
      }
    };
    fetchOffices();
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
            bookingDate: bookingDate,
            office: office.trim(),
          },
        });

        setSlots({
          current: Number(res.data?.current ?? 0),
          max: typeof res.data?.max === "number" ? res.data.max : null,
        });
      } catch (err: any) {
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

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        modelsLoadedRef.current = true;
      } catch (err) {
        setError("Biometric Engine failed.");
      }
    };

    loadModels();
  }, []);

  const detectFace = useCallback(async () => {
    if (faceScan || step !== 3 || !modelsLoadedRef.current) return;

    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectFace);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      const box = detection.detection.box;
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      setFaceStatus("stable");

      if (!captureTimerRef.current) {
        captureTimerRef.current = setTimeout(() => {
          const screenshot = webcamRef.current?.getScreenshot();
          if (screenshot) setFaceScan(screenshot);
          setFaceEmbedding(Array.from(detection.descriptor));
          setFaceStatus("success");
        }, 1500);
      }
    } else {
      setFaceStatus("no_face");
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
      captureTimerRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(detectFace);
  }, [faceScan, step]);

  useEffect(() => {
    if (step === 3 && !faceScan) detectFace();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (captureTimerRef.current) {
        clearTimeout(captureTimerRef.current);
      }
    };
  }, [step, faceScan, detectFace]);

  const handleSendOTP = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return setError("Enter a valid email address.");
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await api.post("/send-otp", {
        email: normalizedEmail,
      });

      if (res.data?.success) {
        setEmail(normalizedEmail);
        setOtpSent(true);
        setError(null);
      } else {
        setError(res.data?.error || "Failed to send OTP.");
      }
    } catch (err: any) {
      console.error("Send OTP Error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "OTP service failed.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!otpCode.trim()) {
      return setError("Enter the OTP code.");
    }

    setIsVerifying(true);
    setError(null);

    try {
      // 🚀 FIXED: Pointing to /bookings/verify-otp to prevent 404
      const res = await api.post("/verify-otp", {
        email: normalizedEmail,
        otp: otpCode.trim(),
      });

      if (res.data?.success) {
        setIsEmailVerified(true);
        setStep(1);
        setError(null);
      } else {
        setError("Invalid OTP Code.");
      }
    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid or expired OTP.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const submitBooking = async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      if (!isEmailVerified) throw new Error("Email verification is required.");
      if (!faceEmbedding || faceEmbedding.length === 0)
        throw new Error("Biometric face scan is required.");
      if (!idFront || !idBack)
        throw new Error("Both Front and Back ID images are required.");
      if (idStatusFront === "fake" || idStatusBack === "fake")
        throw new Error(
          "Document verification failed. Please upload a clear, valid ID.",
        );
      if (!idType) throw new Error("Please select an ID type from the list.");
      if (!bookingDate) throw new Error("Please select a valid date.");

      const payload = {
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        phoneNumber,
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
        actionBy: "Online Booking",
      };

      const response = await api.post("/bookings", payload);

      if (response.data?.success) {
        setBookingId(response.data.bookingId);
        setStep(4);
      }
    } catch (err: any) {
      console.error("REGISTRATION ERROR:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (val: string) => {
    const numbersOnly = val.replace(/\D/g, "");
    if (numbersOnly.length <= 11) {
      setPhoneNumber(numbersOnly);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const stepVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, scale: 1.05, transition: { duration: 0.3 } },
  };

  // --- UI START (DARK CYBER THEME) ---
  return (
    <div className="min-h-screen bg-[#001233] text-white font-sans selection:bg-[#FFD700]/30 selection:text-[#FFD700] relative overflow-x-hidden flex items-center justify-center p-4 lg:p-8">
      {/* --- HIGH-TECH ANIMATED BACKGROUND --- */}
      <motion.div
        animate={{ backgroundPosition: ["0px 0px", "100px 100px"] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-size-[3rem_3rem]"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#0038A8] rounded-full blur-[150px] pointer-events-none z-0"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-[#FFD700] rounded-full blur-[150px] pointer-events-none z-0"
      />

      {/* --- FLOATING CYBER ELEMENTS --- */}
      <motion.div
        animate={{ y: [-20, 20, -20], rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute top-20 right-20 w-32 h-32 border border-[#FFD700]/20 rounded-full border-dashed hidden lg:block z-0"
      />
      <motion.div
        animate={{ y: [20, -20, 20], rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute bottom-20 left-20 w-48 h-48 border border-[#0038A8]/40 rounded-full border-dotted hidden lg:block z-0"
      />

      <div className="w-full max-w-300 relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* --- LEFT PANEL: BRANDING (Animated) --- */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-5 text-center lg:text-left flex flex-col justify-center h-full pt-8 lg:pt-0"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-[0_0_30px_rgba(0,56,168,0.5)] mx-auto lg:mx-0"
          >
            <FiShield className="text-lg animate-pulse" /> Official RTU Online
            Booking
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-5xl lg:text-7xl font-black tracking-tighter text-white mb-4 uppercase leading-none"
          >
            Book <br className="hidden lg:block" />{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-[#FFD700]">
              Appointment
            </span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-blue-200 text-xs lg:text-sm font-bold uppercase tracking-[0.3em] leading-relaxed max-w-md mx-auto lg:mx-0"
          >
            Automated Identity Verification & Biometric Access Protocol
          </motion.p>

          {/* Decorative Terminal Box */}
          <motion.div
            variants={itemVariants}
            className="mt-10 p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-sm hidden lg:block max-w-sm"
          >
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-3">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-[10px] font-mono text-emerald-400 opacity-80 leading-relaxed">
              &gt; SYSTEM_READY
              <br />
              &gt; AWAITING_HANDSHAKE
              <br />
              &gt; ENCRYPTION: AES-256-GCM
              <br />
              &gt; <span className="animate-pulse">_</span>
            </p>
          </motion.div>
        </motion.div>

        {/* --- RIGHT PANEL: MAIN HUD CARD --- */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-7 w-full bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_80px_rgba(0,56,168,0.3)] overflow-hidden flex flex-col relative text-slate-800 border-4 border-white/20 backdrop-blur-xl min-h-150"
        >
          {/* STEPPER */}
          {step < 4 && (
            <div className="bg-slate-50 border-b border-slate-100 p-5 lg:p-6 flex justify-between items-center px-6 lg:px-12 shrink-0 relative">
              {["Auth", "Identity", "Logistics", "Clearance"].map(
                (label, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-3 relative z-10 w-1/4"
                  >
                    <div
                      className={`w-8 h-8 lg:w-10 lg:h-10 rounded-2xl flex items-center justify-center font-black text-[10px] lg:text-xs transition-all duration-500 shadow-sm ${
                        step > idx
                          ? "bg-[#0038A8] text-[#FFD700] shadow-[0_0_20px_rgba(0,56,168,0.4)] scale-110"
                          : step === idx
                            ? "bg-[#FFD700] text-[#0038A8] ring-4 ring-[#FFD700]/30 shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-110"
                            : "bg-white text-slate-300 border-2 border-slate-100"
                      }`}
                    >
                      {step > idx ? <FiCheck size={16} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[8px] lg:text-[9px] font-black uppercase tracking-widest hidden sm:block text-center transition-colors duration-500 ${step === idx ? "text-[#0038A8]" : "text-slate-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                ),
              )}
              <div className="absolute left-[15%] right-[15%] top-9 lg:top-11 h-1 bg-slate-100 -z-10 hidden sm:block rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#0038A8]"
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}

          <div className="p-6 md:p-8 lg:p-12 flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 border border-red-100 shadow-sm"
                >
                  <div className="p-1.5 bg-white rounded-lg shadow-sm text-red-500">
                    <FiAlertCircle size={16} />
                  </div>{" "}
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* === STEP 0: OTP === */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="max-w-sm mx-auto text-center space-y-6 w-full"
                >
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-[#0038A8] blur-xl rounded-full"
                    />
                    <div className="relative w-full h-full bg-linear-to-br from-[#0038A8] to-blue-900 rounded-4xl flex items-center justify-center shadow-xl border border-white/20 transform rotate-3">
                      <FiMail className="text-4xl text-[#FFD700]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter mb-1">
                      Secure Node
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Initiate Verification
                    </p>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4 text-left"
                  >
                    <motion.div variants={itemVariants}>
                      <Input
                        label="Email Address"
                        value={email}
                        onChange={setEmail}
                        icon={<FiMail />}
                        disabled={otpSent}
                        placeholder="student@rtu.edu.ph"
                      />
                    </motion.div>
                    {otpSent && (
                      <motion.div variants={itemVariants}>
                        <Input
                          label="6-Digit Auth Code"
                          value={otpCode}
                          onChange={setOtpCode}
                          icon={<FiHash />}
                          placeholder="------"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                    disabled={isVerifying || !email.trim()}
                    className="w-full py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(0,56,168,0.3)] hover:bg-[#002b82] flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                  >
                    {isVerifying ? (
                      <FiLoader className="animate-spin text-lg" />
                    ) : otpSent ? (
                      "Verify Signal"
                    ) : (
                      "Transmit Code"
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* === STEP 1: INFO === */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter">
                      Identity Matrix
                    </h3>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-5"
                  >
                    <div className="grid md:grid-cols-2 gap-5">
                      <motion.div variants={itemVariants}>
                        <Input
                          label="First Name"
                          value={firstName}
                          onChange={setFirstName}
                          icon={<FiUser />}
                          placeholder="Juan"
                        />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <Input
                          label="Last Name"
                          value={lastName}
                          onChange={setLastName}
                          icon={<FiUser />}
                          placeholder="Dela Cruz"
                        />
                      </motion.div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-5">
                      <motion.div variants={itemVariants}>
                        <Input
                          label="Mobile Network"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          icon={<FiPhone />}
                          placeholder="09XXXXXXXXX"
                        />
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                        className="space-y-1.5 w-full text-left group"
                      >
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 transition-colors group-focus-within:text-[#0038A8]">
                          Visitor Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-[#0038A8]/10 focus:bg-white transition-all font-bold text-sm cursor-pointer appearance-none"
                        >
                          <option value="">Select Classification...</option>
                          <option value="Student">Student</option>
                          <option value="Alumni">Alumni</option>
                          <option value="Parent/Guardian">
                            Parent/Guardian
                          </option>
                          <option value="Supplier">Supplier</option>
                          <option value="Applicant Student">
                            Applicant Student
                          </option>
                          <option value="Applicant Employee">
                            Applicant Employee
                          </option>
                          <option value="Guest">Guest</option>
                          <option value="Merchant">Merchant</option>
                        </select>
                      </motion.div>
                    </div>
                  </motion.div>
                  <div className="pt-6 border-t border-slate-100 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(2)}
                      disabled={
                        !firstName ||
                        !lastName ||
                        !category ||
                        !/^09\d{9}$/.test(phoneNumber)
                      }
                      className="w-full md:w-auto md:float-right px-10 py-4 bg-[#0038A8] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.3)] transition-all hover:bg-[#FFD700] hover:text-[#0038A8] disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      Engage Step 2 <FiArrowRight size={16} />
                    </motion.button>
                    <div className="clear-both" />
                  </div>
                </motion.div>
              )}

              {/* === STEP 2: LOGISTICS === */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter">
                      Routing Protocol
                    </h3>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-6"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <motion.div
                        variants={itemVariants}
                        className="space-y-1.5 w-full text-left group"
                      >
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 transition-colors group-focus-within:text-[#0038A8]">
                          Target Facility
                        </label>
                        <select
                          value={office}
                          onChange={(e) => {
                            setOffice(e.target.value);
                            setBookingDate("");
                            setSlots({ current: 0, max: null });
                          }}
                          className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-[#0038A8]/10 focus:bg-white transition-all font-bold text-sm cursor-pointer appearance-none"
                        >
                          <option value="">Select Target...</option>
                          {offices.map((off) => (
                            <option key={off._id} value={off.name}>
                              {off.name}
                            </option>
                          ))}
                        </select>
                      </motion.div>
                      <motion.div
                        variants={itemVariants}
                        className={`transition-all ${!office ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                      >
                        <Input
                          label="Extraction Date"
                          type="date"
                          value={bookingDate}
                          onChange={setBookingDate}
                          icon={<FiCalendar />}
                          min={today}
                          onClick={(e: any) => {
                            if (e.target.showPicker) e.target.showPicker();
                          }}
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      variants={itemVariants}
                      className={`transition-all ${!bookingDate ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                    >
                      <div className="bg-[#001233] rounded-4xl p-5 border-2 border-blue-900 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[10px_10px]"></div>
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="p-3 bg-[#0038A8] rounded-xl text-[#FFD700] shadow-[0_0_15px_rgba(0,56,168,0.8)]">
                            <FiCpu size={24} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em]">
                              Node Capacity
                            </p>
                            <p className="text-white font-bold tracking-wide mt-0.5 text-sm">
                              Live Network Ping
                            </p>
                          </div>
                        </div>
                        <div className="relative z-10 flex items-center gap-4 bg-black/40 px-5 py-2.5 rounded-xl border border-white/10">
                          {isValidating ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD700] flex items-center gap-2">
                              <FiLoader className="animate-spin" /> Querying...
                            </span>
                          ) : (
                            <>
                              <div className="flex flex-col text-right">
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                  Status
                                </span>
                                <span
                                  className={`text-xs font-black uppercase ${slots.max === 0 ? "text-red-500" : slots.max !== null && slots.current >= slots.max ? "text-amber-500" : "text-emerald-400"}`}
                                >
                                  {slots.max === 0
                                    ? "NODE OFFLINE"
                                    : slots.max !== null &&
                                        slots.current >= slots.max
                                      ? "CAPACITY REACHED"
                                      : `${slots.current} / ${slots.max} SLOTS`}
                                </span>
                              </div>
                              <div
                                className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${slots.max === 0 ? "bg-red-500 text-red-500" : slots.max !== null && slots.current >= slots.max ? "bg-amber-500 text-amber-500" : "bg-emerald-500 text-emerald-500 animate-pulse"}`}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={itemVariants}
                      className={`transition-all ${!bookingDate || isValidating || slots.max === 0 ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                    >
                      <Input
                        label="Operation Objective"
                        value={purpose}
                        onChange={setPurpose}
                        placeholder="State explicit reason for entry..."
                      />
                    </motion.div>
                  </motion.div>

                  <div className="flex gap-4 pt-6 border-t border-slate-100">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(1)}
                      className="px-6 md:px-8 py-4 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-500 rounded-[1.25rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all"
                    >
                      Abort
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(3)}
                      disabled={
                        isValidating ||
                        !bookingDate ||
                        !office ||
                        !purpose ||
                        slots.max === 0 ||
                        (slots.max !== null && slots.current >= slots.max)
                      }
                      className="flex-1 py-4 bg-[#0038A8] text-[#FFD700] rounded-[1.25rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(0,56,168,0.3)] hover:bg-[#002b82] disabled:opacity-30 flex items-center justify-center gap-3"
                    >
                      Initialize Biometrics
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* === STEP 3: BIOMETRICS & ID VERIFICATION === */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl md:text-3xl font-black text-[#0038A8] uppercase tracking-tighter flex items-center justify-center gap-3">
                      <FiCrosshair className="text-[#FFD700]" /> Verification
                      Engine
                    </h3>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* LEFT: FACIAL SCANNER */}
                    <div className="space-y-4">
                      <div className="relative aspect-4/3 bg-[#001233] rounded-4xl overflow-hidden shadow-2xl border-[6px] border-[#0038A8]/30 group">
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />

                        {!faceScan ? (
                          <>
                            <Webcam
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              className="w-full h-full object-cover scale-x-[-1] opacity-90"
                            />
                            <canvas
                              ref={canvasRef}
                              className="absolute inset-0 w-full h-full pointer-events-none z-10"
                            />
                            {/* Scanning Laser */}
                            <motion.div
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="absolute left-0 right-0 h-1 bg-[#FFD700]/50 shadow-[0_0_15px_#FFD700] z-20"
                            />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest bg-black/80 backdrop-blur-md text-[#FFD700] border border-[#FFD700]/30 z-30">
                              Align Face in Grid
                            </div>
                          </>
                        ) : (
                          <div className="relative h-full w-full">
                            <img
                              src={faceScan}
                              className="w-full h-full object-cover grayscale contrast-125"
                            />
                            <div className="absolute inset-0 bg-[#0038A8]/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <FiCheckCircle className="text-5xl text-[#FFD700] drop-shadow-[0_0_30px_rgba(255,215,0,1)] mb-2" />
                              </motion.div>
                              <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">
                                Vector Captured
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setFaceScan(null);
                                setFaceEmbedding(null);
                                setFaceStatus("no_face");
                                detectFace();
                              }}
                              className="absolute top-3 right-3 p-2.5 bg-white text-[#0038A8] rounded-xl shadow-xl hover:bg-[#FFD700] transition-colors z-30"
                            >
                              <FiRefreshCw size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: ID FORGERY SCANNER */}
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 w-full text-left group">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                            ID Class
                          </label>
                          <select
                            value={idCategory}
                            onChange={(e) => {
                              setIdCategory(e.target.value);
                              setIdType("");
                            }}
                            className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-700 outline-none focus:border-[#0038A8] text-xs font-bold appearance-none cursor-pointer"
                          >
                            <option value="Primary">Primary ID</option>
                            <option value="Secondary">Secondary ID</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 w-full text-left group">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">
                            Document Type
                          </label>
                          <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value)}
                            className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-700 outline-none focus:border-[#0038A8] text-xs font-bold appearance-none cursor-pointer"
                          >
                            <option value="">Select ID...</option>
                            {(idCategory === "Primary"
                              ? idOptions.Primary
                              : idOptions.Secondary
                            ).map((id) => (
                              <option key={id} value={id}>
                                {id}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* DOCUMENT UPLOAD ZONES with Laser */}
                      <div
                        className={`grid grid-cols-2 gap-4 transition-all ${!idType ? "opacity-30 pointer-events-none" : "opacity-100"}`}
                      >
                        <div
                          className={`relative h-32 bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer ${idStatusFront === "fake" ? "border-red-400 bg-red-50" : idStatusFront === "valid" ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-[#0038A8]"}`}
                        >
                          {idStatusFront === "scanning" && (
                            <motion.div
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="absolute left-0 right-0 h-1 bg-[#0038A8] shadow-[0_0_10px_#0038A8] z-20"
                            />
                          )}
                          {idFront ? (
                            <>
                              <img
                                src={idFront}
                                className="w-full h-full object-cover opacity-50"
                              />
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                {idStatusFront === "scanning" ? (
                                  <FiLoader className="text-[#0038A8] text-2xl animate-spin drop-shadow-md" />
                                ) : idStatusFront === "fake" ? (
                                  <FiAlertTriangle className="text-red-600 text-3xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                                ) : (
                                  <FiCheckCircle className="text-emerald-600 text-3xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <FiImage className="text-slate-300 text-3xl mb-1 group-hover:text-[#0038A8]" />
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest text-center px-2">
                                Upload Front
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer z-30"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const base64 = await fileToBase64(file);
                                setIdFront(base64);
                                handleOcr(base64, "front");
                              }
                            }}
                          />
                        </div>

                        <div
                          className={`relative h-32 bg-slate-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer ${idStatusBack === "fake" ? "border-red-400 bg-red-50" : idStatusBack === "valid" ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-[#0038A8]"}`}
                        >
                          {idStatusBack === "scanning" && (
                            <motion.div
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="absolute left-0 right-0 h-1 bg-[#0038A8] shadow-[0_0_10px_#0038A8] z-20"
                            />
                          )}
                          {idBack ? (
                            <>
                              <img
                                src={idBack}
                                className="w-full h-full object-cover opacity-50"
                              />
                              <div className="absolute inset-0 flex items-center justify-center z-10">
                                {idStatusBack === "scanning" ? (
                                  <FiLoader className="text-[#0038A8] text-2xl animate-spin drop-shadow-md" />
                                ) : idStatusBack === "fake" ? (
                                  <FiAlertTriangle className="text-red-600 text-3xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                                ) : (
                                  <FiCheckCircle className="text-emerald-600 text-3xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <FiImage className="text-slate-300 text-3xl mb-1 group-hover:text-[#0038A8]" />
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest text-center px-2">
                                Upload Back
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer z-30"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const base64 = await fileToBase64(file);
                                setIdBack(base64);
                                handleOcr(base64, "back");
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* AI FORGERY TERMINAL */}
                      <div className="bg-[#001233] p-4 rounded-2xl border-2 border-slate-800 shadow-xl flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[10px_10px] opacity-30"></div>
                        <div className="flex justify-between items-center mb-2 border-b border-blue-900 pb-2 relative z-10">
                          <span className="text-[8px] font-black text-blue-300 uppercase tracking-[0.3em] flex items-center gap-1.5">
                            <FiCpu size={12} className="text-[#FFD700]" />{" "}
                            Forgery Analysis
                          </span>
                          {(idStatusFront === "scanning" ||
                            idStatusBack === "scanning") && (
                            <FiLoader className="text-[#FFD700] animate-spin text-xs" />
                          )}
                        </div>

                        <div className="space-y-2 relative z-10">
                          <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-white/5">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                              Front Image Scan
                            </span>
                            {idStatusFront === "idle" ? (
                              <span className="text-[7px] text-slate-500 font-mono">
                                AWAITING UPLOAD
                              </span>
                            ) : idStatusFront === "scanning" ? (
                              <span className="text-[7px] text-[#FFD700] font-mono animate-pulse">
                                ANALYZING WATERMARKS...
                              </span>
                            ) : idStatusFront === "fake" ? (
                              <span className="text-[8px] text-red-500 font-black tracking-widest uppercase bg-red-500/20 px-2 py-0.5 rounded">
                                Forgery Detected
                              </span>
                            ) : (
                              <span className="text-[8px] text-emerald-400 font-black tracking-widest uppercase bg-emerald-400/20 px-2 py-0.5 rounded">
                                Verified Authentic
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg border border-white/5">
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                              Back Image Scan
                            </span>
                            {idStatusBack === "idle" ? (
                              <span className="text-[7px] text-slate-500 font-mono">
                                AWAITING UPLOAD
                              </span>
                            ) : idStatusBack === "scanning" ? (
                              <span className="text-[7px] text-[#FFD700] font-mono animate-pulse">
                                ANALYZING BARCODES...
                              </span>
                            ) : idStatusBack === "fake" ? (
                              <span className="text-[8px] text-red-500 font-black tracking-widest uppercase bg-red-500/20 px-2 py-0.5 rounded">
                                Suspicious / Unverified
                              </span>
                            ) : (
                              <span className="text-[8px] text-emerald-400 font-black tracking-widest uppercase bg-emerald-400/20 px-2 py-0.5 rounded">
                                Verified Authentic
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-5 border-t border-slate-100">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep(2)}
                      className="px-6 md:px-8 py-4 border-2 border-slate-200 rounded-[1.25rem] text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                    >
                      Abort
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={submitBooking}
                      disabled={
                        loading ||
                        !faceScan ||
                        !idFront ||
                        !idBack ||
                        idStatusFront === "fake" ||
                        idStatusBack === "fake" ||
                        !idType
                      }
                      className="flex-1 py-4 bg-[#0038A8] text-[#FFD700] rounded-[1.25rem] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.3)] hover:bg-[#002b82] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        <>
                          <FiShield size={16} /> Finalize Security Protocol
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* === STEP 4: DIGITAL PASS === */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="py-4"
                >
                  <div className="w-full max-w-sm mx-auto bg-white rounded-[2.5rem] shadow-[0_0_80px_rgba(0,56,168,0.2)] border-4 border-slate-50 overflow-hidden relative">
                    <div className="bg-[#001233] pt-10 pb-10 px-8 text-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-[#FFD700]" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="w-14 h-14 bg-[#0038A8] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#FFD700]/30 shadow-[0_0_30px_rgba(0,56,168,0.8)] text-[#FFD700] relative z-10"
                      >
                        <FiCheck size={28} strokeWidth={3} />
                      </motion.div>
                      <h2 className="text-white font-black text-xl uppercase tracking-widest leading-tight relative z-10">
                        Clearance Granted
                      </h2>
                      <p className="text-blue-300 text-[9px] font-black uppercase tracking-[0.3em] mt-1.5 relative z-10">
                        Encrypted Digital Pass
                      </p>
                    </div>

                    <div className="px-8 pb-6 pt-5 bg-white text-center -mt-6 rounded-t-3xl relative z-10">
                      <h3 className="text-2xl font-black text-[#0038A8] uppercase tracking-tighter mb-1">
                        {firstName} {lastName}
                      </h3>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full inline-block mb-6 border border-slate-200">
                        {category}{" "}
                        <span className="text-[#FFD700] mx-2">•</span> {office}
                      </p>

                      <div className="bg-white border-4 border-[#0038A8] p-3 rounded-2xl inline-block shadow-[0_10px_30px_rgba(0,56,168,0.15)] mb-3">
                        <QRCodeSVG
                          value={bookingId || "error"}
                          size={140}
                          className="rounded-xl"
                        />
                      </div>
                      <p className="font-mono font-black text-[#0038A8] text-base tracking-[0.2em]">
                        #
                        {bookingId
                          ? bookingId.slice(-6).toUpperCase()
                          : "XXXXXX"}
                      </p>
                    </div>

                    <div className="relative h-10 flex items-center justify-center bg-white">
                      <div className="absolute w-8 h-8 bg-[#F8FAFC] rounded-full -left-4 shadow-inner border-r border-slate-200" />
                      <div className="absolute w-8 h-8 bg-[#F8FAFC] rounded-full -right-4 shadow-inner border-l border-slate-200" />
                      <div className="w-full h-px border-t-4 border-dashed border-slate-200 mx-6" />
                    </div>

                    <div className="bg-slate-50 p-6 flex justify-between items-center px-8">
                      <div className="text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                          Authorized Date
                        </span>
                        <span className="text-xs font-black text-[#0038A8]">
                          {bookingDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                          Pass Status
                        </span>
                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md uppercase tracking-widest border border-emerald-200 shadow-sm">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-6 mb-5">
                    Scan QR at the Main Gate Terminal
                  </p>

                  <div className="flex justify-center gap-3 max-w-sm mx-auto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={downloadQR}
                      className="flex-1 py-4 bg-white border-2 border-slate-200 text-[#0038A8] hover:border-[#0038A8] rounded-[1.25rem] font-black uppercase text-[9px] tracking-widest transition-all shadow-sm flex justify-center items-center gap-2"
                    >
                      <FiDownload size={14} /> Save Image
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={printQR}
                      className="flex-1 py-4 bg-[#0038A8] text-[#FFD700] rounded-[1.25rem] font-black uppercase text-[9px] tracking-widest transition-all shadow-[0_10px_20px_rgba(0,56,168,0.3)] hover:bg-[#002b82] flex justify-center items-center gap-2"
                    >
                      <FiPrinter size={14} /> Print Pass
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/* CUSTOM THEMED INPUT */
const Input = ({
  label,
  icon,
  onChange,
  type = "text",
  maxLength,
  disabled,
  ...props
}: any) => (
  <div
    className={`space-y-1.5 w-full text-left group ${disabled ? "opacity-50 pointer-events-none" : ""}`}
  >
    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 transition-colors group-focus-within:text-[#0038A8]">
      {label}
    </label>
    <div className="relative">
      <input
        {...props}
        type={type}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#0038A8] focus:ring-4 focus:ring-[#0038A8]/10 focus:bg-white outline-none text-xs font-bold text-slate-800 transition-all placeholder:text-slate-300"
      />
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#0038A8] transition-colors text-lg">
          {icon}
        </span>
      )}
    </div>
  </div>
);

export default BookAppointment;
