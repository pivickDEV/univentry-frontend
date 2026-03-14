/* eslint-disable */
"use client";
import axios from "axios";
import * as faceapi from "face-api.js";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
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
  (import.meta.env.DEV ? "http://localhost:8080/api" : "");

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

type FaceStatus = "scanning" | "stable" | "no_face" | "too_far" | "success";

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
  const [, setIsEmailVerified] = useState(false);

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
  const [isOcrLoading, setIsOcrLoading] = useState(false);

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
      // 🔥 FIXED: Safe string extraction
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
              @media print {
                body { -webkit-print-color-adjust: exact; }
              }
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
               <!-- 🔥 FIXED: Safe string extraction -->
               <p class="id-text">#${bookingId ? bookingId.slice(-6).toUpperCase() : "XXXXXX"}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // --- OCR FUNCTION ---
  const handleOcr = async (image: string, side: "front" | "back") => {
    setIsOcrLoading(true);
    try {
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(image);
      if (side === "front") setOcrFront(text);
      else setOcrBack(text);
      await worker.terminate();
    } catch (err) {
      console.error("OCR Error:", err);
    } finally {
      setIsOcrLoading(false);
    }
  };

  // 🔍 DEBUG: Check what API URL the frontend is using
  useEffect(() => {
    console.log("Resolved API baseURL:", api.defaults.baseURL);
  }, []);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await api.get("/offices");
        setOffices(res.data);
      } catch (err) {
        console.error("Office fetch failed");
      }
    };
    fetchOffices();
  }, []);

  useEffect(() => {
    const fetchCapacity = async () => {
      if (!bookingDate || !office) return;

      setIsValidating(true);
      try {
        const res = await api.get(
          `/bookings/slots?bookingDate=${bookingDate}&office=${office}`,
        );
        setSlots({ current: res.data.current, max: res.data.max });
      } catch (err) {
        setSlots({ current: 0, max: 0 });
      } finally {
        setIsValidating(false);
      }
    };
    fetchCapacity();
  }, [bookingDate, office]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";
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
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (captureTimerRef.current) clearTimeout(captureTimerRef.current);
    };
  }, [step, faceScan, detectFace]);

  const handleSendOTP = async () => {
    if (!email.includes("@")) return setError("Enter valid email");
    setIsVerifying(true);
    setError(null);
    try {
      await api.post("/send-otp", { email });
      setOtpSent(true);
      setError(null);
    } catch (err: any) {
      console.error("Send OTP Error:", err);
      if (err.response?.status === 404) {
        setError("Backend Error: Route does not exist.");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "OTP service failed.",
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsVerifying(true);
    setError(null);
    try {
      const res = await api.post("/verify-otp", {
        email,
        otp: otpCode,
      });
      if (res.data.success) {
        setIsEmailVerified(true);
        setStep(1);
        setError(null);
      } else {
        setError("Invalid OTP Code.");
      }
    } catch (err: any) {
      console.error("Verify OTP Error:", err);
      if (err.response?.status === 404) {
        setError("Backend Error: Route does not exist.");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Invalid Code.",
        );
      }
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
      if (!faceEmbedding || faceEmbedding.length === 0)
        throw new Error("Biometric face scan is required.");
      if (!idFront || !idBack)
        throw new Error("Both Front and Back ID images are required.");
      if (!idType) throw new Error("Please select an ID type from the list.");
      if (!bookingDate) throw new Error("Please select a valid date.");

      const payload = {
        firstName,
        lastName,
        email,
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

  const isStep1Valid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    category !== "" &&
    /^09\d{9}$/.test(phoneNumber);

  // --- ANIMATION VARIANTS ---
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 p-4 md:p-8 font-sans selection:bg-[#FFD700]/30 selection:text-[#0038A8] relative overflow-hidden flex items-center justify-center">
      {/* --- BACKGROUND MESH GRADIENTS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0038A8]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFD700]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        {/* --- TOP BRANDING --- */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white text-[#0038A8] text-[10px] font-black uppercase tracking-widest mb-6 shadow-sm">
            <FiShield className="text-[#FFD700] text-lg" /> Official RTU Gateway
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#0038A8] mb-3 uppercase leading-none">
            Public{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
              Portal
            </span>
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
            AI-Powered Smart Campus Registration
          </p>
        </div>

        {/* --- MAIN CARD --- */}
        <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[2.5rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,56,168,0.1)] overflow-hidden flex flex-col relative">
          {/* STEPPER UI (Hidden on Success) */}
          {step < 4 && (
            <div className="bg-slate-50/50 border-b border-slate-100 p-6 flex justify-between items-center px-8 md:px-16 shrink-0">
              {["Verification", "Identity", "Logistics", "Biometrics"].map(
                (label, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center gap-2 relative z-10 w-1/4"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] transition-all duration-500 ${
                        step > idx
                          ? "bg-[#0038A8] text-[#FFD700] shadow-lg"
                          : step === idx
                            ? "bg-[#FFD700] text-[#0038A8] ring-4 ring-amber-100 shadow-md"
                            : "bg-white text-slate-300 border-2 border-slate-100"
                      }`}
                    >
                      {step > idx ? <FiCheck size={14} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest hidden md:block text-center ${step === idx ? "text-[#0038A8]" : "text-slate-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                ),
              )}
              {/* Connecting Line */}
              <div className="absolute left-[15%] right-[15%] top-10 h-0.5 bg-slate-100 -z-10 hidden md:block">
                <motion.div
                  className="h-full bg-[#0038A8] transition-all duration-500"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="p-6 md:p-12 lg:p-16 flex-1">
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
              {/* ================= STEP 0: OTP ================= */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="max-w-md mx-auto text-center space-y-8 py-4"
                >
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-[#FFD700] blur-xl opacity-30 rounded-full animate-pulse" />
                    <div className="relative w-full h-full bg-linear-to-br from-[#0038A8] to-blue-900 rounded-3xl flex items-center justify-center shadow-xl border border-blue-400/30 transform rotate-3">
                      <FiMail className="text-4xl text-[#FFD700]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">
                      Security Gateway
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Verify your identity to proceed
                    </p>
                  </div>

                  <div className="space-y-5 text-left">
                    <Input
                      label="Email Address"
                      value={email}
                      onChange={setEmail}
                      icon={<FiMail />}
                      disabled={otpSent}
                      placeholder="name@domain.com"
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

                  <button
                    onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                    disabled={isVerifying || !email}
                    className="w-full py-5 bg-[#0038A8] hover:bg-[#002b82] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <FiLoader className="animate-spin text-lg" />
                    ) : otpSent ? (
                      "Verify & Unlock"
                    ) : (
                      "Send Verification Link"
                    )}
                  </button>
                </motion.div>
              )}

              {/* ================= STEP 1: INFO ================= */}
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
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                      Personal Identity
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Please provide accurate details
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
                      label="Mobile Number"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      icon={<FiPhone />}
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
                    />
                    <div className="space-y-2 text-left group">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 transition-colors group-focus-within:text-[#0038A8]">
                        Visitor Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50/50 focus:bg-white transition-all font-bold text-sm cursor-pointer appearance-none"
                      >
                        <option value="">Select Classification...</option>
                        <option value="Student">Student</option>
                        <option value="Alumni">Alumni</option>
                        <option value="Parent/Guardian">Parent/Guardian</option>
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
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 mt-8">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!isStep1Valid}
                      className="w-full md:w-auto md:float-right px-10 py-5 bg-[#0038A8] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-900/20 transition-all hover:bg-[#FFD700] hover:text-[#0038A8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                    >
                      Continue Next Phase <FiArrowRight size={16} />
                    </button>
                    <div className="clear-both"></div>
                  </div>
                </motion.div>
              )}

              {/* ================= STEP 2: LOGISTICS ================= */}
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
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                      Visit Logistics
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Declare your destination and purpose
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Target Office */}
                    <div className="space-y-2 text-left group">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 transition-colors group-focus-within:text-[#0038A8]">
                        1. Target Destination
                      </label>
                      <select
                        value={office}
                        onChange={(e) => {
                          setOffice(e.target.value);
                          setBookingDate("");
                          setSlots({ current: 0, max: null });
                        }}
                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50/50 focus:bg-white transition-all font-bold text-sm cursor-pointer appearance-none"
                      >
                        <option value="">Select Target Office...</option>
                        {offices.map((off) => (
                          <option key={off._id} value={off.name}>
                            {off.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date */}
                    <div
                      className={`transition-all ${!office ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                    >
                      <Input
                        label="2. Schedule Date"
                        type="date"
                        value={bookingDate}
                        onChange={setBookingDate}
                        icon={<FiCalendar />}
                        min={today}
                        onClick={(e: any) => e.currentTarget.showPicker()}
                      />
                    </div>
                  </div>

                  {/* Server Status Widget */}
                  <div
                    className={`transition-all ${!bookingDate ? "opacity-30 pointer-events-none grayscale" : "opacity-100"}`}
                  >
                    <div className="bg-slate-900 rounded-4xl p-6 border-4 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
                      {/* 🔥 FIXED 404 WARNING: Using pure CSS Grid instead of external image link */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[20px_20px]"></div>

                      <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                          <FiCpu size={24} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            Office Server Link
                          </p>
                          <p className="text-white font-bold tracking-wide mt-1">
                            Live Capacity Check
                          </p>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
                        {isValidating ? (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <FiLoader className="animate-spin text-[#FFD700]" />{" "}
                            Querying DB...
                          </span>
                        ) : (
                          <>
                            <div className="flex flex-col text-right">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                                Status
                              </span>
                              <span
                                className={`text-sm font-black uppercase ${slots.max === 0 ? "text-red-500" : slots.max !== null && slots.current >= slots.max ? "text-amber-500" : "text-emerald-400"}`}
                              >
                                {slots.max === 0
                                  ? "BLACKOUT / CLOSED"
                                  : slots.max !== null &&
                                      slots.current >= slots.max
                                    ? "CAPACITY FULL"
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
                      label="3. Detailed Purpose"
                      value={purpose}
                      onChange={setPurpose}
                      placeholder="State exact reason for visit..."
                    />
                  </div>

                  {/* Navigation */}
                  <div className="flex gap-4 pt-8 border-t border-slate-100">
                    <button
                      onClick={() => setStep(1)}
                      className="px-8 py-5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={
                        isValidating ||
                        !bookingDate ||
                        !office ||
                        !purpose ||
                        (slots.max !== null && slots.max === 0) ||
                        (slots.max !== null && slots.current >= slots.max)
                      }
                      className="flex-1 py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl shadow-blue-900/20 hover:bg-[#002b82] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                      {!isValidating && slots.max === 0
                        ? "Office Unavailable"
                        : "Activate Scanner"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ================= STEP 3: BIOMETRICS ================= */}
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
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter flex items-center justify-center gap-3">
                      <FiCrosshair className="text-[#0038A8]" /> AI Biometric
                      Engine
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                      Secure your identity array & documents
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-10 items-start">
                    {/* LEFT: HUD CAMERA */}
                    <div className="space-y-4">
                      <div className="relative aspect-4/3 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-slate-800 group">
                        {/* Sci-Fi Corner Brackets */}
                        <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />
                        <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-[#FFD700] opacity-50 z-20 pointer-events-none" />

                        {!faceScan ? (
                          <>
                            <Webcam
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              className="w-full h-full object-cover scale-x-[-1]"
                            />
                            <canvas
                              ref={canvasRef}
                              className="absolute inset-0 w-full h-full pointer-events-none z-10"
                            />
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md text-white border border-white/10 z-20 shadow-lg">
                              Align Face in Frame
                            </div>
                          </>
                        ) : (
                          <div className="relative h-full w-full">
                            <img
                              src={faceScan}
                              className="w-full h-full object-cover grayscale opacity-80"
                            />
                            <div className="absolute inset-0 bg-[#0038A8]/40 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                              <FiCheckCircle className="text-6xl text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] mb-4" />
                              <p className="text-white font-black uppercase tracking-widest text-xs">
                                Vector Stored
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setFaceScan(null);
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

                    {/* RIGHT: ID UPLOADS & OCR TERMINAL */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            ID Class
                          </label>
                          <select
                            value={idCategory}
                            onChange={(e) => {
                              setIdCategory(e.target.value);
                              setIdType("");
                            }}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0038A8]"
                          >
                            <option value="Primary">Primary</option>
                            <option value="Secondary">Secondary</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Document Type
                          </label>
                          <select
                            value={idType}
                            onChange={(e) => setIdType(e.target.value)}
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#0038A8]"
                          >
                            <option value="">Select ID...</option>
                            {idCategory === "Primary"
                              ? idOptions.Primary.map((id) => (
                                  <option key={id} value={id}>
                                    {id}
                                  </option>
                                ))
                              : idOptions.Secondary.map((id) => (
                                  <option key={id} value={id}>
                                    {id}
                                  </option>
                                ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="relative h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center overflow-hidden group hover:border-[#0038A8] hover:bg-blue-50 transition-all cursor-pointer">
                          {idFront ? (
                            <img
                              src={idFront}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <FiImage className="text-slate-300 text-3xl mb-2 group-hover:text-[#0038A8]" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                Front Image
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
                          {idFront && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="relative h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center overflow-hidden group hover:border-[#0038A8] hover:bg-blue-50 transition-all cursor-pointer">
                          {idBack ? (
                            <img
                              src={idBack}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <>
                              <FiImage className="text-slate-300 text-3xl mb-2 group-hover:text-[#0038A8]" />
                              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                Back Image
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
                          {idBack && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                      </div>

                      {/* TERMINAL OCR DISPLAY */}
                      <div className="bg-[#050505] p-5 rounded-2xl border-4 border-slate-800 shadow-inner flex flex-col">
                        <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-3">
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                            <Terminal size={12} /> AI Data Extractor
                          </span>
                          {isOcrLoading && (
                            <FiLoader className="text-emerald-500 animate-spin text-sm" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 flex-1">
                          <div className="flex flex-col">
                            <p className="text-[7px] text-slate-500 font-black uppercase mb-1">
                              Stdout_Front
                            </p>
                            <div className="flex-1 bg-black/50 rounded-lg p-2 text-[8px] font-mono text-emerald-400 leading-relaxed overflow-y-auto max-h-20 custom-scrollbar whitespace-pre-wrap">
                              {ocrFront || "> Waiting for image input..."}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[7px] text-slate-500 font-black uppercase mb-1">
                              Stdout_Back
                            </p>
                            <div className="flex-1 bg-black/50 rounded-lg p-2 text-[8px] font-mono text-emerald-400 leading-relaxed overflow-y-auto max-h-20 custom-scrollbar whitespace-pre-wrap">
                              {ocrBack || "> Waiting for image input..."}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-slate-100">
                    <button
                      onClick={() => setStep(2)}
                      className="px-8 py-5 border-2 border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Back
                    </button>
                    <button
                      onClick={submitBooking}
                      disabled={
                        loading ||
                        !faceScan ||
                        !idFront ||
                        !idBack ||
                        isOcrLoading ||
                        !idType
                      }
                      className="flex-1 py-5 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:bg-[#002b82] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
                    >
                      {loading ? (
                        <FiLoader className="animate-spin text-lg" />
                      ) : (
                        <>
                          <FiShield size={18} /> Finalize Registration
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ================= STEP 4: DIGITAL PASS (🔥 CRASH FIXED) ================= */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="py-4"
                >
                  {/* The Ticket Wrapper */}
                  <div className="w-full max-w-sm mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,56,168,0.2)] border border-slate-100 overflow-hidden relative">
                    {/* Ticket Header */}
                    <div className="bg-[#0038A8] pt-8 pb-10 px-8 text-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-2 bg-[#FFD700]" />
                      <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm text-[#FFD700]">
                        <FiCheck size={28} strokeWidth={3} />
                      </div>
                      <h2 className="text-white font-black text-xl uppercase tracking-widest leading-tight">
                        Access Granted
                      </h2>
                      <p className="text-blue-200 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">
                        Digital Boarding Pass
                      </p>
                    </div>

                    {/* Ticket Body */}
                    <div className="px-8 pb-8 pt-4 bg-white text-center -mt-6 rounded-t-3xl relative z-10">
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1">
                        {firstName} {lastName}
                      </h3>
                      <p className="text-[10px] font-bold text-[#0038A8] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full inline-block mb-6">
                        {category} • {office}
                      </p>

                      <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-4xl inline-block shadow-inner">
                        <QRCodeSVG
                          value={bookingId || "error"}
                          size={160}
                          className="rounded-xl"
                        />
                      </div>

                      {/* 🔥 FIXED: Safe string extraction prevents the White Screen Crash! */}
                      <p className="mt-4 font-mono font-black text-slate-400 text-sm tracking-widest">
                        #
                        {bookingId
                          ? bookingId.slice(-6).toUpperCase()
                          : "XXXXXX"}
                      </p>
                    </div>

                    {/* Perforated Tear Line */}
                    <div className="relative h-8 flex items-center justify-center bg-white">
                      <div className="absolute w-8 h-8 bg-[#F8FAFC] rounded-full -left-4 shadow-inner" />
                      <div className="absolute w-8 h-8 bg-[#F8FAFC] rounded-full -right-4 shadow-inner" />
                      <div className="w-full h-px border-t-2 border-dashed border-slate-200 mx-6" />
                    </div>

                    {/* Ticket Footer */}
                    <div className="bg-slate-50 p-6 flex justify-between items-center px-8 border-t border-slate-100">
                      <div className="text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          Valid Date
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          {bookingDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                          Status
                        </span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded uppercase tracking-widest border border-emerald-200">
                          Approved
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8 mb-6">
                    Present QR at the Security Gate
                  </p>

                  <div className="flex justify-center gap-4 max-w-sm mx-auto">
                    <button
                      onClick={downloadQR}
                      className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 hover:text-[#0038A8] hover:border-[#0038A8] rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-sm flex justify-center items-center gap-2 active:scale-95"
                    >
                      <FiDownload size={16} /> Save Image
                    </button>
                    <button
                      onClick={printQR}
                      className="flex-1 py-4 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-blue-900/20 hover:bg-[#002b82] flex justify-center items-center gap-2 active:scale-95"
                    >
                      <FiPrinter size={16} /> Print Pass
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
        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 focus:bg-white outline-none text-sm font-bold text-slate-800 transition-all placeholder:text-slate-300"
      />
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#0038A8] transition-colors text-lg">
          {icon}
        </span>
      )}
    </div>
  </div>
);

const Terminal = ({ size }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);

export default BookAppointment;
