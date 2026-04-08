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
  FiLoader,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUser,
  FiVideoOff,
  FiX,
} from "react-icons/fi";

import { Briefcase, LogIn, LogOut } from "lucide-react";

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

  // --- NEW ARCHIVE STATES ---
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveFrom, setArchiveFrom] = useState("");
  const [archiveTo, setArchiveTo] = useState("");
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
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handlePurgeStale = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stale = logs.filter((l) => {
      const logDate = new Date(l.bookingDate);
      return !l.timeIn && logDate < thirtyDaysAgo;
    });

    if (stale.length === 0)
      return alert(
        "System Intelligence: No bookings older than 30 days require purging.",
      );
    if (
      !confirm(
        `CRITICAL ACTION: Purge ${stale.length} unscanned bookings older than 30 days?`,
      )
    )
      return;

    try {
      await Promise.all(stale.map((l) => api.delete(`/bookings/${l._id}`)));
      alert("Database purged of stale records.");
      fetchAuditLogs();
    } catch (err) {
      alert("Purge failed.");
    }
  };

  // --- 🔥 NEW ARCHIVE HANDLER ---
  const executeArchive = async () => {
    if (!archiveFrom || !archiveTo) {
      return alert("Please select both Date From and Date To parameters.");
    }

    if (archiveFrom > archiveTo) {
      return alert("'Date From' cannot be later than 'Date To'.");
    }

    // Filter records safely using ISO date strings
    const recordsToArchive = logs.filter(
      (l) => l.bookingDate >= archiveFrom && l.bookingDate <= archiveTo,
    );

    if (recordsToArchive.length === 0) {
      return alert(
        "System Intelligence: No records found in this specific date range.",
      );
    }

    setIsArchiving(true);
    try {
      const dataStr = JSON.stringify(recordsToArchive, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `UniVentry_Archive_${archiveFrom}_to_${archiveTo}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await Promise.all(
        recordsToArchive.map((l) => api.delete(`/bookings/${l._id}`)),
      );

      fetchAuditLogs();
      setShowArchiveModal(false);
      setArchiveFrom("");
      setArchiveTo("");
    } catch (e) {
      alert("Archiving failed due to a server error.");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteCCTV = async (id: string) => {
    if (!confirm("Erase surveillance track?")) return;
    try {
      await api.delete(`/cctv-logs/${id}`);
      setCctvLogs((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      alert("Delete failed. Backend route required.");
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
      return true;
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
      alert("Deletion error");
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
            <h1 className="text-3xl lg:text-4xl font-black text-[#0038A8] uppercase tracking-tighter italic">
              Audit <span className="text-[#FFD700]">Trail</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Registry Command Hub
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
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest ${timeFilter === f && !customDate ? "bg-[#0038A8] text-white" : "text-slate-400"}`}
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
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase shadow-sm outline-none cursor-pointer"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase outline-none shadow-sm appearance-none cursor-pointer"
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
          {activeTab === "pre-arrivals" ? (
            <button
              onClick={handlePurgeStale}
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <FiTrash2 /> Purge Stale (30d)
            </button>
          ) : (
            // 🔥 OPEN NEW ARCHIVE MODAL INSTEAD OF DIRECT PURGE
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"
            >
              <FiDatabase /> Archive Logs
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
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Visitor
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Contact
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Office
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  Date
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center tracking-widest">
                  Gate In
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center tracking-widest">
                  Office Tx
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-center tracking-widest">
                  Gate Out
                </th>
                <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 text-right tracking-widest">
                  Created By
                </th>
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
                    className="p-16 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest"
                  >
                    End of Log - No Matching Data
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
                    <td className="px-8 py-5 whitespace-nowrap text-[10px] font-black uppercase text-slate-700 bg-slate-100 rounded-full border border-slate-200">
                      {log.office}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[10px] font-bold text-slate-600">
                      {log.bookingDate}
                    </td>
                    {/* 🔥 FIXED hh:mm:ss FORMATTING */}
                    <td className="px-8 py-5 text-center whitespace-nowrap font-mono text-[11px] font-black text-emerald-600">
                      {log.timeIn
                        ? new Date(log.timeIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap font-mono text-[11px] font-bold text-[#0038A8]">
                      {log.transactionTime
                        ? new Date(log.transactionTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap font-mono text-[11px] font-black text-red-500">
                      {log.timeOut
                        ? new Date(log.timeOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
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

      {/* --- 🔥 NEW ARCHIVE MODAL --- */}
      <AnimatePresence>
        {showArchiveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/20 p-10 text-center"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]" />
              <div className="mx-auto w-20 h-20 bg-blue-50 text-[#0038A8] rounded-full flex items-center justify-center mb-6 shadow-inner border border-blue-100">
                <FiDatabase size={32} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 mb-2">
                Archive Database
              </h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-relaxed mb-8">
                Export and purge historical data to maintain system efficiency.
                Select a date range below.
              </p>

              <div className="flex gap-4 mb-8 text-left">
                <div className="flex-1 space-y-2">
                  <label className="text-[9px] font-black uppercase text-[#0038A8] tracking-widest ml-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={archiveFrom}
                    onChange={(e) => setArchiveFrom(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer uppercase"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[9px] font-black uppercase text-[#0038A8] tracking-widest ml-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={archiveTo}
                    onChange={(e) => setArchiveTo(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-700 outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  disabled={isArchiving}
                  className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeArchive}
                  disabled={isArchiving || !archiveFrom || !archiveTo}
                  className="flex-1 py-4 bg-[#0038A8] text-[#FFD700] hover:bg-[#002b82] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {isArchiving ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    "Execute Archive"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL (ORIGINAL DESIGN WITH FIXED WRAPPING & HANDLERS) */}
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
              {/* MODAL HEADER */}
              <div className="bg-[#0038A8] p-8 pb-12 text-center relative shrink-0 shadow-lg">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-lg text-white">
                  <FiUser size={32} />
                </div>
                <h2 className="text-white font-black text-3xl uppercase tracking-tighter">
                  Visitor Details
                </h2>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.4em] mt-1">
                  Registry Record: {selectedLog._id}
                </p>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-6 right-6 p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all z-20"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-10 -mt-8 bg-white rounded-t-[2.5rem] relative z-20 overflow-y-auto custom-scrollbar flex-1 space-y-10">
                <div className="grid lg:grid-cols-3 gap-8">
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                      <FiUser /> Subject Identity
                    </h3>
                    <DetailRow
                      label="Full Name"
                      value={`${selectedLog.lastName}, ${selectedLog.firstName}`}
                      highlight
                    />
                    <DetailRow label="Category" value={selectedLog.category} />
                    <DetailRow label="Email" value={selectedLog.email} />
                    <DetailRow
                      label="Contact"
                      value={selectedLog.phoneNumber}
                    />
                  </div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                      <FiMapPin /> Logistics
                    </h3>
                    <DetailRow label="Destination" value={selectedLog.office} />
                    <DetailRow
                      label="Booking Date"
                      value={selectedLog.bookingDate}
                    />
                    <DetailRow
                      label="Declared Purpose"
                      value={selectedLog.purpose}
                    />
                    <DetailRow
                      label="Registry Status"
                      value={selectedLog.status}
                      customColor="text-emerald-600"
                    />
                  </div>
                  {/* 🔥 FIXED BY HANDLERS */}
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                    <h3 className="text-[#0038A8] font-black uppercase text-xs flex items-center gap-2 tracking-widest">
                      <FiShield /> Authorized Handlers
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
                      label="Stay Duration"
                      value={
                        selectedLog.hours
                          ? `${selectedLog.hours.toFixed(2)} Hours`
                          : "---"
                      }
                    />
                  </div>
                </div>

                {/* TIMESTAMPS (Static/Dummy Display) */}
                <div className="bg-[#0038A8] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                  {/* 🔥 FIXED hh:mm:ss FORMATTING */}
                  {/* Time In */}
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                    <div className="p-2 rounded-xl mb-1 bg-white/10 text-[#FFD700]">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                      Time In
                    </p>
                    <p className="text-xl font-mono font-bold">
                      {selectedLog?.timeIn
                        ? new Date(selectedLog.timeIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                    </p>
                  </div>

                  <div className="h-px w-full md:w-px md:h-12 bg-white/20" />

                  {/* Transaction */}
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                    <div className="p-2 bg-white/10 rounded-xl mb-1">
                      <Briefcase className="w-5 h-5 text-[#FFD700]" />
                    </div>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                      Transaction
                    </p>
                    <p className="text-xl font-mono font-bold">
                      {selectedLog?.transactionTime
                        ? new Date(
                            selectedLog.transactionTime,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                    </p>
                  </div>

                  <div className="h-px w-full md:w-px md:h-12 bg-white/20" />

                  {/* Time Out */}
                  <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center relative z-10">
                    <div className="p-2 rounded-xl mb-1 bg-white/10 text-[#FFD700]">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                      Time Out
                    </p>
                    <p className="text-xl font-mono font-bold">
                      {selectedLog?.timeOut
                        ? new Date(selectedLog.timeOut).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                        : "--:--:--"}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <DocumentCard
                    title="ID Credential (Front)"
                    image={selectedLog.idFront}
                    text={selectedLog.ocrFront}
                    loading={isModalLoading}
                    onClick={() => setFullscreenImage(selectedLog.idFront)}
                  />
                  <DocumentCard
                    title="ID Credential (Back)"
                    image={selectedLog.idBack}
                    text={selectedLog.ocrBack}
                    loading={isModalLoading}
                    onClick={() => setFullscreenImage(selectedLog.idBack)}
                  />
                </div>

                <div className="pt-8 border-t border-slate-100">
                  <h3 className="text-[#0038A8] font-black uppercase text-sm mb-6 flex items-center gap-2 tracking-widest">
                    <FiCrosshair /> Surveillance Tracks
                  </h3>
                  {loadingCCTV ? (
                    <FiRefreshCw className="animate-spin text-3xl mx-auto text-[#0038A8]" />
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {cctvLogs.map((log) => (
                        <div
                          key={log._id}
                          className="relative bg-slate-900 rounded-3xl overflow-hidden group shadow-xl"
                        >
                          <img
                            src={log.screenshotBase64}
                            className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-all"
                          />
                          <button
                            onClick={() => handleDeleteCCTV(log._id)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl z-30"
                          >
                            <FiTrash2 size={12} />
                          </button>
                          <div className="p-4 bg-white border-t border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">
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

              <div className="p-6 bg-slate-50 border-t flex justify-end gap-4 shadow-inner">
                <button
                  onClick={() => setLogToDelete(selectedLog)}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-black text-[10px] uppercase rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <FiTrash2 size={14} /> Delete Audit Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE DIALOG */}
      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600" />
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FiAlertTriangle size={40} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
                Erase Data?
              </h2>
              <p className="text-xs text-slate-400 mt-2 mb-8 uppercase tracking-widest font-bold">
                This action cannot be undone.
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
                  {isDeleting ? "Processing..." : "Confirm Erase"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN PREVIEW */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-110 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setFullscreenImage(null)}
        >
          <img
            src={fullscreenImage}
            className="max-w-full max-h-full rounded-2xl shadow-2xl border-2 border-white/10"
          />
          <FiX className="absolute top-8 right-8 text-white text-3xl opacity-50 hover:opacity-100 transition-opacity" />
        </div>
      )}
    </div>
  );
};

// 🔥 SMART DETAIL ROW (Flow logic, No truncation)
const DetailRow = ({ label, value, highlight, customColor }: any) => (
  <div className="flex flex-col py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">
      {label}
    </span>
    <span
      className={`text-[11px] font-black uppercase tracking-wide leading-relaxed wrap-break-word ${customColor ? customColor : highlight ? "text-[#0038A8]" : "text-slate-700"}`}
    >
      {value || "N/A / PENDING"}
    </span>
  </div>
);

const DocumentCard = ({ title, image, text, onClick, loading }: any) => (
  <div className="space-y-4">
    <h3 className="text-[#0038A8] font-black uppercase text-[10px] flex items-center gap-2 tracking-[0.4em]">
      <FiCreditCard /> {title}
    </h3>
    <div
      className="relative h-56 bg-slate-100 rounded-4xl overflow-hidden border-2 border-slate-200 group cursor-pointer flex items-center justify-center"
      onClick={image ? onClick : undefined}
    >
      {loading ? (
        <FiRefreshCw className="animate-spin text-3xl text-[#0038A8]" />
      ) : image ? (
        <img
          src={image}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
        />
      ) : (
        <FiVideoOff className="text-slate-300" size={32} />
      )}
    </div>
    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-[9px] font-mono text-slate-500 overflow-y-auto max-h-24 custom-scrollbar leading-relaxed uppercase shadow-inner italic">
      {text || "AI Processing Data not found."}
    </div>
  </div>
);

export default AuditTrail;
