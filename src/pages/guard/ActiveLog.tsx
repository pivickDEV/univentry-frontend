/* eslint-disable */
"use client";

import axios from "axios";
import { motion } from "framer-motion";
import {
  Activity,
  Briefcase,
  Camera,
  CheckCircle,
  Clock, // Added for CCTV UI
  Eye,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCCTV } from "../context/CCTVContext"; // 🔥 Import CCTV Context

// --- API INSTANCE ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// --- TYPES ---
interface Visitor {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  office: string;
  purpose: string;
  status: string;
  timeIn: string;
  bookingDate: string;
  transactionTime?: string;
  timeOut?: string;
}

const ActiveLog = () => {
  // 🔥 Pull real-time logs from Background Surveillance
  const { logs } = useCCTV();

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [now, setNow] = useState(new Date());

  // Update "Last Seen" timer every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // --- FETCH DATA (STRICTLY TODAY) ---
  const fetchActiveVisitors = async () => {
    setRefreshing(true);
    try {
      const res = await api.get("/bookings");
      const todayStr = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
      });

      const activeOnly = res.data.filter(
        (b: Visitor) =>
          b.status === "On Campus" &&
          b.timeIn &&
          !b.timeOut &&
          b.bookingDate === todayStr,
      );

      setVisitors(activeOnly);
    } catch (err) {
      console.error("Failed to fetch active log:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveVisitors();
    const interval = setInterval(fetchActiveVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- FILTERING ---
  const filteredVisitors = useMemo(() => {
    return visitors
      .filter((v) => {
        const searchStr =
          `${v.firstName} ${v.lastName} ${v.office}`.toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
      })
      .sort(
        (a, b) => new Date(b.timeIn).getTime() - new Date(a.timeIn).getTime(),
      );
  }, [visitors, searchTerm]);

  // --- TIME CALCULATORS ---
  const getMinutesInside = (timeIn: string) => {
    const diff = now.getTime() - new Date(timeIn).getTime();
    return Math.floor(diff / 60000);
  };

  const getLastSeenText = (timestamp: string) => {
    const diffMs = now.getTime() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "Just now";
    const mins = Math.floor(diffSec / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-800 flex flex-col overflow-hidden">
      <div className="max-w-[1600px] mx-auto w-full flex flex-col h-full">
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-6 shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#0038A8] text-[#FFD700] p-2 rounded-xl shadow-lg">
                <Activity size={16} strokeWidth={3} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Security Operations
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
              Active{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
                Roster
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Live Campus Census - Monitoring Integrated
            </p>
          </div>

          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search visitor or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-xs text-slate-700 outline-none focus:border-[#0038A8] focus:bg-white transition-all"
              />
            </div>

            <button
              onClick={fetchActiveVisitors}
              disabled={refreshing}
              className="p-3 bg-white border border-slate-200 text-[#0038A8] rounded-xl hover:bg-blue-50 transition-all shadow-sm shrink-0"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* --- LIVE STATS BAR --- */}
        <div className="flex gap-4 mb-6 shrink-0 overflow-x-auto no-scrollbar pb-2">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-6 py-4 flex items-center gap-4 min-w-50">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest">
                Currently Inside
              </p>
              <p className="text-2xl font-black text-emerald-700 leading-none mt-1">
                {visitors.length}
              </p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 flex items-center gap-4 min-w-50">
            <div className="p-2 bg-blue-100 text-[#0038A8] rounded-xl">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#0038A8]/60 uppercase tracking-widest">
                Surveillance
              </p>
              <p className="text-sm font-black text-[#0038A8] leading-none mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0038A8] animate-pulse"></span>{" "}
                Tracking Active
              </p>
            </div>
          </div>
        </div>

        {/* --- HIGH DENSITY TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-4xl shadow-xl flex-1 flex flex-col overflow-hidden relative">
          <div className="overflow-auto flex-1 custom-scrollbar relative">
            <table className="w-full text-left border-collapse table-auto relative min-w-[1000px]">
              <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-100">
                <tr className="bg-slate-50/95 backdrop-blur-md">
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Visitor Identity
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Destination
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Gate Entry
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Surveillance Track
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6">
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                      <Shield size={48} className="mb-4 mx-auto opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Campus is empty
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((v) => {
                    const minsInside = getMinutesInside(v.timeIn);
                    const isWarning = minsInside > 240;

                    // 🔥 Find the latest CCTV hit for this specific visitor
                    const latestDetection = logs.find(
                      (l: any) => l.visitorId === v._id,
                    );

                    return (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={v._id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* Identity */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${isWarning ? "bg-red-500" : "bg-[#0038A8]"}`}
                            >
                              {v.firstName[0]}
                            </div>
                            <div>
                              <p
                                className={`font-black text-sm uppercase ${isWarning ? "text-red-600" : "text-[#0038A8]"}`}
                              >
                                {v.lastName}, {v.firstName}
                              </p>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200 mt-1 inline-block">
                                {v.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#0038A8]/60" />
                            <div>
                              <p className="text-xs font-black text-slate-700 uppercase">
                                {v.office}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 truncate max-w-37.5">
                                {v.purpose}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Entry Time */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded inline-block w-max border border-slate-200">
                              {new Date(v.timeIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span
                              className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${isWarning ? "text-red-500" : "text-emerald-500"}`}
                            >
                              <Clock size={10} /> {minsInside}m inside
                            </span>
                          </div>
                        </td>

                        {/* 🔥 SURVEILLANCE TRACK (HH:MM:SS + Camera + Last Seen) */}
                        <td className="px-6 py-5 whitespace-nowrap">
                          {latestDetection ? (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-[#0038A8]/10 rounded-lg text-[#0038A8]">
                                  <Camera size={12} />
                                </div>
                                <span className="text-[10px] font-black uppercase text-slate-700 tracking-tight">
                                  {latestDetection.cameraName?.split(
                                    "|||",
                                  )[0] || "Unknown Node"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-[#0038A8] font-mono bg-blue-50 px-2 py-0.5 rounded">
                                  {new Date(
                                    latestDetection.timestamp,
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: false,
                                  })}
                                </span>
                                <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-tighter">
                                  <Eye size={10} />{" "}
                                  {getLastSeenText(latestDetection.timestamp)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 opacity-30">
                              <Camera size={14} className="text-slate-400" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">
                                No Optical Hit
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Office Status */}
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          {v.transactionTime ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              <CheckCircle size={12} strokeWidth={3} /> Cleared
                              Office
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 border border-yellow-100 text-yellow-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              <Briefcase size={12} strokeWidth={3} /> Pending
                              Office
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveLog;
