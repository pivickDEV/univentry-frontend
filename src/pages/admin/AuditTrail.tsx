/* eslint-disable */
"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCrosshair,
  FiDatabase,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiX,
} from "react-icons/fi";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

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

  // --- FILTER, SORT & ARCHIVE STATES ---
  const [activeTab, setActiveTab] = useState<"registry" | "pre-arrivals">(
    "registry",
  ); // 🔥 NEW
  const [timeFilter, setTimeFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [, setIsModalLoading] = useState(false);
  const [cctvLogs, setCctvLogs] = useState<CCTVLog[]>([]);
  const [loadingCCTV, setLoadingCCTV] = useState(false);

  const [logToDelete, setLogToDelete] = useState<AuditLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // --- PURGE 30 DAYS LOGIC ---
  const handlePurgeStale = async () => {
    const thirtyDaysAgo = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
    const stale = logs.filter(
      (l) => !l.timeIn && new Date(l.bookingDate).getTime() < thirtyDaysAgo,
    );

    if (stale.length === 0)
      return alert(
        "System Optimization: No unscanned bookings older than 30 days found.",
      );

    if (
      confirm(
        `SECURITY ACTION: Delete ${stale.length} unscanned records older than 30 days?`,
      )
    ) {
      try {
        await Promise.all(stale.map((l) => api.delete(`/bookings/${l._id}`)));
        alert("Purge successful.");
        fetchAuditLogs();
      } catch (e) {
        alert("Error during purge.");
      }
    }
  };

  // --- DELETE CCTV TRACK ---
  const handleDeleteCCTV = async (cctvId: string) => {
    if (!confirm("Delete this surveillance hit?")) return;
    try {
      await api.delete(`/cctv-logs/${cctvId}`);
      setCctvLogs((prev) => prev.filter((l) => l._id !== cctvId));
    } catch (err) {
      alert("Failed to delete track.");
    }
  };

  const handleRowClick = async (log: AuditLog) => {
    if (activeTab === "pre-arrivals") return; // Pre-arrivals don't have dossier data yet
    setSelectedLog(log);
    setIsModalLoading(true);
    try {
      const res = await api.get(`/bookings/${log._id}`);
      if (res.data) setSelectedLog((prev) => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsModalLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLog) {
      setLoadingCCTV(true);
      const fullName =
        `${selectedLog.firstName} ${selectedLog.lastName}`.trim();
      const fetchTracks = async () => {
        try {
          const res = await api.get(
            `/cctv-logs/visitor/${selectedLog._id}?name=${encodeURIComponent(fullName)}`,
          );
          setCctvLogs(res.data);
        } catch (err) {
          setCctvLogs([]);
        } finally {
          setLoadingCCTV(false);
        }
      };
      fetchTracks();
    }
  }, [selectedLog?._id]);

  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      const fullName = `${log.firstName} ${log.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        (log.office || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // 🔥 CORE FIX: Registry = Scanned (timeIn exists), Pre-Arrivals = Unscanned
      const isScanned = log.timeIn && log.timeIn !== null;
      if (activeTab === "registry" && !isScanned) return false;
      if (activeTab === "pre-arrivals" && isScanned) return false;

      if (customDate) return log.bookingDate === customDate;
      if (timeFilter === "all") return true;

      const manilaNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
      );
      const todayStr = manilaNow.toLocaleDateString("en-CA");
      if (timeFilter === "today") return log.bookingDate === todayStr;
      return true;
    });

    return filtered.sort((a, b) => {
      const timeA = new Date(a.bookingDate || 0).getTime();
      const timeB = new Date(b.bookingDate || 0).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [logs, searchTerm, timeFilter, customDate, sortOrder, activeTab]);

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
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">
      <div className="max-w-400 mx-auto w-full mb-6 shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 lg:p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg">
            <FiShield className="text-2xl lg:text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
              Audit <span className="text-[#FFD700]">Trail</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Activity Log Registry
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* 🔥 TAB SYSTEM */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab("registry")}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "registry" ? "bg-[#0038A8] text-white shadow-md" : "text-slate-400"}`}
            >
              <FiCheckCircle /> Registry
            </button>
            <button
              onClick={() => setActiveTab("pre-arrivals")}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "pre-arrivals" ? "bg-amber-500 text-white shadow-md" : "text-slate-400"}`}
            >
              <FiClock /> Pre-Arrivals
            </button>
          </div>

          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
            {["today", "yesterday", "all"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setTimeFilter(f);
                  setCustomDate("");
                }}
                className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeFilter === f && !customDate ? "bg-[#0038A8] text-white shadow-md" : "text-slate-400"}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-600 focus:outline-none shadow-sm uppercase cursor-pointer"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-600 outline-none shadow-sm uppercase cursor-pointer appearance-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button
              onClick={fetchAuditLogs}
              className="p-2.5 bg-white text-[#0038A8] border border-slate-200 rounded-xl shadow-sm active:scale-95"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {activeTab === "pre-arrivals" ? (
              <button
                onClick={handlePurgeStale}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95"
              >
                <FiTrash2 size={14} /> Purge 30d Bookings
              </button>
            ) : (
              <button
                onClick={() => alert("Archive logic runs...")}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95"
              >
                <FiDatabase size={14} /> Archive Logs
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-400 mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-4 lg:p-8 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="pl-3">
            <FiSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="SEARCH VISITOR OR OFFICE..."
            className="flex-1 py-2.5 font-bold text-slate-700 outline-none uppercase text-xs bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto border border-slate-200 rounded-3xl bg-slate-50 relative">
          <table className="w-full text-left border-collapse table-auto min-w-250">
            <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-200">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400">
                  Visitor
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400">
                  Office
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400">
                  Date
                </th>
                {activeTab === "registry" ? (
                  <>
                    <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center">
                      Gate In
                    </th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center">
                      Office Tx
                    </th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center">
                      Gate Out
                    </th>
                  </>
                ) : (
                  <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-right">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
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
                    No Logs found for this category
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => handleRowClick(log)}
                    className={`group hover:bg-blue-50/50 bg-white transition-all ${activeTab === "registry" ? "cursor-pointer" : ""}`}
                  >
                    <td className="px-8 py-5">
                      <span className="font-black text-[#0038A8] text-sm uppercase">
                        {log.lastName || "N/A"}, {log.firstName || "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-700 uppercase px-3 py-1.5 rounded-full border border-slate-200 bg-slate-100">
                        {log.office || "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-bold text-slate-600">
                        {log.bookingDate || "N/A"}
                      </span>
                    </td>
                    {activeTab === "registry" ? (
                      <>
                        <td className="px-8 py-5 text-center text-[11px] font-black font-mono text-emerald-600">
                          {log.timeIn
                            ? new Date(log.timeIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </td>
                        <td className="px-8 py-5 text-center text-[11px] font-bold font-mono text-[#0038A8]">
                          {log.transactionTime
                            ? new Date(log.transactionTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "--:--"}
                        </td>
                        <td className="px-8 py-5 text-center text-[11px] font-black font-mono text-red-500">
                          {log.timeOut
                            ? new Date(log.timeOut).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </td>
                      </>
                    ) : (
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogToDelete(log);
                          }}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SECTION */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-6xl max-h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="bg-[#0038A8] p-8 text-white flex justify-between items-center shrink-0">
                <h2 className="font-black text-2xl uppercase tracking-tighter italic">
                  Visitor Dossier
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-2.5 bg-white/10 rounded-full hover:bg-red-500 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-10 bg-white rounded-t-[2.5rem] overflow-y-auto custom-scrollbar flex-1 space-y-8">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                      <FiUser /> Details
                    </h3>
                    <DetailRow
                      label="Name"
                      value={`${selectedLog.lastName}, ${selectedLog.firstName}`}
                      highlight
                    />
                    <DetailRow label="Purpose" value={selectedLog.purpose} />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                      <FiShield /> Staff Handlers
                    </h3>
                    <DetailRow label="Gate (In)" value={selectedLog.timeInBy} />
                    <DetailRow
                      label="Office Staff"
                      value={selectedLog.transactionBy}
                    />
                  </div>
                </div>

                {/* 🔥 CCTV LOGS WITH DELETE */}
                <div className="pt-8 border-t-2 border-slate-100">
                  <h3 className="text-[#0038A8] font-black uppercase text-sm mb-6 flex items-center gap-2">
                    <FiCrosshair /> Surveillance Tracks
                  </h3>
                  {loadingCCTV ? (
                    <FiRefreshCw className="animate-spin mx-auto text-3xl" />
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                      {cctvLogs.map((log) => (
                        <div
                          key={log._id}
                          className="relative bg-slate-900 rounded-3xl overflow-hidden group"
                        >
                          <img
                            src={log.screenshotBase64}
                            className="w-full aspect-video object-cover"
                          />
                          {/* 🔥 DELETE CCTV TRACK */}
                          <button
                            onClick={() => handleDeleteCCTV(log._id)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                          >
                            <FiTrash2 size={12} />
                          </button>
                          <div className="p-4 bg-white">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                              {log.cameraName}
                            </p>
                            <span className="text-[10px] font-black uppercase text-[#0038A8]">
                              {log.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 border-t p-6 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Authorized Records
                </span>
                <button
                  onClick={() => setLogToDelete(selectedLog)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-black text-[10px] uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all"
                >
                  <FiTrash2 size={14} /> Delete Full Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiAlertTriangle size={40} />
              </div>
              <h2 className="text-xl font-black uppercase">Erase Activity?</h2>
              <p className="text-xs text-slate-400 mt-2 mb-8">
                Permanently delete {logToDelete.firstName}'s audit history?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px]"
                >
                  {isDeleting ? "Deleting..." : "Erase Now"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DetailRow = ({ label, value, highlight }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <span
      className={`text-[11px] font-black uppercase ${highlight ? "text-[#0038A8]" : "text-slate-700"}`}
    >
      {value || "---"}
    </span>
  </div>
);

export default AuditTrail;
