/* eslint-disable */
"use client";

import axios from "axios";
import { motion } from "framer-motion";
import {
  Briefcase,
  Building,
  CheckCircle,
  Download,
  History,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// --- API INSTANCE ---
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// --- TYPES ---
interface VisitorLog {
  _id: string;
  firstName: string;
  lastName: string;
  category: string;
  office: string;
  purpose: string;
  bookingDate: string;
  timeIn?: string;
  transactionTime?: string;
  timeOut?: string;
  phoneNumber: string;
}

interface Office {
  _id: string;
  name: string;
}

// Added 'custom' to the filter types
type DateFilterType = "today" | "week" | "month" | "all" | "custom";

const DepartmentHistory = () => {
  // --- STATE ---
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("All");

  // Date Filtering States
  const [dateFilter, setDateFilter] = useState<DateFilterType>("today");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // --- INITIAL FETCH ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    if (logs.length === 0) setLoading(true);

    try {
      const [bookingRes, officeRes] = await Promise.all([
        api.get("/bookings"),
        api.get("/offices"),
      ]);

      // We only want visitors who have actually TRANSACTED at the office
      const historyLogs = bookingRes.data.filter(
        (b: VisitorLog) => b.transactionTime != null,
      );

      setLogs(historyLogs);
      setOffices(officeRes.data);

      // Try to auto-select the logged-in user's office (if available)
      if (selectedOffice === "All") {
        const userStr = localStorage.getItem("userInfo");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (
            user.office &&
            officeRes.data.some((o: Office) => o.name === user.office)
          ) {
            setSelectedOffice(user.office);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // 1. Office Filter
        if (selectedOffice !== "All" && log.office !== selectedOffice)
          return false;

        // 2. Search Filter
        const searchMatch =
          `${log.firstName} ${log.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          log.purpose.toLowerCase().includes(searchTerm.toLowerCase());

        // 3. Date Filter Logic
        let dateMatch = true;
        if (!log.transactionTime) return false;

        const txDate = new Date(log.transactionTime);
        const today = new Date();

        if (dateFilter === "today") {
          dateMatch = txDate.toDateString() === today.toDateString();
        } else if (dateFilter === "week") {
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateMatch = txDate >= lastWeek;
        } else if (dateFilter === "month") {
          dateMatch =
            txDate.getMonth() === today.getMonth() &&
            txDate.getFullYear() === today.getFullYear();
        } else if (dateFilter === "custom" && selectedDate) {
          // Compare specific selected date
          const txDateLocal = txDate.toLocaleDateString("en-CA", {
            timeZone: "Asia/Manila",
          });
          dateMatch = txDateLocal === selectedDate;
        }

        return searchMatch && dateMatch;
      })
      .sort(
        (a, b) =>
          new Date(b.transactionTime!).getTime() -
          new Date(a.transactionTime!).getTime(),
      );
  }, [logs, searchTerm, dateFilter, selectedDate, selectedOffice]);

  // --- EXPORT TO CSV ---
  const handleExport = () => {
    if (filteredLogs.length === 0) return alert("No data to export.");

    const headers = [
      "Transaction Date",
      "Time",
      "Visitor Name",
      "Category",
      "Contact",
      "Purpose",
      "Office",
    ];

    const rows = filteredLogs.map((log) => [
      `"${new Date(log.transactionTime!).toLocaleDateString()}"`,
      `"${new Date(log.transactionTime!).toLocaleTimeString()}"`,
      `"${log.lastName}, ${log.firstName}"`,
      `"${log.category}"`,
      `"${log.phoneNumber}"`,
      `"${log.purpose}"`,
      `"${log.office}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Office_Report_${selectedOffice.replace(/\s+/g, "_")}_${dateFilter === "custom" ? selectedDate : dateFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EVENT HANDLERS ---
  const handleQuickFilter = (filter: DateFilterType) => {
    setDateFilter(filter);
    setSelectedDate(""); // Clear custom date when using quick filters
  };

  const handleCustomDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDateFilter("custom");
      setSelectedDate(e.target.value);
    } else {
      setDateFilter("today"); // Fallback if they clear the date input
      setSelectedDate("");
    }
  };

  // --- QUICK STATS ---
  const totalServed = filteredLogs.length;
  const uniqueCategories = new Set(filteredLogs.map((l) => l.category)).size;

  return (
    <div className="h-screen bg-slate-50 p-4 md:p-6 font-sans text-slate-800 flex flex-col overflow-hidden">
      <div className="max-w-425 mx-auto w-full h-full flex flex-col">
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 mb-6 shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#0038A8] text-[#FFD700] p-2 rounded-xl shadow-lg">
                <Briefcase size={16} strokeWidth={3} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Department History
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
              Transaction{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
                Logs
              </span>
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-3 w-full xl:w-auto">
            {/* OFFICE DROPDOWN */}
            <div className="relative w-full lg:w-auto shrink-0">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0038A8] w-4 h-4" />
              <select
                value={selectedOffice}
                onChange={(e) => setSelectedOffice(e.target.value)}
                className="w-full lg:w-48 pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:border-[#0038A8] transition-all cursor-pointer appearance-none shadow-sm"
              >
                <option value="All">ALL OFFICES</option>
                {offices.map((o) => (
                  <option key={o._id} value={o.name}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔥 COMBINED DATE FILTERS (Quick Buttons + Custom Picker Beside it) */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar items-center">
              {/* Quick Buttons */}
              {(["today", "week", "month", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuickFilter(f)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    dateFilter === f
                      ? "bg-white text-[#0038A8] shadow-sm border border-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                  }`}
                >
                  {f === "today"
                    ? "Today"
                    : f === "week"
                      ? "7 Days"
                      : f === "month"
                        ? "Month"
                        : "All"}
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-6 bg-slate-300 mx-2 shrink-0"></div>

              {/* Custom Date Picker Beside it */}
              <input
                type="date"
                value={selectedDate}
                onChange={handleCustomDate}
                className={`px-3 py-1.5 bg-transparent rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer transition-all ${
                  dateFilter === "custom"
                    ? "bg-white text-[#0038A8] shadow-sm border border-slate-200"
                    : "hover:bg-slate-200/50 text-slate-400"
                }`}
                title="Pick a specific date"
              />
            </div>

            {/* REFRESH & EXPORT */}
            <div className="flex w-full lg:w-auto gap-3 shrink-0">
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="p-3 bg-white border border-slate-200 text-[#0038A8] rounded-2xl hover:bg-blue-50 transition-all shadow-sm flex-1 lg:flex-none flex justify-center active:scale-95 disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
              </button>

              <button
                onClick={handleExport}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#0038A8] hover:bg-blue-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
              >
                <Download size={14} />{" "}
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- STATS & SEARCH BAR --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search past transactions by Name or Purpose..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-3xl py-4 pl-14 pr-6 font-bold text-sm text-slate-700 outline-none focus:border-[#0038A8] shadow-sm transition-all"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 sm:pb-0">
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl px-5 py-3 flex items-center gap-3 flex-1 min-w-35">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                <UserCheck size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">
                  Served
                </p>
                <p className="text-xl font-black text-emerald-700 leading-none">
                  {totalServed}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-3xl px-5 py-3 flex items-center gap-3 flex-1 min-w-35">
              <div className="p-2 bg-blue-100 text-[#0038A8] rounded-xl">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-[9px] font-black text-[#0038A8]/60 uppercase tracking-widest">
                  Categories
                </p>
                <p className="text-xl font-black text-[#0038A8] leading-none">
                  {uniqueCategories}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- HIGH DENSITY DATA TABLE --- */}
        <div className="bg-white border border-slate-200 rounded-4xl shadow-xl flex-1 flex flex-col overflow-hidden relative">
          <div className="overflow-y-auto overflow-x-auto h-full no-scrollbar relative">
            <table className="w-full text-left border-collapse table-auto relative min-w-200">
              <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-100">
                <tr className="bg-slate-50/95 backdrop-blur-md">
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Time / Date
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Visitor Identity
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Office
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Category
                  </th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Purpose of Visit
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
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <History size={48} className="mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">
                          No transaction history found for this selection.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={log._id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500 border border-emerald-100">
                            <CheckCircle size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-700 font-mono">
                              {new Date(
                                log.transactionTime!,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {new Date(
                                log.transactionTime!,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <p className="font-black text-[#0038A8] text-sm uppercase">
                          {log.lastName}, {log.firstName}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                          {log.phoneNumber}
                        </p>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="text-[10px] font-black uppercase text-slate-600">
                          {log.office}
                        </span>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                          {log.category}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-600 max-w-xs truncate">
                          {log.purpose}
                        </p>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentHistory;
