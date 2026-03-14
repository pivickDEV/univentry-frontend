/* eslint-disable */
"use client";

import axios from "axios";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  GraduationCap,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

// 🚀 VERCEL PREP: Global API Instance with Tunnel Headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
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

const AdminDashboard = () => {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- STATS STATE ---
  const [stats, setStats] = useState({
    totalActive: 0,
    totalToday: 0,
    overstayed: 0,
    byCategory: {} as Record<string, number>,
    topOffices: [] as [string, number][],
    busiestOffice: "None",
    funnel: {
      arrived: 0,
      atOffice: 0,
      departed: 0,
    },
  });

  // --- FETCH & FILTER DATA (TODAY ONLY) ---
  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data } = await api.get("/bookings");
      const allBookings = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];

      // 🚀 STRICT FILTER: ONLY TODAY'S RECORDS
      const todayStr = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
      });
      const todaysBookings = allBookings.filter(
        (b: Booking) => b.bookingDate === todayStr,
      );

      processStats(todaysBookings);
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- PROCESS ADMIN METRICS ---
  const processStats = (todaysData: Booking[]) => {
    const now = new Date();

    let activeCount = 0;
    let overstayCount = 0;
    const catMap: Record<string, number> = {};
    const officeMap: Record<string, number> = {};

    const funnelStats = { arrived: 0, atOffice: 0, departed: 0 };

    todaysData.forEach((b) => {
      // 1. Office Map for Manifest
      const office = b.office || "General";
      officeMap[office] = (officeMap[office] || 0) + 1;

      // 2. Operational Funnel Counters
      if (b.timeIn) funnelStats.arrived++;
      if (b.transactionTime) funnelStats.atOffice++;
      if (b.timeOut) funnelStats.departed++;

      // 3. Active Census & Demographics (Currently inside)
      if (b.status === "On Campus" && !b.timeOut) {
        activeCount++;
        const cat = b.category || "Guest";
        catMap[cat] = (catMap[cat] || 0) + 1;

        // 4. Overstay Detection (> 4 Hours inside)
        if (b.timeIn) {
          const timeInDate = new Date(b.timeIn);
          const hoursInside =
            (now.getTime() - timeInDate.getTime()) / (1000 * 60 * 60);
          if (hoursInside > 4) overstayCount++;
        }
      }
    });

    // Sort Offices for Right Column
    const sortedOffices = Object.entries(officeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const topOfficeName =
      sortedOffices.length > 0 ? sortedOffices[0][0] : "None";

    setStats({
      totalActive: activeCount,
      totalToday: todaysData.length,
      overstayed: overstayCount,
      byCategory: catMap,
      topOffices: sortedOffices,
      busiestOffice: topOfficeName,
      funnel: funnelStats,
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

  // --- HELPER ICONS ---
  const getCatIcon = (cat: string) => {
    if (cat.includes("Student")) return <GraduationCap size={14} />;
    if (cat.includes("Employee")) return <Briefcase size={14} />;
    return <Users size={14} />;
  };

  // --- REUSABLE FUNNEL COMPONENT ---
  const FlowStep = ({ icon, label, count, total, colorBox, barColor }: any) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${colorBox}`}
            >
              {icon}
            </div>
            <div>
              <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                {label}
              </h4>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                {count}{" "}
                <span className="font-medium text-slate-300">
                  / {total} Visitors
                </span>
              </p>
            </div>
          </div>
          <span className="text-sm font-black text-slate-800">{pct}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            className={`h-full ${barColor} rounded-full`}
            transition={{ duration: 1 }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      {/* --------------------------- */}
      {/* TOP BAR: HEADER & CLOCK */}
      {/* --------------------------- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b-2 border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#0038A8] text-[#FFD700] p-1.5 rounded-lg shadow-sm">
              <ShieldCheck size={18} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Institutional Dashboard
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
            Admin{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
              Dashboard
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
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
      {/* GRID LAYOUT */}
      {/* --------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">
        {/* ========================================= */}
        {/* COL 1: LIVE ACTIVE (Blue Card)            */}
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
                  Campus Census
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
              <div
                className={`bg-white/10 backdrop-blur-md rounded-2xl p-4 border transition-colors ${stats.overstayed > 0 ? "border-red-400 bg-red-500/20" : "border-white/10"}`}
              >
                <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1">
                  <AlertTriangle
                    size={10}
                    className={stats.overstayed > 0 ? "text-red-300" : ""}
                  />{" "}
                  Overstays
                </p>
                <p
                  className={`text-sm font-bold ${stats.overstayed > 0 ? "text-red-300 animate-pulse" : "text-white"}`}
                >
                  {stats.overstayed} Detected
                </p>
                <p className="text-[9px] opacity-60">Exceeded 4 Hours</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">
                  Status
                </p>
                <div className="flex items-center gap-2 text-emerald-400 mt-1.5">
                  <RefreshCw size={14} className="animate-spin-slow" />
                  <span className="text-sm font-bold">Live</span>
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
              {Object.entries(stats.byCategory).map(([cat, count]) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#0038A8]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl text-[#0038A8] shadow-sm">
                      {getCatIcon(cat)}
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
              {Object.keys(stats.byCategory).length === 0 && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-6">
                  Campus is currently empty.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ========================================= */}
        {/* COL 2: DAILY OPERATIONAL FUNNEL (NEW)     */}
        {/* ========================================= */}
        <div className="lg:col-span-4 bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col p-6 lg:p-8 min-h-125">
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-2">
              <Activity className="text-[#0038A8] w-5 h-5" />
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">
                Operational Flow
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-white border border-slate-200 text-[#0038A8] px-3 py-1 rounded-full uppercase tracking-widest">
              Today
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4 relative">
            <FlowStep
              icon={<Calendar size={18} />}
              label="Manifest Bookings"
              count={stats.totalToday}
              total={stats.totalToday}
              colorBox="bg-slate-50 text-slate-500 border-slate-200"
              barColor="bg-slate-300"
            />

            <FlowStep
              icon={<LogIn size={18} />}
              label="Campus Arrivals"
              count={stats.funnel.arrived}
              total={stats.totalToday}
              colorBox="bg-blue-50 text-[#0038A8] border-blue-200"
              barColor="bg-[#0038A8]"
            />

            <FlowStep
              icon={<Briefcase size={18} />}
              label="Office Check-Ins"
              count={stats.funnel.atOffice}
              total={stats.totalToday}
              colorBox="bg-indigo-50 text-indigo-600 border-indigo-200"
              barColor="bg-indigo-500"
            />

            <FlowStep
              icon={<LogOut size={18} />}
              label="Cleared Exits"
              count={stats.funnel.departed}
              total={stats.totalToday}
              colorBox="bg-emerald-50 text-emerald-600 border-emerald-200"
              barColor="bg-emerald-500"
            />
          </div>

          {stats.overstayed > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
            >
              <div className="p-2 bg-white rounded-lg text-red-500 border border-red-100 shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest">
                  Security Alert
                </h4>
                <p className="text-xs font-bold text-red-600 mt-0.5 leading-tight">
                  {stats.overstayed} visitor(s) currently exceed the 4-hour time
                  limit.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* ========================================= */}
        {/* COL 3: PENDING/MANIFEST (White Card)      */}
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
                  {stats.totalToday}
                </h1>
                <span className="text-xl font-bold text-slate-400 uppercase -rotate-90 origin-bottom-left mb-8 whitespace-nowrap">
                  Appts
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  Busiest Destination
                </p>
                <p className="text-xs font-bold text-[#0038A8] truncate uppercase tracking-wide">
                  {stats.busiestOffice}
                </p>
              </div>
            </div>
          </div>

          {/* BREAKDOWN LIST */}
          <div className="bg-white rounded-4xl p-6 border border-slate-200 shadow-lg flex-1 min-h-50">
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-[#0038A8]" /> Office Traffic
            </h3>
            <div className="space-y-3">
              {stats.topOffices.map(([office, count]) => (
                <div
                  key={office}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#0038A8]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-4">
                    <div className="p-2 bg-white rounded-xl text-slate-400 shadow-sm border border-slate-100 shrink-0">
                      <Building2 size={14} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase truncate">
                      {office}
                    </span>
                  </div>
                  <span className="text-lg font-black text-[#0038A8] shrink-0">
                    {count}
                  </span>
                </div>
              ))}
              {stats.topOffices.length === 0 && (
                <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 py-6">
                  No scheduled appointments.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
