/* eslint-disable */
"use client";

import axios from "axios";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Calendar,
  Clock,
  GraduationCap,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

// --- API INSTANCE ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// --- TYPES ---
interface Booking {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  office: string;
  status: string;
  bookingDate: string;
  timeIn?: string;
  transactionTime?: string;
  timeOut?: string;
  updatedAt: string;
}

interface WatchlistItem extends Booking {
  alertType: "OVERSTAY" | "UNACCOUNTED";
  minsInside: number;
}

const GuardDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 🔥 NEW: Track manual refresh
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- STATS STATE ---
  const [stats, setStats] = useState({
    totalActive: 0,
    totalPending: 0,
    entriesToday: 0,
    exitsToday: 0,
    activeByCategory: {} as Record<string, number>,
    pendingByCategory: {} as Record<string, number>,
    topOffice: { name: "None", count: 0 },
    watchlist: [] as WatchlistItem[],
  });

  // --- FETCH DATA ---
  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);

    try {
      const { data } = await api.get("/bookings");
      const allBookings = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      processStats(allBookings);
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  };

  // --- PROCESS DATA (STRICTLY TODAY ONLY) ---
  const processStats = (data: Booking[]) => {
    const todayStr = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Manila",
    });
    const now = new Date();

    // 1. FILTER FOR TODAY ONLY
    const todaysBookings = data.filter((b) => b.bookingDate === todayStr);

    let activeCount = 0;
    let pendingCount = 0;
    let entries = 0;
    let exits = 0;

    const activeCats: Record<string, number> = {};
    const pendingCats: Record<string, number> = {};
    const activeOffices: Record<string, number> = {};
    const securityWatchlist: WatchlistItem[] = [];

    todaysBookings.forEach((b) => {
      // Count total gate movements for today
      if (b.timeIn) entries++;
      if (b.timeOut) exits++;

      if (b.status === "On Campus") {
        activeCount++;

        // Demographics mapping
        const cat = b.category || "Guest";
        activeCats[cat] = (activeCats[cat] || 0) + 1;

        // Office hotspot mapping
        const office = b.office || "General";
        activeOffices[office] = (activeOffices[office] || 0) + 1;

        // --- SECURITY WATCHLIST LOGIC ---
        if (b.timeIn) {
          const timeInDate = new Date(b.timeIn).getTime();
          const minsInside = Math.floor(
            (now.getTime() - timeInDate) / (1000 * 60),
          );

          if (minsInside > 30) {
            // Rule 1: Exceeded 30 minutes inside (Campus Overstay Limit)
            securityWatchlist.push({ ...b, alertType: "OVERSTAY", minsInside });
          } else if (!b.transactionTime && minsInside > 15) {
            // Rule 2: Inside for > 15 mins but NEVER reached their destination office
            securityWatchlist.push({
              ...b,
              alertType: "UNACCOUNTED",
              minsInside,
            });
          }
        }
      } else if (b.status === "Approved") {
        pendingCount++;
        const cat = b.category || "Guest";
        pendingCats[cat] = (pendingCats[cat] || 0) + 1;
      }
    });

    // Find the most populated office right now
    let topName = "None";
    let topCount = 0;
    Object.entries(activeOffices).forEach(([name, count]) => {
      if (count > topCount) {
        topCount = count;
        topName = name;
      }
    });

    // Sort watchlist: Longest time inside appears first
    securityWatchlist.sort((a, b) => b.minsInside - a.minsInside);

    setStats({
      totalActive: activeCount,
      totalPending: pendingCount,
      entriesToday: entries,
      exitsToday: exits,
      activeByCategory: activeCats,
      pendingByCategory: pendingCats,
      topOffice: { name: topName, count: topCount },
      watchlist: securityWatchlist,
    });
  };

  // --- EFFECTS ---
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setCurrentTime(new Date());
    }, 5000); // 5s Refresh Rate
    return () => clearInterval(interval);
  }, []);

  // --- HELPER ICONS ---
  const getIcon = (cat: string) => {
    if (cat.includes("Student")) return <GraduationCap size={14} />;
    if (cat.includes("Employee")) return <Briefcase size={14} />;
    return <Users size={14} />;
  };

  // --- FORMAT TIME HELPER ---
  const formatDuration = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m} mins`;
  };

  return (
    <div className="min-h-220 bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      {/* --------------------------- */}
      {/* TOP BAR: HEADER & CLOCK */}
      {/* --------------------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#0038A8] text-[#FFD700] p-1.5 rounded-lg shadow-sm">
              <ShieldAlert size={18} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              RTU Security Protocol
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
            Guard{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
              Dashboard
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* 🔥 NEW: MANUAL REFRESH BUTTON */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-[#0038A8] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0038A8] hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />{" "}
            Refresh
          </button>

          {/* CLOCK */}
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
      {/* GRID LAYOUT */}
      {/* --------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">
        {/* ========================================= */}
        {/* COL 1: LIVE ACTIVE (Inside Now)           */}
        {/* ========================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* BIG BLUE CARD */}
          <div className="bg-[#0038A8] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20 flex-1 min-h-75 flex flex-col justify-between group">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute top-[-20%] right-[-20%] opacity-20 transition-transform duration-1000 group-hover:rotate-12">
              <Activity size={300} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  Live Census
                </h2>
              </div>

              <div className="flex items-baseline gap-2">
                <h1 className="text-[8rem] leading-none font-black tracking-tighter text-[#FFD700] drop-shadow-lg">
                  {stats.totalActive}
                </h1>
                <span className="text-xl font-bold opacity-50 uppercase -rotate-90 origin-bottom-left mb-8">
                  Active
                </span>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                  Hotspot Zone
                </p>
                <p className="text-sm font-bold truncate text-[#FFD700]">
                  {stats.topOffice.name}
                </p>
                <p className="text-[9px] opacity-80">
                  {stats.topOffice.count > 0
                    ? `${stats.topOffice.count} people`
                    : "Empty"}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                  Last Sync
                </p>
                <div className="flex items-center gap-2 text-emerald-400 mt-1">
                  <RefreshCw size={14} className="animate-spin-slow" />
                  <span className="text-xs font-bold">Live Feed</span>
                </div>
              </div>
            </div>
          </div>

          {/* BREAKDOWN LIST */}
          <div className="bg-white rounded-4xl p-6 border border-slate-200 shadow-lg flex-1 min-h-50">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users size={16} className="text-[#0038A8]" /> Active Demographics
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.activeByCategory).map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-[#0038A8] shadow-sm">
                      {getIcon(cat)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">
                      {cat}
                    </span>
                  </div>
                  <span className="text-lg font-black text-slate-800">
                    {count}
                  </span>
                </div>
              ))}
              {Object.keys(stats.activeByCategory).length === 0 && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-8">
                  Campus is currently empty.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* COL 2: GATE OPERATIONS & WATCHLIST        */}
        {/* ========================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* GATE COUNTERS */}
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-emerald-50 border border-emerald-100 rounded-4xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-emerald-200 group-hover:scale-110 transition-transform">
                <LogIn size={40} />
              </div>
              <h3 className="text-4xl font-black text-emerald-700 leading-none relative z-10">
                {stats.entriesToday}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/70 mt-2 relative z-10">
                Cleared IN
              </p>
            </div>
            <div className="bg-slate-200 border border-slate-300 rounded-4xl p-6 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-slate-300 group-hover:scale-110 transition-transform">
                <LogOut size={40} />
              </div>
              <h3 className="text-4xl font-black text-slate-700 leading-none relative z-10">
                {stats.exitsToday}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2 relative z-10">
                Cleared OUT
              </p>
            </div>
          </div>

          {/* SECURITY WATCHLIST FEED */}
          <div className="bg-white rounded-4xl border border-slate-200 shadow-xl overflow-hidden flex flex-col flex-1 min-h-100">
            <div className="p-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert
                    size={16}
                    className={
                      stats.watchlist.length > 0
                        ? "text-red-500"
                        : "text-[#0038A8]"
                    }
                  />
                  Security Watchlist
                </h3>
                {stats.watchlist.length > 0 && (
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-black">
                    {stats.watchlist.length} Alert
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {stats.watchlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-emerald-500 opacity-60 py-10">
                  <ShieldCheck size={48} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    All Clear
                  </p>
                  <p className="text-xs font-bold text-center mt-1 text-emerald-600/70">
                    No security anomalies detected.
                  </p>
                </div>
              ) : (
                stats.watchlist.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-start gap-4 ${
                      alert.alertType === "OVERSTAY"
                        ? "bg-red-50 border-red-200"
                        : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl border shrink-0 ${
                        alert.alertType === "OVERSTAY"
                          ? "bg-red-100 border-red-300 text-red-600"
                          : "bg-amber-100 border-amber-300 text-amber-600"
                      }`}
                    >
                      <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`text-sm font-black uppercase truncate ${alert.alertType === "OVERSTAY" ? "text-red-800" : "text-amber-800"}`}
                        >
                          {alert.lastName}, {alert.firstName}
                        </h4>
                        <span
                          className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border ${
                            alert.alertType === "OVERSTAY"
                              ? "bg-red-600 text-white border-red-700"
                              : "bg-amber-500 text-white border-amber-600"
                          }`}
                        >
                          {formatDuration(alert.minsInside)}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] font-bold uppercase ${alert.alertType === "OVERSTAY" ? "text-red-600/80" : "text-amber-700/80"}`}
                      >
                        Target: {alert.office}
                      </p>
                      <p
                        className={`text-[9px] font-black uppercase tracking-widest mt-2 ${alert.alertType === "OVERSTAY" ? "text-red-500" : "text-amber-600"}`}
                      >
                        {alert.alertType === "OVERSTAY"
                          ? "Exceeded 30 minutes Limit"
                          : "Loitering / Did not scan at office"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* COL 3: PENDING ARRIVALS (White Card)      */}
        {/* ========================================= */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* BIG WHITE CARD */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl relative overflow-hidden flex-1 min-h-75 flex flex-col justify-between group">
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>
            <div className="absolute top-[-20%] right-[-20%] text-slate-100 opacity-80 transition-transform duration-1000 group-hover:-rotate-12">
              <Ticket size={300} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Calendar size={16} className="text-[#0038A8]" />
                <h2 className="text-[10px] font-black text-[#0038A8] uppercase tracking-[0.2em]">
                  Today's Manifest
                </h2>
              </div>

              <div className="flex items-baseline gap-2">
                <h1 className="text-[8rem] leading-none font-black tracking-tighter text-[#0038A8] drop-shadow-sm">
                  {stats.totalPending}
                </h1>
                <span className="text-xl font-bold text-slate-400 uppercase -rotate-90 origin-bottom-left mb-8 whitespace-nowrap">
                  Pending
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Status Report
                </p>
                <p className="text-xs font-bold text-slate-600">
                  {stats.totalPending === 0
                    ? "All scheduled visitors have arrived."
                    : `${stats.totalPending} visitors approved but not yet on campus.`}
                </p>
              </div>
            </div>
          </div>

          {/* BREAKDOWN LIST (Pending) */}
          <div className="bg-white rounded-4xl p-6 border border-slate-200 shadow-lg flex-1 min-h-50">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-[#0038A8]" /> Expected
              Demographics
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.pendingByCategory).map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm border border-slate-100">
                      {getIcon(cat)}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {cat}
                    </span>
                  </div>
                  <span className="text-lg font-black text-[#0038A8]">
                    {count as number}
                  </span>
                </div>
              ))}
              {Object.keys(stats.pendingByCategory).length === 0 && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-8">
                  No pending arrivals.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardDashboard;
