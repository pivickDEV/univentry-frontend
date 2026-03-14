/* eslint-disable */
"use client";

import axios from "axios";
import {
  Activity,
  Briefcase,
  Building,
  CheckCircle,
  Clock,
  Filter,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

// --- TYPES ---
interface Booking {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  office: string;
  purpose: string;
  status: string;
  bookingDate: string;
  createdAt: string;
  timeIn?: string;
  transactionTime?: string;
}

interface Office {
  _id: string;
  name: string;
}

const OfficeDashboard = () => {
  // --- STATE ---
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedOffice, setSelectedOffice] = useState("All");

  // --- STATS STATE ---
  const [stats, setStats] = useState({
    incoming: 0,
    served: 0,
    incomingByCategory: {} as Record<string, number>,
    incomingList: [] as Booking[],
    servedList: [] as Booking[],
  });

  // --- FETCH DATA ---
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [bookingRes, officeRes] = await Promise.all([
        axios.get("http://localhost:9000/api/bookings"),
        axios.get("http://localhost:9000/api/offices"),
      ]);

      const safeBookings = Array.isArray(bookingRes.data)
        ? bookingRes.data
        : [];
      const safeOffices = Array.isArray(officeRes.data) ? officeRes.data : [];

      setBookings(safeBookings);
      setOffices(safeOffices);
      calculateStats(safeBookings, selectedOffice);
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- CALCULATE STATS (STRICTLY TODAY ONLY) ---
  const calculateStats = (data: Booking[], filter: string) => {
    if (!data) return;

    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });

    // 1. Strict filter: ONLY TODAY & ONLY SELECTED OFFICE
    const todaysData = data.filter((b) => b.bookingDate === todayStr);
    const relevantData =
      filter === "All"
        ? todaysData
        : todaysData.filter((b) => b.office === filter);

    // 2. Segment the traffic
    // Incoming: Inside the campus, but hasn't transacted at the office yet.
    const incomingTraffic = relevantData.filter(
      (b) => b.status === "On Campus" && !b.transactionTime,
    );

    // Served: Has a transaction time recorded.
    const servedTraffic = relevantData
      .filter((b) => !!b.transactionTime)
      .sort(
        (a, b) =>
          new Date(b.transactionTime!).getTime() -
          new Date(a.transactionTime!).getTime(),
      );

    // 3. Demographics for Incoming
    const incomingCats = incomingTraffic.reduce((acc: any, curr) => {
      const c = curr.category || "Guest";
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    setStats({
      incoming: incomingTraffic.length,
      served: servedTraffic.length,
      incomingByCategory: incomingCats,
      incomingList: incomingTraffic,
      servedList: servedTraffic,
    });
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setCurrentTime(new Date());
    }, 10000); // 10s Refresh Rate
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculateStats(bookings, selectedOffice);
  }, [selectedOffice, bookings]);

  // --- ICONS HELPER ---
  const getIcon = (cat: string) => {
    const safeCat = cat || "";
    if (safeCat.includes("Student")) return <GraduationCap size={14} />;
    if (safeCat.includes("Employee")) return <Briefcase size={14} />;
    return <Users size={14} />;
  };

  return (
    <div className="min-h-220 bg-slate-50 p-4 md:p-8 font-sans text-slate-800 flex flex-col">
      {/* --------------------------- */}
      {/* TOP BAR: HEADER & CLOCK */}
      {/* --------------------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b-2 border-slate-200 pb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#0038A8] text-[#FFD700] p-1.5 rounded-lg shadow-sm">
              <Building size={18} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Department Overview
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
            Office{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
              Console
            </span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* OFFICE FILTER */}
          <div className="relative group w-full sm:w-auto">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0038A8] w-4 h-4" />
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full sm:w-64 p-3 pl-10 bg-white border-2 border-slate-200 rounded-2xl text-xs font-black text-slate-700 outline-none focus:border-[#0038A8] transition-all cursor-pointer appearance-none uppercase tracking-wide shadow-sm"
            >
              <option value="All">All Departments</option>
              {offices.map((o) => (
                <option key={o._id} value={o.name}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* SYNC & CLOCK */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-[#0038A8] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0038A8] hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{" "}
            Refresh
          </button>

          <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="p-2 bg-blue-50 rounded-full text-[#0038A8]">
              <Clock size={20} />
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-slate-800 tabular-nums">
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {currentTime.toLocaleDateString([], {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------- */}
      {/* 2-COLUMN GRID LAYOUT */}
      {/* --------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* ========================================= */}
        {/* COL 1: INCOMING TRAFFIC (Blue Card)       */}
        {/* ========================================= */}
        <div className="flex flex-col gap-6 h-full">
          <div className="bg-[#0038A8] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20 shrink-0 min-h-75 flex flex-col justify-between group">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute top-[-20%] right-[-20%] opacity-20 transition-transform duration-1000 group-hover:rotate-12">
              <Activity size={300} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stats.incoming > 0 ? "bg-red-400" : "bg-emerald-400"}`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${stats.incoming > 0 ? "bg-red-500" : "bg-emerald-500"}`}
                  ></span>
                </span>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  Action Required
                </h2>
              </div>

              <div className="flex items-baseline gap-2">
                <h1 className="text-[8rem] leading-none font-black tracking-tighter text-[#FFD700] drop-shadow-lg">
                  {stats.incoming}
                </h1>
                <span className="text-lg font-bold opacity-50 uppercase -rotate-90 origin-bottom-left mb-6 leading-tight">
                  Incoming
                  <br />
                  Traffic
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-4xl border border-slate-200 shadow-lg flex-1 flex flex-col min-h-75 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm shrink-0">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Users size={16} className="text-[#0038A8]" /> Heading to Office
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {stats.incomingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-40 py-10">
                  <ShieldCheck size={40} className="text-emerald-500 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    No Incoming Traffic
                  </p>
                </div>
              ) : (
                stats.incomingList.map((log) => (
                  <div
                    key={log._id}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase">
                          {log.lastName}, {log.firstName}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-0.5">
                          {getIcon(log.category)} {log.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono font-bold text-[#0038A8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                          Gate In:{" "}
                          {log.timeIn
                            ? new Date(log.timeIn).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--:--"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 bg-white p-3 rounded-xl border border-slate-100 mt-2 shadow-sm">
                      <span className="text-slate-400 uppercase mr-1 block text-[8px] mb-0.5 tracking-widest">
                        Purpose:
                      </span>{" "}
                      {log.purpose}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* COL 2: SERVED / COMPLETED (Emerald Card)  */}
        {/* ========================================= */}
        <div className="flex flex-col gap-6 h-full">
          <div className="bg-emerald-50 rounded-[2.5rem] p-8 border border-emerald-100 shadow-xl relative overflow-hidden shrink-0 min-h-75 flex flex-col justify-between group">
            <div className="absolute top-[-20%] right-[-20%] text-emerald-100 opacity-60 transition-transform duration-1000 group-hover:-rotate-12">
              <CheckCircle size={300} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck size={16} className="text-emerald-600" />
                <h2 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                  Success Metrics
                </h2>
              </div>

              <div className="flex items-baseline gap-2">
                <h1 className="text-[8rem] leading-none font-black tracking-tighter text-emerald-600">
                  {stats.served}
                </h1>
                <span className="text-lg font-bold text-emerald-600/50 uppercase -rotate-90 origin-bottom-left mb-6 leading-tight">
                  Served
                  <br />
                  Today
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-4xl border border-slate-200 shadow-lg flex-1 flex flex-col min-h-75 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm shrink-0">
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" /> Completed
                Transactions
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {stats.servedList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 py-10">
                  <Briefcase size={40} className="mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">
                    No completed transactions
                  </p>
                </div>
              ) : (
                stats.servedList.map((log) => (
                  <div
                    key={log._id}
                    className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100 flex items-start gap-4 hover:bg-emerald-50/60 transition-colors"
                  >
                    <div className="p-3 rounded-xl text-emerald-600 bg-white shadow-sm border border-emerald-50 shrink-0">
                      <CheckCircle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-black text-slate-800 uppercase truncate">
                          {log.lastName}, {log.firstName}
                        </p>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded">
                          {log.transactionTime
                            ? new Date(log.transactionTime).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "--:--"}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mt-0.5">
                          {getIcon(log.category)} {log.category}
                        </p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                          Cleared
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficeDashboard;
