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

if (!API_URL) console.error("Missing VITE_API_URL in production");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

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

  // OCR & Verification State
  const [ocrFront, setOcrFront] = useState("");
  const [ocrBack, setOcrBack] = useState("");
  const [idStatusFront, setIdStatusFront] = useState<IDStatus>("idle");
  const [idStatusBack, setIdStatusBack] = useState<IDStatus>("idle");

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

  // --- PRINTER / DOWNLOAD LOGIC ---
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
      alert("Download failed due to network settings.");
    }
  };

  const printQR = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Print Access Pass</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 40px; color: #1e293b; }
              .card { border: 3px dashed #0038A8; padding: 40px; display: inline-block; border-radius: 20px; max-width: 400px; margin: 0 auto; }
              h1 { color: #0038A8; margin-bottom: 5px; font-weight: 900; letter-spacing: 2px; font-size: 32px; }
              h3 { color: #475569; margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
              .details { margin-top: 20px; text-align: left; background: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; }
              .details p { margin: 8px 0; font-size: 14px; font-weight: bold; }
              .details span { color: #0038A8; }
              .id-text { font-family: monospace; font-size: 28px; font-weight: bold; color: #0038A8; margin-top: 25px; letter-spacing: 2px; background: #eff6ff; padding: 10px; border-radius: 10px; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="card">
               <h1>UNIVENTRY</h1><h3>Digital Access Pass</h3>
               <div class="details">
                  <p>Name: <span>${firstName} ${lastName}</span></p>
                  <p>Destination: <span>${office}</span></p>
                  <p>Category: <span>${category}</span></p>
                  <p>Date: <span>${bookingDate}</span></p>
               </div>
               <img src="${qrUrl}" style="width: 250px; height: 250px; margin-top: 25px; border-radius: 10px;" onload="setTimeout(() => { window.print(); window.close(); }, 500);" />
               <br /><p class="id-text">#${bookingId ? bookingId.slice(-6).toUpperCase() : "XXXXXX"}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // --- AI FORGERY DETECTION LOGIC ---
  const verifyDocumentAuthenticity = (
    text: string,
    idTypeStr: string,
  ): IDStatus => {
    const upperText = text.toUpperCase();
    // Baseline Philippine ID Watermarks
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
      ];

    // Count matches
    const baseMatches = baselineMarkers.filter((m) =>
      upperText.includes(m),
    ).length;
    const specificMatches = specificMarkers.filter((m) =>
      upperText.includes(m),
    ).length;

    // Heuristic: Must have at least 1 specific marker, OR at least 2 general government markers
    if (specificMatches >= 1 || baseMatches >= 2) return "valid";
    return "fake";
  };

  const handleOcr = async (image: string, side: "front" | "back") => {
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
        // Back of ID doesn't always have markers, so we are a bit more lenient, but still check
        setIdStatusBack(
          text.length > 10 ? verifyDocumentAuthenticity(text, idType) : "fake",
        );
      }
      await worker.terminate();
    } catch (err) {
      console.error("OCR Error:", err);
      if (side === "front") setIdStatusFront("fake");
      else setIdStatusBack("fake");
    }
  };

  // --- INITIAL DATA FETCHING ---
  useEffect(() => {
    api
      .get("/offices")
      .then((res) => setOffices(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!bookingDate || !office) {
      setSlots({ current: 0, max: null });
      return;
    }
    setIsValidating(true);
    setError(null);
    api
      .get("/offices/slots", {
        params: { date: bookingDate, office: office.trim() },
      })
      .then((res) =>
        setSlots({
          current: Number(res.data?.current ?? 0),
          max: typeof res.data?.max === "number" ? res.data.max : null,
        }),
      )
      .catch((err) => {
        setSlots({ current: 0, max: null });
        setError(
          err?.response?.data?.error || "Failed to check office availability.",
        );
      })
      .finally(() => setIsValidating(false));
  }, [bookingDate, office]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        modelsLoadedRef.current = true;
      } catch (err) {}
    };
    loadModels();
  }, []);

  const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

  // --- FACE SCANNER ---
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
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    };
  }, [step, faceScan, detectFace]);

  // --- HANDLERS ---
  const handleSendOTP = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@"))
      return setError("Enter a valid email address.");
    setIsVerifying(true);
    setError(null);
    try {
      const res = await api.post("/send-otp", { email: normalizedEmail });
      if (res.data?.success) {
        setEmail(normalizedEmail);
        setOtpSent(true);
      } else setError(res.data?.error || "Failed to send OTP.");
    } catch (err: any) {
      setError(err.response?.data?.message || "OTP service failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) return setError("Enter the OTP code.");
    setIsVerifying(true);
    setError(null);
    try {
      const res = await api.post("/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: otpCode.trim(),
      });
      if (res.data?.success) {
        setIsEmailVerified(true);
        setStep(1);
      } else setError("Invalid OTP Code.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setIsVerifying(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

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
      setError(
        err.response?.data?.error || err.message || "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const stepVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-[#001233] text-white p-4 md:p-8 font-sans selection:bg-[#FFD700]/30 selection:text-[#FFD700] relative overflow-x-hidden flex items-center justify-center">
      {/* --- HIGH-TECH BACKGROUND MESH --- */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#0038A8]/40 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FFD700]/10 rounded-full blur-[150px] pointer-events-none" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col items-center">
        {/* --- BRANDING --- */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[#FFD700] text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-[0_0_30px_rgba(0,56,168,0.5)]">
            <FiShield className="text-lg" /> Official RTU Security Node
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2 uppercase leading-[1.1]">
            Public{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0038A8] to-[#FFD700]">
              Clearance
            </span>
          </h1>
          <p className="text-blue-200 text-xs font-black uppercase tracking-[0.3em]">
            Automated Identity Verification
          </p>
        </div>

        {/* --- MAIN HUD CARD --- */}
        <div className="w-full bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_80px_rgba(0,56,168,0.2)] overflow-hidden flex flex-col relative text-slate-800 border-4 border-white/20 backdrop-blur-xl">
          {/* STEPPER */}
          {step < 4 && (
            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center px-8 md:px-16 shrink-0 relative">
              {["Auth", "Identity", "Logistics", "Clearance"].map(
                (label, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-3 relative z-10 w-1/4"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all duration-500 shadow-sm ${
                        step > idx
                          ? "bg-[#0038A8] text-[#FFD700] shadow-[0_0_20px_rgba(0,56,168,0.4)]"
                          : step === idx
                            ? "bg-[#FFD700] text-[#0038A8] ring-4 ring-[#FFD700]/30 shadow-[0_0_20px_rgba(255,215,0,0.4)]"
                            : "bg-white text-slate-300 border-2 border-slate-100"
                      }`}
                    >
                      {step > idx ? <FiCheck size={18} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest hidden md:block text-center ${step === idx ? "text-[#0038A8]" : "text-slate-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                ),
              )}
              <div className="absolute left-[15%] right-[15%] top-11 h-1 bg-slate-100 -z-10 hidden md:block rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#0038A8] transition-all duration-500"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="p-6 md:p-12 flex-1">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3 border border-red-100 shadow-sm"
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
                  className="max-w-md mx-auto text-center space-y-8 py-4"
                >
                  <div className="relative w-28 h-28 mx-auto">
                    <div className="absolute inset-0 bg-[#0038A8] blur-2xl opacity-40 rounded-full animate-pulse" />
                    <div className="relative w-full h-full bg-gradient-to-br from-[#0038A8] to-blue-900 rounded-[2rem] flex items-center justify-center shadow-xl border border-white/20 transform rotate-3">
                      <FiMail className="text-5xl text-[#FFD700]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter mb-2">
                      Secure Node
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Initiate Email Verification
                    </p>
                  </div>
                  <div className="space-y-5 text-left">
                    <Input
                      label="Email Address"
                      value={email}
                      onChange={setEmail}
                      icon={<FiMail />}
                      disabled={otpSent}
                      placeholder="student@rtu.edu.ph"
                    />
                    {otpSent && (
                      <Input
                        label="6-Digit Auth Code"
                        value={otpCode}
                        onChange={setOtpCode}
                        icon={<FiHash />}
                        placeholder="------"
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                      disabled={isVerifying || !email.trim()}
                      className="w-full py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(0,56,168,0.3)] hover:bg-[#002b82] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                      {isVerifying ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : otpSent ? (
                        "Verify Signal"
                      ) : (
                        "Transmit Code"
                      )}
                    </button>
                  </div>
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
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter">
                      Identity Matrix
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                      Register Personal Data
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      value={firstName}
                      onChange={setFirstName}
                      icon={<FiUser />}
                      placeholder="Juan"
                    />
                    <Input
                      label="Last Name"
                      value={lastName}
                      onChange={setLastName}
                      icon={<FiUser />}
                      placeholder="Dela Cruz"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Input
                      label="Mobile Network"
                      value={phoneNumber}
                      onChange={(v: string) =>
                        setPhoneNumber(v.replace(/\D/g, "").slice(0, 11))
                      }
                      icon={<FiPhone />}
                      placeholder="09XXXXXXXXX"
                    />
                    <div className="space-y-1.5 w-full text-left group">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 transition-colors group-focus-within:text-[#0038A8]">
                        Clearance Level
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-[#0038A8]/10 focus:bg-white transition-all font-bold text-sm cursor-pointer appearance-none"
                      >
                        <option value="">Select Designation...</option>
                        <option value="Student">Student</option>
                        <option value="Alumni">Alumni</option>
                        <option value="Guest">Guest / Supplier</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 mt-8">
                    <button
                      onClick={() => setStep(2)}
                      disabled={
                        !firstName ||
                        !lastName ||
                        !category ||
                        !/^09\d{9}$/.test(phoneNumber)
                      }
                      className="w-full md:w-auto md:float-right px-10 py-5 bg-[#0038A8] text-white rounded-[1.25rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.3)] transition-all hover:bg-[#FFD700] hover:text-[#0038A8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                    >
                      Engage Step 2 <FiArrowRight size={16} />
                    </button>
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
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter">
                      Routing Protocol
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                      Select Target Node & Time
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-1.5 w-full text-left group">
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
                    </div>
                    <div
                      className={`transition-all ${!office ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                    >
                      <Input
                        label="Extraction Date"
                        type="date"
                        value={bookingDate}
                        onChange={setBookingDate}
                        icon={<FiCalendar />}
                        min={today}
                        onClick={(e: any) => e.currentTarget.showPicker()}
                      />
                    </div>
                  </div>

                  <div
                    className={`transition-all ${!bookingDate ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                  >
                    <div className="bg-[#001233] rounded-[2rem] p-6 border-2 border-blue-900 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-[#0038A8] rounded-xl text-[#FFD700] shadow-[0_0_15px_rgba(0,56,168,0.8)]">
                          <FiCpu size={24} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-blue-200 uppercase tracking-[0.2em]">
                            Node Capacity
                          </p>
                          <p className="text-white font-bold tracking-wide mt-1">
                            Live Network Ping
                          </p>
                        </div>
                      </div>
                      <div className="relative z-10 flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/10">
                        {isValidating ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#FFD700] flex items-center gap-2">
                            <FiLoader className="animate-spin" /> Querying
                            Array...
                          </span>
                        ) : (
                          <>
                            <div className="flex flex-col text-right">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                Status
                              </span>
                              <span
                                className={`text-sm font-black uppercase ${slots.max === 0 ? "text-red-500" : slots.max !== null && slots.current >= slots.max ? "text-amber-500" : "text-emerald-400"}`}
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
                              className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${slots.max === 0 ? "bg-red-500 text-red-500" : slots.max !== null && slots.current >= slots.max ? "bg-amber-500 text-amber-500" : "bg-emerald-500 text-emerald-500 animate-pulse"}`}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`transition-all ${!bookingDate || isValidating || slots.max === 0 ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                  >
                    <Input
                      label="Operation Objective"
                      value={purpose}
                      onChange={setPurpose}
                      placeholder="State explicit reason for entry..."
                    />
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-slate-100">
                    <button
                      onClick={() => setStep(1)}
                      className="px-8 py-5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-500 rounded-[1.25rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95"
                    >
                      Abort
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={
                        isValidating ||
                        !bookingDate ||
                        !office ||
                        !purpose ||
                        slots.max === 0 ||
                        (slots.max !== null && slots.current >= slots.max)
                      }
                      className="flex-1 py-5 bg-[#0038A8] text-[#FFD700] rounded-[1.25rem] font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(0,56,168,0.3)] hover:bg-[#002b82] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      Initialize Biometrics
                    </button>
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
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h3 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter flex items-center justify-center gap-3">
                      <FiCrosshair className="text-[#FFD700]" /> AI Verification
                      Engine
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                      Facial & Document Forgery Analysis
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10 items-start">
                    {/* LEFT: FACIAL SCANNER */}
                    <div className="space-y-4">
                      <div className="relative aspect-4/3 bg-[#001233] rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-[#0038A8]/30 group">
                        <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />

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
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/80 backdrop-blur-md text-[#FFD700] border border-[#FFD700]/30 z-20 shadow-lg">
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
                              <FiCheckCircle className="text-6xl text-[#FFD700] drop-shadow-[0_0_30px_rgba(255,215,0,1)] mb-4" />
                              <p className="text-white font-black uppercase tracking-[0.3em] text-xs">
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
                              className="absolute top-4 right-4 p-3 bg-white text-[#0038A8] rounded-2xl shadow-xl hover:bg-[#FFD700] transition-colors z-30"
                            >
                              <FiRefreshCw size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT: ID FORGERY SCANNER */}
                    <div className="space-y-6">
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
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 outline-none focus:border-[#0038A8] text-xs font-bold appearance-none cursor-pointer"
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
                            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 outline-none focus:border-[#0038A8] text-xs font-bold appearance-none cursor-pointer"
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

                      {/* DOCUMENT UPLOAD ZONES */}
                      <div
                        className={`grid grid-cols-2 gap-4 transition-all ${!idType ? "opacity-30 pointer-events-none" : "opacity-100"}`}
                      >
                        {/* FRONT UPLOAD */}
                        <div
                          className={`relative h-40 bg-slate-50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer ${idStatusFront === "fake" ? "border-red-400 bg-red-50" : idStatusFront === "valid" ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-[#0038A8]"}`}
                        >
                          {idFront ? (
                            <>
                              <img
                                src={idFront}
                                className="w-full h-full object-cover opacity-50"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                {idStatusFront === "scanning" ? (
                                  <FiLoader className="text-[#0038A8] text-3xl animate-spin drop-shadow-md" />
                                ) : idStatusFront === "fake" ? (
                                  <FiAlertTriangle className="text-red-600 text-4xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                                ) : (
                                  <FiCheckCircle className="text-emerald-600 text-4xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <FiImage className="text-slate-300 text-4xl mb-2 group-hover:text-[#0038A8]" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center px-4">
                                Upload Front
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
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

                        {/* BACK UPLOAD */}
                        <div
                          className={`relative h-40 bg-slate-50 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center overflow-hidden group transition-all cursor-pointer ${idStatusBack === "fake" ? "border-red-400 bg-red-50" : idStatusBack === "valid" ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-[#0038A8]"}`}
                        >
                          {idBack ? (
                            <>
                              <img
                                src={idBack}
                                className="w-full h-full object-cover opacity-50"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                {idStatusBack === "scanning" ? (
                                  <FiLoader className="text-[#0038A8] text-3xl animate-spin drop-shadow-md" />
                                ) : idStatusBack === "fake" ? (
                                  <FiAlertTriangle className="text-red-600 text-4xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                                ) : (
                                  <FiCheckCircle className="text-emerald-600 text-4xl drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <FiImage className="text-slate-300 text-4xl mb-2 group-hover:text-[#0038A8]" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest text-center px-4">
                                Upload Back
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
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
                      <div className="bg-[#001233] p-5 rounded-3xl border-[4px] border-slate-800 shadow-2xl flex flex-col relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px] opacity-30"></div>
                        <div className="flex justify-between items-center mb-3 border-b border-blue-900 pb-3 relative z-10">
                          <span className="text-[9px] font-black text-blue-300 uppercase tracking-[0.3em] flex items-center gap-2">
                            <FiCpu size={14} className="text-[#FFD700]" />{" "}
                            Forgery Analysis
                          </span>
                          {(idStatusFront === "scanning" ||
                            idStatusBack === "scanning") && (
                            <FiLoader className="text-[#FFD700] animate-spin text-sm" />
                          )}
                        </div>

                        <div className="space-y-3 relative z-10">
                          {/* Front Status */}
                          <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              Front Image Scan
                            </span>
                            {idStatusFront === "idle" ? (
                              <span className="text-[8px] text-slate-500 font-mono">
                                AWAITING UPLOAD
                              </span>
                            ) : idStatusFront === "scanning" ? (
                              <span className="text-[8px] text-[#FFD700] font-mono animate-pulse">
                                ANALYZING WATERMARKS...
                              </span>
                            ) : idStatusFront === "fake" ? (
                              <span className="text-[9px] text-red-500 font-black tracking-widest uppercase bg-red-500/20 px-2 py-1 rounded">
                                Forgery Detected
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-400 font-black tracking-widest uppercase bg-emerald-400/20 px-2 py-1 rounded">
                                Verified Authentic
                              </span>
                            )}
                          </div>
                          {/* Back Status */}
                          <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              Back Image Scan
                            </span>
                            {idStatusBack === "idle" ? (
                              <span className="text-[8px] text-slate-500 font-mono">
                                AWAITING UPLOAD
                              </span>
                            ) : idStatusBack === "scanning" ? (
                              <span className="text-[8px] text-[#FFD700] font-mono animate-pulse">
                                ANALYZING BARCODES...
                              </span>
                            ) : idStatusBack === "fake" ? (
                              <span className="text-[9px] text-red-500 font-black tracking-widest uppercase bg-red-500/20 px-2 py-1 rounded">
                                Suspicious / Unverified
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-400 font-black tracking-widest uppercase bg-emerald-400/20 px-2 py-1 rounded">
                                Verified Authentic
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => setStep(2)}
                      className="px-8 py-5 border-2 border-slate-200 rounded-[1.25rem] text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Abort
                    </button>
                    <button
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
                      className="flex-1 py-5 bg-[#0038A8] text-[#FFD700] rounded-[1.25rem] font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_30px_rgba(0,56,168,0.3)] hover:bg-[#002b82] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                    >
                      {loading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        <>
                          <FiShield size={18} /> Finalize Security Protocol
                        </>
                      )}
                    </button>
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
                  <div className="w-full max-w-md mx-auto bg-white rounded-[3rem] shadow-[0_0_80px_rgba(0,56,168,0.2)] border-4 border-slate-50 overflow-hidden relative">
                    <div className="bg-[#001233] pt-12 pb-12 px-8 text-center relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                      <div className="absolute top-0 left-0 w-full h-2 bg-[#FFD700]" />
                      <div className="w-16 h-16 bg-[#0038A8] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FFD700]/30 shadow-[0_0_30px_rgba(0,56,168,0.8)] text-[#FFD700] relative z-10">
                        <FiCheck size={32} strokeWidth={3} />
                      </div>
                      <h2 className="text-white font-black text-2xl uppercase tracking-widest leading-tight relative z-10">
                        Clearance Granted
                      </h2>
                      <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.3em] mt-2 relative z-10">
                        Encrypted Digital Pass
                      </p>
                    </div>

                    <div className="px-8 pb-8 pt-6 bg-white text-center -mt-6 rounded-t-3xl relative z-10">
                      <h3 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter mb-1">
                        {firstName} {lastName}
                      </h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full inline-block mb-8 border border-slate-200">
                        {category}{" "}
                        <span className="text-[#FFD700] mx-2">•</span> {office}
                      </p>

                      <div className="bg-white border-[6px] border-[#0038A8] p-4 rounded-3xl inline-block shadow-[0_10px_30px_rgba(0,56,168,0.15)] mb-4">
                        <QRCodeSVG
                          value={bookingId || "error"}
                          size={180}
                          className="rounded-xl"
                        />
                      </div>
                      <p className="font-mono font-black text-[#0038A8] text-lg tracking-[0.2em]">
                        #
                        {bookingId
                          ? bookingId.slice(-6).toUpperCase()
                          : "XXXXXX"}
                      </p>
                    </div>

                    <div className="relative h-12 flex items-center justify-center bg-white">
                      <div className="absolute w-10 h-10 bg-[#F8FAFC] rounded-full -left-5 shadow-inner border-r border-slate-200" />
                      <div className="absolute w-10 h-10 bg-[#F8FAFC] rounded-full -right-5 shadow-inner border-l border-slate-200" />
                      <div className="w-full h-px border-t-4 border-dashed border-slate-200 mx-8" />
                    </div>

                    <div className="bg-slate-50 p-8 flex justify-between items-center px-10">
                      <div className="text-left">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                          Authorized Date
                        </span>
                        <span className="text-sm font-black text-[#0038A8]">
                          {bookingDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">
                          Pass Status
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-md uppercase tracking-widest border border-emerald-200 shadow-sm">
                          Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-8 mb-6">
                    Scan QR at the Main Gate Terminal
                  </p>

                  <div className="flex justify-center gap-4 max-w-md mx-auto">
                    <button
                      onClick={downloadQR}
                      className="flex-1 py-5 bg-white border-2 border-slate-200 text-[#0038A8] hover:border-[#0038A8] rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-sm flex justify-center items-center gap-2 active:scale-95"
                    >
                      <FiDownload size={18} /> Save Image
                    </button>
                    <button
                      onClick={printQR}
                      className="flex-1 py-5 bg-[#0038A8] text-[#FFD700] rounded-[1.25rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-[0_10px_20px_rgba(0,56,168,0.3)] hover:bg-[#002b82] flex justify-center items-center gap-2 active:scale-95"
                    >
                      <FiPrinter size={18} /> Print Pass
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
    className={`space-y-2 w-full text-left group ${disabled ? "opacity-50 pointer-events-none" : ""}`}
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
        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#0038A8] focus:ring-4 focus:ring-[#0038A8]/10 focus:bg-white outline-none text-sm font-bold text-slate-800 transition-all placeholder:text-slate-300"
      />
      {icon && (
        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#0038A8] transition-colors text-xl">
          {icon}
        </span>
      )}
    </div>
  </div>
);

export default BookAppointment;
