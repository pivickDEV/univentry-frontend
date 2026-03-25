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
  const [activeTab, setActiveTab] = useState<"registry" | "pre-arrivals">(
    "registry",
  );

  const [timeFilter, setTimeFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isArchiving, setIsArchiving] = useState(false);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [cctvLogs, setCctvLogs] = useState<CCTVLog[]>([]);
  const [loadingCCTV, setLoadingCCTV] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
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

  const handleRowClick = async (log: AuditLog) => {
    if (activeTab === "pre-arrivals") return; // Don't open dossier for unscanned users
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
          setCctvLogs(
            res.data.sort(
              (a: any, b: any) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
            ),
          );
        } catch (err) {
          setCctvLogs([]);
        } finally {
          setLoadingCCTV(false);
        }
      };
      fetchTracks();
    }
  }, [selectedLog?._id]);

  // 🔥 NEW: DELETE INDIVIDUAL CCTV TRACK
  const handleDeleteCCTV = async (id: string) => {
    if (!confirm("Remove this surveillance track?")) return;
    try {
      await api.delete(`/cctv-logs/${id}`);
      setCctvLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      alert("Failed to delete track");
    }
  };

  // 🔥 NEW: PURGE 30 DAY OLD UNSCANNED BOOKINGS
  const handlePurgeStaleBookings = async () => {
    const thirtyDaysAgo = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
    const stale = logs.filter(
      (l) => !l.timeIn && new Date(l.bookingDate).getTime() < thirtyDaysAgo,
    );

    if (stale.length === 0)
      return alert("No unscanned bookings older than 30 days found.");

    if (
      confirm(`Delete ${stale.length} unscanned bookings older than 30 days?`)
    ) {
      try {
        await Promise.all(stale.map((l) => api.delete(`/bookings/${l._id}`)));
        alert("System Purge Complete.");
        fetchAuditLogs();
      } catch (e) {
        alert("Purge encountered errors.");
      }
    }
  };

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const fullName = `${log.firstName} ${log.lastName}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchTerm.toLowerCase()) ||
          (log.office || "").toLowerCase().includes(searchTerm.toLowerCase());

        // 🔥 CORE FIX: Filter by Scanned Status
        const isScanned = !!log.timeIn;
        if (activeTab === "registry" && !isScanned) return false;
        if (activeTab === "pre-arrivals" && isScanned) return false;

        if (customDate) return log.bookingDate === customDate;
        if (timeFilter === "all") return matchesSearch;

        const todayStr = new Date().toLocaleDateString("en-CA", {
          timeZone: "Asia/Manila",
        });
        if (timeFilter === "today")
          return log.bookingDate === todayStr && matchesSearch;
        return matchesSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.bookingDate).getTime();
        const timeB = new Date(b.bookingDate).getTime();
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
      alert("Failed to delete.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="max-w-400 mx-auto w-full mb-6 shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-xl shadow-blue-900/20">
            <FiShield size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#0038A8] uppercase tracking-tighter">
              Audit <span className="text-[#FFD700]">Trail</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Registry Control Terminal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 🔥 TAB SWITCHER */}
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab("registry")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "registry" ? "bg-[#0038A8] text-white shadow-lg" : "text-slate-400"}`}
            >
              <FiCheckCircle /> Registry
            </button>
            <button
              onClick={() => setActiveTab("pre-arrivals")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === "pre-arrivals" ? "bg-amber-500 text-white shadow-lg" : "text-slate-400"}`}
            >
              <FiClock /> Pre-Arrivals
            </button>
          </div>

          {activeTab === "pre-arrivals" && (
            <button
              onClick={handlePurgeStaleBookings}
              className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/20 active:scale-95 transition-all"
            >
              Purge 30d Unscanned
            </button>
          )}

          <div className="flex gap-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none shadow-sm"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button
              onClick={fetchAuditLogs}
              className="p-3 bg-white text-[#0038A8] border border-slate-200 rounded-xl shadow-sm active:scale-95"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-400 mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-6 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 mb-6 shrink-0">
          <div className="pl-3">
            <FiSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="SEARCH LOGS..."
            className="w-full lg:w-96 py-2.5 font-bold text-slate-700 outline-none uppercase text-xs bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto border border-slate-100 rounded-3xl relative">
          <table className="w-full text-left border-collapse min-w-250">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
              <tr>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400">
                  Visitor
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400">
                  Hub
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center">
                  Date
                </th>
                {activeTab === "registry" ? (
                  <>
                    <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center">
                      In
                    </th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center">
                      Tx
                    </th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center">
                      Out
                    </th>
                  </>
                ) : (
                  <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-right">
                    Delete
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-8 py-6">
                      <div className="h-6 bg-slate-50 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-20 text-center text-slate-300 font-black uppercase text-[10px]"
                  >
                    No logs found in this category
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
                      <p className="font-black text-[#0038A8] text-sm uppercase">
                        {log.lastName}, {log.firstName}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {log.category}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[10px] font-black text-slate-600 uppercase bg-slate-100 px-3 py-1.5 rounded-lg">
                        {log.office}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center text-[10px] font-bold text-slate-500">
                      {log.bookingDate}
                    </td>
                    {activeTab === "registry" ? (
                      <>
                        <td className="px-8 py-5 text-center font-mono text-[11px] font-black text-emerald-600">
                          {log.timeIn
                            ? new Date(log.timeIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </td>
                        <td className="px-8 py-5 text-center font-mono text-[11px] font-bold text-[#0038A8]">
                          {log.transactionTime
                            ? new Date(log.transactionTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "--:--"}
                        </td>
                        <td className="px-8 py-5 text-center font-mono text-[11px] font-black text-red-500">
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
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <FiTrash2 size={16} />
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

      {/* DOSSIER MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-6xl max-h-[95vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
            >
              <div className="bg-[#0038A8] p-8 text-white flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                  Visitor Dossier
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-3 bg-white/10 rounded-full hover:bg-red-500 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-10 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <h3 className="text-[#0038A8] font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      <FiUser /> Personal Profile
                    </h3>
                    <DetailRow
                      label="Name"
                      value={`${selectedLog.lastName}, ${selectedLog.firstName}`}
                      highlight
                    />
                    <DetailRow label="Category" value={selectedLog.category} />
                    <DetailRow label="Purpose" value={selectedLog.purpose} />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    <h3 className="text-[#0038A8] font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                      <FiShield /> Surveillance Summary
                    </h3>
                    <DetailRow
                      label="Time In"
                      value={selectedLog.timeInBy}
                      highlight
                    />
                    <DetailRow
                      label="Office Staff"
                      value={selectedLog.transactionBy}
                    />
                    <DetailRow
                      label="Total Hours"
                      value={selectedLog.hours?.toFixed(2)}
                    />
                  </div>
                </div>

                {/* 🔥 CCTV TRACKS WITH DELETE */}
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-[#0038A8] font-black uppercase text-[10px] tracking-widest mb-6 flex items-center gap-2">
                    <FiCrosshair /> AI Tracking History
                  </h3>
                  {loadingCCTV ? (
                    <FiRefreshCw className="animate-spin text-[#0038A8] mx-auto text-3xl" />
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {cctvLogs.map((log) => (
                        <div
                          key={log._id}
                          className="relative bg-slate-900 rounded-3xl overflow-hidden group shadow-lg"
                        >
                          <img
                            src={log.screenshotBase64}
                            className="w-full aspect-video object-cover"
                          />
                          <button
                            onClick={() => handleDeleteCCTV(log._id)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                          >
                            <FiTrash2 size={12} />
                          </button>
                          <div className="p-4 bg-white">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
                              {log.cameraName}
                            </p>
                            <span className="text-[9px] font-black uppercase text-[#0038A8]">
                              {log.status} | {log.confidence}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t flex justify-end gap-4">
                <button
                  onClick={() => setLogToDelete(selectedLog)}
                  className="px-6 py-3 bg-red-50 text-red-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                >
                  <FiTrash2 /> Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FiAlertTriangle size={40} />
              </div>
              <h2 className="text-xl font-black uppercase text-slate-800">
                Erase Activity?
              </h2>
              <p className="text-xs text-slate-400 mt-2 mb-8 leading-relaxed">
                Warning: This will permanently remove {logToDelete.firstName}'s
                audit history and biometric data from the server.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setLogToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-red-900/20"
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
