/* eslint-disable */
"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  FiActivity,
  FiAlertTriangle,
  FiBriefcase,
  FiClock,
  FiCreditCard,
  FiCrosshair,
  FiDownload,
  FiEye,
  FiFilter,
  FiLogOut,
  FiMapPin,
  FiMaximize,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiVideoOff,
  FiX,
} from "react-icons/fi";

// 🚀 VERCEL PREP: Global API Instance with Tunnel Headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// --- INTERFACES ---
interface AuditLog {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  category: string;
  office: string;
  purpose: string;
  bookingDate: string;
  timeIn?: string;
  transactionTime?: string;
  timeOut?: string;
  hours?: number;
  actionBy?: string;
  timeInBy?: string;
  transactionBy?: string;
  timeOutBy?: string;
  status: string;
  idCategory: string;
  idType: string;
  idFront: string;
  idBack: string;
  ocrFront?: string;
  ocrBack?: string;
  faceEmbedding?: number[];
}

interface CCTVLog {
  _id: string;
  visitorId: string;
  cameraName: string;
  confidence: number;
  screenshotBase64: string;
  timestamp: string;
  status: "IN" | "OUT";
  date: string;
}

const AuditTrail = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeFilter, setTimeFilter] = useState("today");

  // Details Modal State
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // AI CCTV Logs State
  const [cctvLogs, setCctvLogs] = useState<CCTVLog[]>([]);
  const [loadingCCTV, setLoadingCCTV] = useState(false);

  // Fullscreen Image State
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Custom Delete Modal State
  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- FETCH API ---
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings");
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Connection failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // --- FETCH CCTV LOGS WHEN MODAL OPENS ---
  useEffect(() => {
    if (selectedLog) {
      setLoadingCCTV(true);

      const first = selectedLog.firstName || "";
      const last = selectedLog.lastName || "";
      const fullName = `${first} ${last}`.trim();

      const fetchTracks = async () => {
        try {
          const res = await api.get(
            `/cctv-logs/visitor/${selectedLog._id}?name=${encodeURIComponent(fullName)}`,
          );
          let data = res.data;

          if (!data || data.length === 0) {
            const fallbackRes = await api.get("/cctv-logs");
            data = fallbackRes.data.filter(
              (l: any) =>
                l.visitorId === selectedLog._id || l.visitorName === fullName,
            );
          }

          const sorted = data.sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          );
          setCctvLogs(sorted);
        } catch (err) {
          try {
            const fallbackRes = await api.get("/cctv-logs");
            const filtered = fallbackRes.data.filter(
              (l: any) =>
                l.visitorId === selectedLog._id || l.visitorName === fullName,
            );
            setCctvLogs(
              filtered.sort(
                (a: any, b: any) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime(),
              ),
            );
          } catch (fallbackErr) {
            setCctvLogs([]);
          }
        } finally {
          setLoadingCCTV(false);
        }
      };

      fetchTracks();
    } else {
      setCctvLogs([]);
    }
  }, [selectedLog]);

  // --- FILTERING LOGIC (Manila Time) ---
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const first = log.firstName || "";
        const last = log.lastName || "";
        const office = log.office || "";
        const fullName = `${first} ${last}`;

        const matchesSearch =
          fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          office.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesTime = true;
        try {
          if (timeFilter !== "all" && !log.bookingDate) return false;

          const manilaNow = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
          );
          const todayStr = manilaNow.toLocaleDateString("en-CA");

          const yesterday = new Date(manilaNow);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toLocaleDateString("en-CA");

          if (timeFilter === "today") {
            matchesTime = log.bookingDate === todayStr;
          } else if (timeFilter === "yesterday") {
            matchesTime = log.bookingDate === yesterdayStr;
          } else if (timeFilter === "week") {
            const logTime = new Date(log.bookingDate).getTime();
            const weekAgo = manilaNow.getTime() - 7 * 86400000;
            matchesTime = logTime >= weekAgo;
          }
        } catch (e) {
          matchesTime = true;
        }

        return matchesSearch && matchesTime;
      })
      .sort((a, b) => {
        const dateA = new Date(a.bookingDate || 0).getTime();
        const dateB = new Date(b.bookingDate || 0).getTime();
        return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
      });
  }, [logs, searchTerm, timeFilter]);

  // --- CSV EXPORT ---
  const handleGenerateReport = () => {
    if (filteredLogs.length === 0) return alert("No data to export.");

    const headers = [
      "Full Name",
      "Category",
      "Contact No",
      "Office",
      "Date",
      "Purpose",
      "Time In",
      "Guard (Entry)",
      "Office Transaction",
      "Staff (Office)",
      "Time Out",
      "Guard (Exit)",
      "Total Hours",
      "Status",
      "Appointments",
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.lastName || ""}, ${log.firstName || ""}"`,
      `"${log.category || ""}"`,
      `"${log.phoneNumber || ""}"`,
      `"${log.office || ""}"`,
      `"${log.bookingDate || ""}"`,
      `"${log.purpose || ""}"`,
      log.timeIn
        ? new Date(log.timeIn).toLocaleTimeString("en-PH", {
            timeZone: "Asia/Manila",
          })
        : "--",
      `"${log.timeInBy || "--"}"`,
      log.transactionTime
        ? new Date(log.transactionTime).toLocaleTimeString("en-PH", {
            timeZone: "Asia/Manila",
          })
        : "--",
      `"${log.transactionBy || "--"}"`,
      log.timeOut
        ? new Date(log.timeOut).toLocaleTimeString("en-PH", {
            timeZone: "Asia/Manila",
          })
        : "--",
      `"${log.timeOutBy || "--"}"`,
      log.hours ? log.hours.toFixed(2) : "0",
      log.status || "",
      `"${log.actionBy || "SYSTEM"}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `UniVentry_Report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DELETE FUNCTION ---
  const confirmDelete = async () => {
    if (!logToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/bookings/${logToDelete._id}`);
      setLogs((prev) => prev.filter((l) => l._id !== logToDelete._id));
      setLogToDelete(null);
      setSelectedLog(null);
    } catch (err) {
      alert("Failed to delete log.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* ================= HEADER (BRANDING) ================= */}
      <div className="max-w-[1600px] mx-auto w-full mb-6 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 lg:p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg shadow-blue-900/20">
              <FiShield className="text-2xl lg:text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
                Audit{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0038A8] to-blue-400">
                  Trail
                </span>
              </h1>
              <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Master Activity Log
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateReport}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-[#0038A8] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#002b82] transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            <FiDownload size={16} /> <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* ================= MASSIVE WHITE CONTAINER ================= */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-4 lg:p-8 flex flex-col overflow-hidden">
        {/* CONTROLS BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 shrink-0">
          {/* SEARCH */}
          <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="pl-3">
              <FiSearch className="text-slate-400 w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="SEARCH VISITOR OR OFFICE..."
              className="flex-1 w-full lg:w-80 py-2.5 font-bold text-slate-700 outline-none placeholder:text-slate-300 uppercase text-xs bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* FILTERS & REFRESH */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <FiFilter className="text-slate-400 mr-2 shrink-0 w-4 h-4" />
            {["today", "yesterday", "week", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  timeFilter === f
                    ? "bg-[#0038A8] text-white shadow-md"
                    : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {f === "all" ? "All Time" : f}
              </button>
            ))}
            <div className="h-6 w-px bg-slate-200 mx-2 shrink-0" />
            <button
              onClick={fetchAuditLogs}
              disabled={loading}
              className="p-3 bg-slate-50 text-[#0038A8] border border-slate-200 rounded-xl hover:bg-[#0038A8] hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
            >
              <FiRefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* TABLE WRAPPER (Responsive horizontal scrolling) */}
        <div className="flex-1 overflow-auto border border-slate-200 rounded-[1.5rem] bg-slate-50 custom-scrollbar relative">
          <table className="w-full text-left border-collapse table-auto min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-200">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Visitor
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Contact
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Office
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Date
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Gate In
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Office Tx
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">
                  Gate Out
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse bg-white">
                    <td colSpan={8} className="px-8 py-6">
                      <div className="h-6 bg-slate-100 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr className="bg-white">
                  <td
                    colSpan={8}
                    className="p-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest"
                  >
                    No Records Found for Selected Filter
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="group hover:bg-blue-50/50 bg-white transition-all cursor-pointer"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="font-black text-[#0038A8] text-sm uppercase group-hover:underline decoration-2 underline-offset-4 decoration-[#FFD700] transition-all">
                        {log.lastName || "N/A"}, {log.firstName || "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {log.phoneNumber || "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-700 uppercase px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100 truncate max-w-[150px]">
                          {log.office || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-slate-600">
                        {log.bookingDate || "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-black font-mono ${log.timeIn ? "text-emerald-600" : "text-slate-300"}`}
                      >
                        {log.timeIn
                          ? new Date(log.timeIn).toLocaleTimeString("en-PH", {
                              timeZone: "Asia/Manila",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold font-mono ${log.transactionTime ? "text-[#0038A8]" : "text-slate-300"}`}
                      >
                        {log.transactionTime
                          ? new Date(log.transactionTime).toLocaleTimeString(
                              "en-PH",
                              {
                                timeZone: "Asia/Manila",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )
                          : "--:--"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-black font-mono ${log.timeOut ? "text-red-500" : "text-slate-300"}`}
                      >
                        {log.timeOut
                          ? new Date(log.timeOut).toLocaleTimeString("en-PH", {
                              timeZone: "Asia/Manila",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "--:--"}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <span className="text-[9px] font-black text-slate-500 uppercase px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
                        {log.actionBy ? log.actionBy.split(" ")[0] : "SYSTEM"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DOSSIER MODAL (REDESIGNED) ================= */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-6xl max-h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              {/* === BLUE HEADER === */}
              <div className="bg-[#0038A8] p-6 lg:p-8 pb-12 text-center relative shrink-0">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg text-white">
                  <FiUser size={32} />
                </div>
                <h2 className="text-white font-black text-2xl lg:text-3xl uppercase tracking-wide relative z-10">
                  Visitor Dossier
                </h2>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1 relative z-10">
                  Ref ID: {selectedLog._id}
                </p>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-6 right-6 p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-colors z-20"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* === WHITE BODY (Scrollable) === */}
              <div className="p-6 lg:p-10 -mt-8 bg-white rounded-t-[2.5rem] relative z-20 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                {/* ROW 1: DETAILS & PERSONNEL */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 1. Personal */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-5 flex items-center gap-2">
                      <FiUser /> Identification
                    </h3>
                    <div className="space-y-4">
                      <DetailRow
                        label="Full Name"
                        value={`${selectedLog.lastName || ""}, ${selectedLog.firstName || ""}`}
                      />
                      <DetailRow
                        label="Category"
                        value={selectedLog.category}
                        highlight
                      />
                      <DetailRow label="Email" value={selectedLog.email} />
                      <DetailRow
                        label="Phone"
                        value={selectedLog.phoneNumber}
                      />
                    </div>
                  </div>

                  {/* 2. Logistics */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-5 flex items-center gap-2">
                      <FiMapPin /> Logistics
                    </h3>
                    <div className="space-y-4">
                      <DetailRow
                        label="Destination"
                        value={selectedLog.office}
                      />
                      <DetailRow
                        label="Date"
                        value={selectedLog.bookingDate}
                        highlight
                      />
                      <DetailRow label="Purpose" value={selectedLog.purpose} />
                      <DetailRow
                        label="Status"
                        value={selectedLog.status}
                        customColor={
                          selectedLog.status === "Completed"
                            ? "text-emerald-600"
                            : "text-[#0038A8]"
                        }
                      />
                    </div>
                  </div>

                  {/* 3. AUDIT HANDLERS */}
                  <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                    <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-5 flex items-center gap-2 relative z-10">
                      <FiShield /> Audit Handlers
                    </h3>
                    <div className="space-y-4 relative z-10">
                      <HandlerRow
                        label="Appointments"
                        value={selectedLog.actionBy}
                      />
                      <HandlerRow
                        label="Gate Guard (In)"
                        value={selectedLog.timeInBy}
                      />
                      <HandlerRow
                        label="Office Staff"
                        value={selectedLog.transactionBy}
                      />
                      <HandlerRow
                        label="Gate Guard (Out)"
                        value={selectedLog.timeOutBy}
                      />
                    </div>
                  </div>
                </div>

                {/* ROW 2: TIMESTAMPS VISUAL BAR */}
                <div className="bg-white border border-slate-200 p-6 lg:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm relative">
                  <TimeVisualizer
                    icon={<FiClock />}
                    label="Gate Entry"
                    time={selectedLog.timeIn}
                    color="text-emerald-500"
                  />
                  <div className="h-px w-full md:w-px md:h-16 bg-slate-200" />
                  <TimeVisualizer
                    icon={<FiBriefcase />}
                    label="Office Scan"
                    time={selectedLog.transactionTime}
                    color="text-[#0038A8]"
                  />
                  <div className="h-px w-full md:w-px md:h-16 bg-slate-200" />
                  <TimeVisualizer
                    icon={<FiActivity />}
                    label="Gate Exit"
                    time={selectedLog.timeOut}
                    color="text-red-500"
                  />

                  {/* TOTAL STAY BADGE */}
                  <div className="absolute top-4 right-4 md:static md:right-auto md:top-auto md:ml-4">
                    <div className="bg-[#0038A8] text-white px-5 py-3 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-blue-900/20">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                        Total Stay
                      </span>
                      <span className="text-2xl font-black font-mono leading-none">
                        {selectedLog.hours
                          ? selectedLog.hours.toFixed(2)
                          : "0.00"}
                        <span className="text-xs">h</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ROW 3: DOCUMENTS */}
                <div className="grid md:grid-cols-2 gap-6">
                  <DocumentCard
                    title="ID Verification (Front)"
                    image={selectedLog.idFront}
                    text={selectedLog.ocrFront}
                    onClick={() => setFullscreenImage(selectedLog.idFront)}
                  />
                  <DocumentCard
                    title="ID Verification (Back)"
                    image={selectedLog.idBack}
                    text={selectedLog.ocrBack}
                    onClick={() => setFullscreenImage(selectedLog.idBack)}
                  />
                </div>

                {/* ROW 4: AI SURVEILLANCE TRACKS */}
                <div className="pt-8 border-t-2 border-slate-100">
                  <h3 className="text-[#0038A8] font-black uppercase text-sm tracking-widest mb-6 flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FiCrosshair className="text-[#0038A8]" />
                    </div>
                    AI Surveillance Tracks
                  </h3>

                  {loadingCCTV ? (
                    <div className="flex justify-center py-12 bg-slate-50 rounded-3xl border border-slate-200">
                      <FiRefreshCw className="animate-spin text-[#0038A8] text-3xl" />
                    </div>
                  ) : cctvLogs.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <FiVideoOff className="text-slate-300 text-2xl" />
                      </div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        No facial recognition tracks recorded for this visitor.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {cctvLogs.map((log) => (
                        <div
                          key={log._id}
                          className="bg-slate-900 rounded-[1.5rem] overflow-hidden border-2 border-slate-200 shadow-md group flex flex-col"
                        >
                          {/* Image Section */}
                          <div className="relative aspect-video bg-slate-800 flex items-center justify-center overflow-hidden">
                            {log.screenshotBase64 ? (
                              <img
                                src={log.screenshotBase64}
                                alt="CCTV Hit"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100 cursor-pointer"
                                onClick={() =>
                                  setFullscreenImage(log.screenshotBase64)
                                }
                              />
                            ) : (
                              <FiLogOut className="text-slate-500 text-4xl" />
                            )}

                            {/* Camera Name Tag */}
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-lg">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  log.status === "OUT"
                                    ? "bg-slate-400"
                                    : "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                }`}
                              />
                              <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                {log.cameraName}
                              </span>
                            </div>

                            {/* Hover Enlarge Icon */}
                            {log.screenshotBase64 && (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm pointer-events-none">
                                <FiMaximize className="text-white text-2xl" />
                              </div>
                            )}
                          </div>

                          {/* Info Section */}
                          <div className="p-4 bg-white flex flex-col flex-1 justify-between">
                            <div className="flex justify-between items-center mb-3">
                              <span
                                className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                                  log.status === "OUT"
                                    ? "bg-slate-100 text-slate-500 border-slate-200"
                                    : "bg-blue-50 text-[#0038A8] border-blue-100"
                                }`}
                              >
                                {log.status === "OUT"
                                  ? "EXITED (OUT)"
                                  : `${log.confidence}% MATCH (IN)`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-[10px] font-bold text-slate-600 font-mono flex items-center gap-1.5">
                                <FiClock />{" "}
                                {new Date(log.timestamp).toLocaleTimeString(
                                  "en-PH",
                                  {
                                    timeZone: "Asia/Manila",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                {log.date ||
                                  new Date(log.timestamp).toLocaleDateString(
                                    "en-PH",
                                    {
                                      timeZone: "Asia/Manila",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* === FOOTER ACTION === */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 lg:px-10 py-5 flex items-center justify-between shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  System Actions
                </div>
                <button
                  onClick={() => setLogToDelete(selectedLog)}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                  <FiTrash2 size={14} /> Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {logToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-center"
            >
              <div className="bg-red-600 p-8 pb-10 relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl text-red-600 mb-4 relative z-10">
                  <FiAlertTriangle size={40} />
                </div>
                <h2 className="text-white font-black text-2xl uppercase tracking-wide relative z-10">
                  Confirm Deletion
                </h2>
              </div>

              <div className="p-8 -mt-6 bg-white rounded-t-[2rem] relative z-20">
                <h3 className="text-2xl font-black text-slate-800 uppercase leading-none">
                  {logToDelete.firstName} {logToDelete.lastName}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-6">
                  Database ID: {logToDelete._id}
                </p>

                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-8">
                  <p className="text-xs text-red-800 font-bold uppercase tracking-wide leading-relaxed">
                    Warning: This action is permanent and will completely erase
                    the audit trail and biometric data from the registry.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setLogToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95 flex justify-center items-center"
                  >
                    {isDeleting ? "Deleting..." : "Erase"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN IMAGE */}
      <AnimatePresence>
        {fullscreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <img
              src={fullscreenImage}
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
            />
            <button className="absolute top-6 right-6 text-white bg-white/10 p-4 rounded-full hover:bg-white/20 transition-colors">
              <FiX size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const DetailRow = ({ label, value, highlight = false, customColor }: any) => (
  <div className="flex justify-start items-center gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
    <span className="w-24 shrink-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <span
      className={`text-xs font-bold truncate ${customColor ? customColor : highlight ? "text-[#0038A8]" : "text-slate-700"}`}
    >
      {value || "N/A"}
    </span>
  </div>
);

const HandlerRow = ({ label, value }: any) => (
  <div className="flex justify-start items-center gap-4 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
    <span className="w-24 shrink-0 text-[9px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <span className="text-[10px] font-black truncate text-[#0038A8] uppercase bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
      {value || "N/A"}
    </span>
  </div>
);

const TimeVisualizer = ({ icon, label, time, color }: any) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
    <div
      className={`p-4 bg-slate-50 border border-slate-100 rounded-2xl mb-1 shadow-sm ${color}`}
    >
      <span className="text-xl">{icon}</span>
    </div>
    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
      {label}
    </p>
    <p
      className={`text-xl lg:text-2xl font-black font-mono leading-none ${time ? "text-slate-800" : "text-slate-300"}`}
    >
      {time
        ? new Date(time).toLocaleTimeString("en-PH", {
            timeZone: "Asia/Manila",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--"}
    </p>
  </div>
);

const DocumentCard = ({ title, image, text, onClick }: any) => (
  <div className="space-y-4">
    <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest flex items-center gap-2">
      <FiCreditCard /> {title}
    </h3>
    <div
      className="relative h-56 bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 group cursor-pointer shadow-sm"
      onClick={onClick}
    >
      {image ? (
        <img
          src={image}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-slate-300">
          <FiCreditCard size={40} />
        </div>
      )}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
        <p className="text-white text-xs font-bold uppercase flex items-center gap-2">
          <FiEye /> Fullscreen
        </p>
      </div>
    </div>
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">
        AI Extraction
      </p>
      <p className="text-[10px] text-slate-600 font-mono leading-relaxed max-h-20 overflow-y-auto custom-scrollbar">
        {text || "No text available."}
      </p>
    </div>
  </div>
);

export default AuditTrail;
