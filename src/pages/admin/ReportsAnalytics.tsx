/* eslint-disable */
"use client";

import axios from "axios";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Calendar,
  Clock,
  DatabaseBackup,
  Download,
  Filter,
  PieChart,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// 🚀 VERCEL PREP: Global API Instance with Tunnel Headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

interface Booking {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  office: string;
  purpose: string;
  bookingDate: string;
  timeIn?: string;
  timeOut?: string;
  hours?: number;
  status: string;
}

const ReportsAnalytics = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);

  // --- FILTER & SORT STATES ---
  const [timeFilter, setTimeFilter] = useState<
    "today" | "week" | "month" | "all"
  >("today");
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // --- 1. FETCH DATA ---
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/bookings");
      setBookings(
        Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [],
      );
    } catch (error) {
      console.error("Failed to fetch analytics data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // --- 2. PROCESS ANALYTICS (Manila Time) ---
  const { stats, sortedFilteredBookings } = useMemo(() => {
    const manilaNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
    );
    const todayStr = manilaNow.toLocaleDateString("en-CA");
    const weekAgo = manilaNow.getTime() - 7 * 86400000;
    const monthAgo = manilaNow.getTime() - 30 * 86400000;

    // Filter by Date (Custom Date overrides TimeFilter)
    const filtered = bookings.filter((b) => {
      if (!b.bookingDate) return false;
      const bTime = new Date(b.bookingDate).getTime();

      if (customDate) return b.bookingDate === customDate;
      if (timeFilter === "today") return b.bookingDate === todayStr;
      if (timeFilter === "week") return bTime >= weekAgo;
      if (timeFilter === "month") return bTime >= monthAgo;
      return true; // "all"
    });

    // Apply Sorting (Ascending / Descending)
    const sortedFilteredBookings = [...filtered].sort((a, b) => {
      const timeA = new Date(a.bookingDate).getTime();
      const timeB = new Date(b.bookingDate).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

    let totalStays = 0;
    let totalHours = 0;
    let overstays = 0;
    const officeMap: Record<string, number> = {};
    const catMap: Record<string, number> = {};
    const hourMap: Record<number, number> = {}; // For Traffic Chart

    // Initialize Hours (8 AM to 6 PM)
    for (let i = 8; i <= 18; i++) hourMap[i] = 0;

    filtered.forEach((b) => {
      // Demographics & Destinations
      officeMap[b.office] = (officeMap[b.office] || 0) + 1;
      catMap[b.category] = (catMap[b.category] || 0) + 1;

      // Overstays & Duration
      if (b.timeIn) {
        const tIn = new Date(b.timeIn);
        const hour = tIn.getHours();
        if (hour >= 8 && hour <= 18) hourMap[hour]++; // Map traffic

        if (b.hours && b.timeOut) {
          totalStays++;
          totalHours += b.hours;
          if (b.hours > 4) overstays++;
        } else if (b.status === "On Campus") {
          // Live overstay check
          const hoursInside = (manilaNow.getTime() - tIn.getTime()) / 36e5;
          if (hoursInside > 4) overstays++;
        }
      }
    });

    const avgStay =
      totalStays > 0 ? (totalHours / totalStays).toFixed(1) : "0.0";
    const topOffices = Object.entries(officeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Calculate Peak Hour
    let peakHour = 8;
    let maxTraffic = 0;
    Object.entries(hourMap).forEach(([hr, count]) => {
      if (count > maxTraffic) {
        maxTraffic = count;
        peakHour = parseInt(hr);
      }
    });
    const peakHourFormatted =
      peakHour > 12 ? `${peakHour - 12} PM` : `${peakHour} AM`;

    return {
      sortedFilteredBookings,
      stats: {
        total: filtered.length,
        avgStay,
        overstays,
        topOffices,
        catMap,
        hourTraffic: hourMap,
        peakHour: maxTraffic > 0 ? peakHourFormatted : "N/A",
        maxTrafficValue: maxTraffic || 1, // Prevent division by zero in chart
      },
    };
  }, [bookings, timeFilter, customDate, sortOrder]);

  // --- 3. DATA ARCHIVER (Download + DB Clean) ---
  const handleArchiveOldData = async () => {
    const thirtyDaysAgo = new Date().getTime() - 30 * 86400000;
    const oldRecords = bookings.filter(
      (b) => new Date(b.bookingDate).getTime() < thirtyDaysAgo,
    );

    if (oldRecords.length === 0) {
      return alert("System Optimization: No records older than 30 days found.");
    }

    if (
      !window.confirm(
        `Found ${oldRecords.length} records older than 30 days.\n\nDo you want to backup these to your local computer and permanently delete them from the database?`,
      )
    ) {
      return;
    }

    setIsArchiving(true);
    try {
      // Step 1: Download backup locally (JSON Format)
      const dataStr = JSON.stringify(oldRecords, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `UniVentry_Archive_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Step 2: Delete old records from DB (Fallback loop if batch delete isn't available)
      await Promise.all(
        oldRecords.map((b) => api.delete(`/bookings/${b._id}`)),
      );

      alert(
        "Backup successful! Old data has been purged from the active database.",
      );
      fetchBookings(); // Refresh UI
    } catch (err) {
      console.error("Archive Failed", err);
      alert("Error purging some records from the database. Please check logs.");
    } finally {
      setIsArchiving(false);
    }
  };

  // --- 4. PDF GENERATION LOGIC ---
  const generatePDF = () => {
    if (sortedFilteredBookings.length === 0)
      return alert("No data to export for this period.");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header
    doc.setFillColor(0, 56, 168); // #0038A8
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 215, 0); // #FFD700
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("UNIVENTRY SYSTEM", 15, 20);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const periodLabel = customDate
      ? `Date: ${customDate}`
      : `Period: ${timeFilter.toUpperCase()}`;
    doc.text(`Official Intelligence Report - ${periodLabel}`, 15, 30);

    // 2. High-Level Metrics
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Executive Summary", 15, 55);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Visitors Logged: ${stats.total}`, 15, 65);
    doc.text(`Average Stay Duration: ${stats.avgStay} hours`, 15, 72);
    doc.text(`Identified Overstays (>4 hrs): ${stats.overstays}`, 15, 79);
    doc.text(`Peak Campus Traffic: ${stats.peakHour}`, 15, 86);

    // 3. Top Destinations Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Top Destinations (By Volume)", 15, 105);

    const officeData = stats.topOffices.map(([office, count], index) => [
      index + 1,
      office,
      `${count} Visitors`,
    ]);

    autoTable(doc, {
      startY: 110,
      head: [["Rank", "Office / Department", "Total Visits"]],
      body: officeData,
      theme: "grid",
      headStyles: {
        fillColor: [0, 56, 168],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: { fontSize: 10 },
    });

    // 4. Raw Visitor Logs (Affected by Sort)
    const logY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Detailed Visitor Logs", 15, logY);

    const logData = sortedFilteredBookings.map((b) => [
      `${b.lastName}, ${b.firstName}`,
      b.category,
      b.office,
      b.bookingDate,
      b.status,
    ]);

    autoTable(doc, {
      startY: logY + 5,
      head: [["Visitor Name", "Category", "Destination", "Date", "Status"]],
      body: logData,
      theme: "grid",
      headStyles: {
        fillColor: [255, 215, 0],
        textColor: [0, 56, 168],
        fontStyle: "bold",
      },
      styles: { fontSize: 9 },
    });

    // Save
    const dateStr = new Date().toISOString().split("T")[0];
    doc.save(`UniVentry_Report_${timeFilter}_${dateStr}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">
      {/* ================= HEADER (FULLY RESPONSIVE) ================= */}
      <div className="max-w-[1600px] mx-auto w-full mb-6 shrink-0 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        {/* Branding Title */}
        <div className="flex items-center gap-4">
          <div className="p-3 lg:p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg shadow-blue-900/20">
            <PieChart className="text-2xl lg:text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
              Reports &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0038A8] to-blue-400">
                Analytics
              </span>
            </h1>
            <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Decision Support & Telemetry
            </p>
          </div>
        </div>

        {/* --- DYNAMIC ACTION BAR (Wraps on Mobile) --- */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Quick Filters */}
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {["today", "week", "month", "all"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setTimeFilter(f as any);
                  setCustomDate("");
                }}
                className={`px-4 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex-1 sm:flex-none text-center ${timeFilter === f && !customDate ? "bg-[#0038A8] text-white shadow-md" : "text-slate-400 hover:text-slate-700"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Date Picker & Sorting */}
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-36">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-2 py-2.5 text-[10px] font-bold text-slate-600 focus:outline-none focus:border-[#0038A8] shadow-sm uppercase cursor-pointer"
              />
            </div>
            <div className="relative flex-1 sm:w-36">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-2 py-2.5 text-[10px] font-bold text-slate-600 focus:outline-none focus:border-[#0038A8] shadow-sm uppercase cursor-pointer appearance-none"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
            <button
              onClick={fetchBookings}
              disabled={loading}
              className="p-2.5 bg-white text-[#0038A8] border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Critical Actions */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleArchiveOldData}
              disabled={isArchiving}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white border border-slate-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <DatabaseBackup
                size={14}
                className={isArchiving ? "animate-pulse" : ""}
              />{" "}
              {isArchiving ? "Archiving..." : "Archive Logs"}
            </button>

            <button
              onClick={generatePDF}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FFD700] text-[#0038A8] rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#e6c200] transition-all shadow-md active:scale-95"
            >
              <Download size={14} strokeWidth={2.5} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* ================= MASSIVE WHITE CONTAINER ================= */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-6 lg:p-8 flex flex-col overflow-y-auto custom-scrollbar">
        {/* === TOP METRICS GRID === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            icon={<Users />}
            label="Total Visitors"
            value={stats.total}
            color="text-[#0038A8]"
            bg="bg-blue-50"
          />
          <MetricCard
            icon={<Clock />}
            label="Avg Stay (Hours)"
            value={stats.avgStay}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <MetricCard
            icon={<TrendingUp />}
            label="Peak Arrival Time"
            value={stats.peakHour}
            color="text-[#FFD700]"
            bg="bg-amber-50"
          />
          <div
            className={`p-6 rounded-3xl border flex flex-col relative overflow-hidden ${stats.overstays > 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}
          >
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${stats.overstays > 0 ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-500"}`}
              >
                <AlertTriangle size={20} />
              </div>
              {stats.overstays > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase text-red-500 bg-red-100 px-2 py-1 rounded-md">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />{" "}
                  Anomaly
                </span>
              )}
            </div>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest relative z-10">
              Overstay Violations
            </h3>
            <p
              className={`text-4xl font-black relative z-10 mt-1 ${stats.overstays > 0 ? "text-red-600" : "text-slate-800"}`}
            >
              {stats.overstays}
            </p>
            {stats.overstays > 0 && (
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            )}
          </div>
        </div>

        {/* === MAIN CONTENT ROW === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* CHART: Visitor Load Analytics */}
          <div className="lg:col-span-2 bg-slate-50 rounded-4xl border border-slate-200 p-6 lg:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-[#0038A8] flex items-center gap-2 uppercase tracking-widest">
                <BarChart3 className="text-[#FFD700]" /> Campus Traffic
                Distribution
              </h3>
              <span className="text-[9px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 uppercase tracking-[0.2em] hidden sm:block">
                8AM - 6PM
              </span>
            </div>

            <div className="flex-1 min-h-[250px] relative flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-2 pt-10 pb-6 border-b-2 border-slate-200">
              {/* Horizontal Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30 pb-6 pt-10">
                <div className="w-full h-px bg-slate-400"></div>
                <div className="w-full h-px bg-slate-400"></div>
                <div className="w-full h-px bg-slate-400"></div>
              </div>

              {/* Bars */}
              {Object.entries(stats.hourTraffic).map(([hr, count]) => {
                const hourInt = parseInt(hr);
                const label =
                  hourInt > 12
                    ? `${hourInt - 12}P`
                    : hourInt === 12
                      ? "12P"
                      : `${hourInt}A`;
                const heightPct =
                  stats.maxTrafficValue > 0
                    ? (count / stats.maxTrafficValue) * 100
                    : 0;
                const isPeak = count === stats.maxTrafficValue && count > 0;

                return (
                  <div
                    key={hr}
                    className="flex flex-col items-center justify-end h-full flex-1 group z-10 relative"
                  >
                    <div className="absolute -top-8 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {count} Visits
                    </div>
                    <div
                      className="w-full max-w-[40px] bg-slate-200 rounded-t-lg relative flex items-end justify-center overflow-hidden"
                      style={{ height: "100%" }}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 1, type: "spring" }}
                        className={`w-full rounded-t-lg transition-colors ${isPeak ? "bg-gradient-to-t from-[#0038A8] to-[#FFD700]" : "bg-[#0038A8]/60 group-hover:bg-[#0038A8]"}`}
                      />
                    </div>
                    <span
                      className={`text-[8px] sm:text-[9px] font-black uppercase mt-3 ${isPeak ? "text-[#0038A8]" : "text-slate-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDEBAR: Predictives & Demographics */}
          <div className="space-y-6 flex flex-col">
            {/* Predictive Insights Card */}
            <div className="bg-[#0038A8] rounded-[2rem] p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] rounded-full -translate-y-16 translate-x-16 opacity-10"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Activity className="text-[#FFD700]" />
                </div>
                <h3 className="font-black uppercase tracking-widest text-xs text-[#FFD700]">
                  AI Insights
                </h3>
              </div>
              <div className="space-y-6 relative z-10">
                <div>
                  <div className="flex justify-between items-center text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1.5">
                    <span>Busiest Destination</span>
                    <span className="text-[#FFD700] bg-black/20 px-2 py-0.5 rounded">
                      High Vol
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white truncate">
                    {stats.topOffices.length > 0
                      ? stats.topOffices[0][0]
                      : "No Data Yet"}
                  </p>
                </div>
                <div className="h-px bg-white/10" />
                <div>
                  <div className="flex justify-between items-center text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1.5">
                    <span>Face Verification Net</span>
                    <span className="text-emerald-400">98.5% Acc</span>
                  </div>
                  <p className="text-xs font-medium text-blue-100 leading-relaxed">
                    Phase 5 Biometric engine maintaining optimal identification
                    confidence thresholds.
                  </p>
                </div>
              </div>
            </div>

            {/* Demographics List */}
            <div className="bg-slate-50 rounded-[2rem] p-6 lg:p-8 border border-slate-200 flex-1">
              <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={16} /> Demographics
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.catMap).length === 0 ? (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-6">
                    No data available.
                  </p>
                ) : (
                  Object.entries(stats.catMap).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
                    >
                      <span className="text-[10px] font-black text-slate-600 uppercase">
                        {cat}
                      </span>
                      <span className="text-sm font-black text-[#0038A8]">
                        {count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Footer */}
        <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="text-[#0038A8] text-xl" />
            </div>
            <div>
              <h4 className="text-[#0038A8] font-black uppercase text-xs tracking-widest">
                IoT System Oversight
              </h4>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide mt-0.5">
                Data synchronized across Gate, CCTV, and Office endpoints.
              </p>
            </div>
          </div>
          <button className="text-[9px] font-black text-slate-400 hover:text-[#0038A8] tracking-[0.2em] transition-colors border border-slate-200 px-4 py-2 rounded-lg bg-white shadow-sm w-full md:w-auto text-center">
            REPORT ENGINE V2.0
          </button>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENT ---
const MetricCard = ({ icon, label, value, color, bg }: any) => (
  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col hover:shadow-md transition-all">
    <div className={`p-3 rounded-xl w-max mb-4 ${bg} ${color}`}>{icon}</div>
    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
      {label}
    </h3>
    <p className={`text-4xl font-black mt-1 ${color}`}>{value}</p>
  </div>
);

export default ReportsAnalytics;
