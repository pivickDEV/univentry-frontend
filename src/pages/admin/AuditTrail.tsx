/* eslint-disable */
"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiCrosshair,
  FiDatabase,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiVideoOff,
  FiX,
} from "react-icons/fi";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

const AuditTrail = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"registry" | "pre-arrivals">(
    "registry",
  );

  const [timeFilter, setTimeFilter] = useState("today");
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isArchiving, setIsArchiving] = useState(false);

  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [cctvLogs, setCctvLogs] = useState<any[]>([]);
  const [loadingCCTV, setLoadingCCTV] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [logToDelete, setLogToDelete] = useState<any>(null);
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

  // 🔥 PURGE 30 DAY STALE LOGIC
  const handlePurgeStale = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stale = logs.filter((l) => {
      const logDate = new Date(l.bookingDate);
      return !l.timeIn && logDate < thirtyDaysAgo;
    });

    if (stale.length === 0)
      return alert(
        "System Check: No unscanned bookings found older than 30 days.",
      );
    if (!confirm(`Delete ${stale.length} stale bookings older than 30 days?`))
      return;

    try {
      await Promise.all(stale.map((l) => api.delete(`/bookings/${l._id}`)));
      alert("Purge successful.");
      fetchAuditLogs();
    } catch (err) {
      alert("Purge failed partially.");
    }
  };

  // 🔥 ARCHIVE LOGIC (Download + Delete)
  const handleArchive = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldRecords = logs.filter(
      (l) => new Date(l.bookingDate) < thirtyDaysAgo,
    );

    if (oldRecords.length === 0)
      return alert("No records older than 30 days available for archiving.");
    if (!confirm(`Archive and delete ${oldRecords.length} records?`)) return;

    setIsArchiving(true);
    try {
      const dataStr = JSON.stringify(oldRecords, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Audit_Archive_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await Promise.all(
        oldRecords.map((l) => api.delete(`/bookings/${l._id}`)),
      );
      fetchAuditLogs();
    } catch (e) {
      alert("Archive failed.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteCCTV = async (id: string) => {
    if (!confirm("Delete surveillance track?")) return;
    try {
      await api.delete(`/cctv-logs/${id}`);
      setCctvLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      alert("Failed to delete track. Ensure backend DELETE route exists.");
    }
  };

  const handleRowClick = async (log: any) => {
    setSelectedLog(log);
    setIsModalLoading(true);
    try {
      const res = await api.get(`/bookings/${log._id}`);
      if (res.data) setSelectedLog((prev: any) => ({ ...prev, ...res.data }));
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
          setCctvLogs(res.data || []);
        } catch (err) {
          setCctvLogs([]);
        } finally {
          setLoadingCCTV(false);
        }
      };
      fetchTracks();
    }
  }, [selectedLog?._id]);

  // 🔥 FIXED FILTER LOGIC (Today vs Yesterday vs All)
  const filteredLogs = useMemo(() => {
    const manilaNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
    );
    const todayStr = manilaNow.toLocaleDateString("en-CA");

    const yesterday = new Date(manilaNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");

    const filtered = logs.filter((log) => {
      const fullName = `${log.firstName} ${log.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchTerm.toLowerCase()) ||
        (log.office || "").toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const isScanned = !!log.timeIn;
      if (activeTab === "registry" && !isScanned) return false;
      if (activeTab === "pre-arrivals" && isScanned) return false;

      if (customDate) return log.bookingDate === customDate;
      if (timeFilter === "today") return log.bookingDate === todayStr;
      if (timeFilter === "yesterday") return log.bookingDate === yesterdayStr;
      return true; // "all"
    });

    return filtered.sort((a, b) => {
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
      alert("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* HEADER SECTION */}
      <div className="max-w-400 mx-auto w-full mb-6 shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-xl">
            <FiShield size={32} />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-[#0038A8] uppercase tracking-tighter">
              Audit <span className="text-[#FFD700]">Trail</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Registry Control Center
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button
              onClick={() => setActiveTab("registry")}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === "registry" ? "bg-[#0038A8] text-white" : "text-slate-400"}`}
            >
              <FiCheckCircle /> Registry
            </button>
            <button
              onClick={() => setActiveTab("pre-arrivals")}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === "pre-arrivals" ? "bg-amber-500 text-white" : "text-slate-400"}`}
            >
              <FiClock /> Pre-Arrivals
            </button>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            {["today", "yesterday", "all"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setTimeFilter(f);
                  setCustomDate("");
                }}
                className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${timeFilter === f && !customDate ? "bg-[#0038A8] text-white" : "text-slate-400"}`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase shadow-sm outline-none"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase shadow-sm appearance-none outline-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
            <button
              onClick={fetchAuditLogs}
              className="p-2.5 bg-white text-[#0038A8] border border-slate-200 rounded-xl shadow-sm"
            >
              <FiRefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
          {activeTab === "pre-arrivals" ? (
            <button
              onClick={handlePurgeStale}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2"
            >
              <FiTrash2 /> Purge 30d Bookings
            </button>
          ) : (
            <button
              onClick={handleArchive}
              disabled={isArchiving}
              className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2"
            >
              <FiDatabase className={isArchiving ? "animate-pulse" : ""} />{" "}
              Archive Logs (30d)
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-400 mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-8 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 shrink-0">
          <div className="pl-3">
            <FiSearch className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="SEARCH VISITOR IDENTITY..."
            className="flex-1 py-2.5 font-bold text-slate-700 outline-none uppercase text-xs bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-auto border border-slate-200 rounded-3xl bg-slate-50 relative">
          <table className="w-full text-left border-collapse table-auto min-w-300">
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
                [...Array(6)].map((_, i) => (
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
                    className="p-16 text-center text-slate-400 text-xs font-black uppercase tracking-widest"
                  >
                    No Logs Found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => handleRowClick(log)}
                    className="group hover:bg-blue-50/50 bg-white transition-all cursor-pointer"
                  >
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="font-black text-[#0038A8] text-sm uppercase">
                        {log.lastName}, {log.firstName}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[10px] font-bold text-slate-500 font-mono">
                      {log.phoneNumber}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[10px] font-black uppercase text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      {log.office}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[10px] font-bold text-slate-600">
                      {log.bookingDate}
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap font-mono text-[11px] font-black text-emerald-600">
                      {log.timeIn
                        ? new Date(log.timeIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap font-mono text-[11px] font-bold text-[#0038A8]">
                      {log.transactionTime
                        ? new Date(log.transactionTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap font-mono text-[11px] font-black text-red-500">
                      {log.timeOut
                        ? new Date(log.timeOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap font-black text-[9px] text-slate-500 uppercase">
                      {log.actionBy || "SYSTEM"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL (ORIGINAL HIGH-END DESIGN RESTORED) */}
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
              <div className="bg-[#0038A8] p-8 pb-12 text-center relative shrink-0">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg text-white">
                  <FiUser size={32} />
                </div>
                <h2 className="text-white font-black text-3xl uppercase tracking-wide">
                  Visitor Details
                </h2>
                <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mt-1">
                  Ref ID: {selectedLog._id}
                </p>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-6 right-6 p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-colors z-20"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-10 -mt-8 bg-white rounded-t-[2.5rem] relative z-20 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                      <FiUser /> Identification
                    </h3>
                    <DetailRow
                      label="Full Name"
                      value={`${selectedLog.lastName}, ${selectedLog.firstName}`}
                      highlight
                    />
                    <DetailRow label="Category" value={selectedLog.category} />
                    <DetailRow label="Email" value={selectedLog.email} />
                    <DetailRow label="Phone" value={selectedLog.phoneNumber} />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                      <FiMapPin /> Logistics
                    </h3>
                    <DetailRow label="Destination" value={selectedLog.office} />
                    <DetailRow label="Date" value={selectedLog.bookingDate} />
                    <DetailRow label="Purpose" value={selectedLog.purpose} />
                    <DetailRow
                      label="Status"
                      value={selectedLog.status}
                      customColor="text-emerald-600"
                    />
                  </div>
                  {/* 🔥 HANDLER BY FIELDS RESTORED */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                      <FiShield /> Handlers
                    </h3>
                    <DetailRow
                      label="Entry Guard"
                      value={selectedLog.timeInBy}
                      highlight
                    />
                    <DetailRow
                      label="Office Staff"
                      value={selectedLog.transactionBy}
                      highlight
                    />
                    <DetailRow
                      label="Exit Guard"
                      value={selectedLog.timeOutBy}
                      highlight
                    />
                    <DetailRow
                      label="Stay (H)"
                      value={selectedLog.hours?.toFixed(2)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <DocumentCard
                    title="ID (Front)"
                    image={selectedLog.idFront}
                    text={selectedLog.ocrFront}
                    loading={isModalLoading}
                    onClick={() => setFullscreenImage(selectedLog.idFront)}
                  />
                  <DocumentCard
                    title="ID (Back)"
                    image={selectedLog.idBack}
                    text={selectedLog.ocrBack}
                    loading={isModalLoading}
                    onClick={() => setFullscreenImage(selectedLog.idBack)}
                  />
                </div>

                {/* CCTV WITH WORKING DELETE UI */}
                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-[#0038A8] font-black uppercase text-sm mb-6 flex items-center gap-2 tracking-widest">
                    <FiCrosshair /> AI Surveillance Tracks
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
                            className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <button
                            onClick={() => handleDeleteCCTV(log._id)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl z-20"
                          >
                            <FiTrash2 size={12} />
                          </button>
                          <div className="p-4 bg-white">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest">
                              {log.cameraName}
                            </p>
                            <span className="text-[9px] font-black uppercase text-[#0038A8]">
                              {log.status} | {log.confidence}% MATCH
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
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all"
                >
                  <FiTrash2 size={14} /> Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION */}
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
              <h2 className="text-xl font-black uppercase tracking-tighter text-slate-800">
                Erase Data?
              </h2>
              <p className="text-xs text-slate-400 mt-2 mb-8 italic tracking-widest">
                ID: {logToDelete._id}
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
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl"
                >
                  {isDeleting ? "Deleting..." : "Erase Now"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            className="max-w-full max-h-full rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

// HELPERS
const DetailRow = ({ label, value, highlight, customColor }: any) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
      {label}
    </span>
    <span
      className={`text-[11px] font-black uppercase tracking-widest truncate max-w-[150px] ${customColor ? customColor : highlight ? "text-[#0038A8]" : "text-slate-700"}`}
    >
      {value || "---"}
    </span>
  </div>
);

const DocumentCard = ({ title, image, text, onClick, loading }: any) => (
  <div className="space-y-4">
    <h3 className="text-[#0038A8] font-black uppercase text-[10px] flex items-center gap-2 tracking-[0.3em]">
      <FiCreditCard /> {title}
    </h3>
    <div
      className="relative h-56 bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200 group cursor-pointer flex items-center justify-center"
      onClick={image ? onClick : undefined}
    >
      {loading ? (
        <FiRefreshCw className="animate-spin text-[#0038A8] text-3xl" />
      ) : image ? (
        <img
          src={image}
          className="w-full h-full object-cover group-hover:scale-105 transition-all"
        />
      ) : (
        <FiVideoOff className="text-slate-300" size={32} />
      )}
    </div>
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-500 overflow-y-auto max-h-24 custom-scrollbar leading-relaxed uppercase">
      {text || "No OCR extraction found."}
    </div>
  </div>
);

export default AuditTrail;
