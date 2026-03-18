/* eslint-disable */
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheck,
  FiLoader,
  FiPlus,
  FiSearch,
  FiSlash,
  FiTrash2,
  FiX,
} from "react-icons/fi";

// 🚀 VERCEL PREP: Global API Instance with Tunnel Headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "69420",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// 2. TYPES
interface CustomLimit {
  date: string;
  limit: number;
}
interface Office {
  _id: string;
  name: string;
  defaultMaxSlots: number;
  customLimits: CustomLimit[];
}

const OfficeManagement = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);

  // Custom Modals
  const [officeToDelete, setOfficeToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({ name: "", defaultMaxSlots: 30 });
  const [newOverride, setNewOverride] = useState({ date: "", limit: 10 });

  const fetchOffices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/offices");
      setOffices(res.data);
    } catch (err) {
      setError("Cloud DB Sync Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  // --- Core CRUD ---
  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (selectedOffice)
        await api.put(`/offices/${selectedOffice._id}`, formData);
      else await api.post("/offices", formData);
      setSuccess("Cloud Registry Synchronized");
      fetchOffices();
      cancelEdit();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Database write error");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!officeToDelete) return;
    setProcessing(true);
    try {
      await api.delete(`/offices/${officeToDelete}`);
      setOffices((prev) => prev.filter((o) => o._id !== officeToDelete));
      if (selectedOffice?._id === officeToDelete) cancelEdit();
      setOfficeToDelete(null);
    } catch (err) {
      setError("Delete failed");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessing(false);
    }
  };

  // --- Override Logic ---
  const handleAddOverride = async (isUnavailable: boolean = false) => {
    if (!selectedOffice || !newOverride.date) return;
    setProcessing(true);
    try {
      const finalLimit = isUnavailable ? 0 : newOverride.limit;
      const filteredLimits = selectedOffice.customLimits.filter(
        (cl) => cl.date !== newOverride.date,
      );
      const updatedLimits = [
        ...filteredLimits,
        { date: newOverride.date, limit: finalLimit },
      ];

      const res = await api.put(`/offices/${selectedOffice._id}`, {
        customLimits: updatedLimits,
      });
      setSelectedOffice(res.data);
      setNewOverride({ date: "", limit: 10 });
      fetchOffices();
    } catch (err) {
      setError("Override sync failed");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const removeOverride = async (index: number) => {
    if (!selectedOffice) return;
    const updatedLimits = selectedOffice.customLimits.filter(
      (_, i) => i !== index,
    );
    const res = await api.put(`/offices/${selectedOffice._id}`, {
      customLimits: updatedLimits,
    });
    setSelectedOffice(res.data);
    fetchOffices();
  };

  const startEdit = (office: Office) => {
    setSelectedOffice(office);
    setFormData({ name: office.name, defaultMaxSlots: office.defaultMaxSlots });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedOffice(null);
    setFormData({ name: "", defaultMaxSlots: 30 });
  };

  const filteredOffices = offices.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col overflow-y-auto lg:overflow-hidden">
      {/* ================= HEADER (BRANDING) ================= */}
      <div className="max-w-400 mx-auto w-full mb-6 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 lg:p-4 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg shadow-blue-900/20">
              <FiBriefcase className="text-2xl lg:text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
                Office{" "}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
                  Management
                </span>
              </h1>
              <p className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Registry Master Controller
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-4 w-full lg:w-auto">
            <div className="hidden lg:flex items-center gap-6 pr-6 border-r border-slate-200">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Destinations
                </p>
                <p className="text-xl font-black text-[#0038A8] leading-none">
                  {offices.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Active Overrides
                </p>
                <p className="text-xl font-black text-[#FFD700] leading-none">
                  {offices.reduce((acc, o) => acc + o.customLimits.length, 0)}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                cancelEdit();
                setIsEditing(true);
              }}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-[#0038A8] text-[#FFD700] rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:bg-[#002b82] transition-all active:scale-95"
            >
              <FiPlus size={16} /> <span>Add Office</span>
            </button>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="max-w-400 mx-auto w-full shrink-0"
          >
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-3 shadow-sm">
              <FiAlertTriangle size={16} /> {error}
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="max-w-400 mx-auto w-full shrink-0"
          >
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-3 shadow-sm">
              <FiCheck size={16} /> {success}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= MASSIVE WHITE CONTAINER ================= */}
      <div className="max-w-400 mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-4 lg:p-8 flex flex-col overflow-visible lg:overflow-hidden h-auto lg:h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full">
          {/* ================= LEFT: OFFICE LISTING ================= */}
          <div
            className={`${isEditing ? "lg:col-span-5 xl:col-span-4" : "lg:col-span-12"} transition-all duration-500 h-auto lg:h-full flex flex-col`}
          >
            {/* Search Bar */}
            <div className="flex items-center gap-3 mb-6 shrink-0">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="pl-3">
                  <FiSearch className="text-slate-400 w-5 h-5" />
                </div>
                <input
                  placeholder="Search office name..."
                  className="w-full py-2.5 font-bold text-slate-700 outline-none placeholder:text-slate-300 uppercase text-xs bg-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* List Wrapper */}
            <div className="flex-1 max-h-100 lg:max-h-none overflow-y-auto overflow-x-auto border border-slate-200 rounded-3xl bg-slate-50 custom-scrollbar relative">
              <table className="w-full text-left border-collapse table-auto min-w-112.5">
                <thead className="sticky top-0 z-10 bg-white shadow-sm ring-1 ring-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      Destination Name
                    </th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center hidden md:table-cell">
                      Default Capacity
                    </th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-20 text-center">
                        <FiLoader className="animate-spin mx-auto text-[#0038A8] text-3xl" />
                      </td>
                    </tr>
                  ) : filteredOffices.length === 0 ? (
                    <tr className="bg-white">
                      <td
                        colSpan={3}
                        className="p-16 text-center text-slate-400 text-xs font-bold uppercase tracking-widest"
                      >
                        No Offices Found
                      </td>
                    </tr>
                  ) : (
                    filteredOffices.map((off) => (
                      <tr
                        key={off._id}
                        onClick={() => startEdit(off)}
                        className={`group cursor-pointer transition-colors ${selectedOffice?._id === off._id ? "bg-[#0038A8] text-white" : "hover:bg-blue-50/50 bg-white text-slate-800"}`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0 ${selectedOffice?._id === off._id ? "bg-white/20 text-[#FFD700]" : "bg-slate-100 text-[#0038A8]"}`}
                            >
                              <FiBriefcase className="text-xl" />
                            </div>
                            <div className="overflow-hidden">
                              <p
                                className={`font-black text-sm uppercase tracking-tight truncate ${selectedOffice?._id === off._id ? "text-white" : "text-[#0038A8]"}`}
                              >
                                {off.name}
                              </p>
                              <p
                                className={`text-[9px] font-bold mt-1 ${selectedOffice?._id === off._id ? "text-blue-200" : "text-slate-400"}`}
                              >
                                {off.customLimits.length} Custom Rule(s)
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center hidden md:table-cell">
                          <div
                            className={`inline-flex font-mono text-[10px] font-black px-3 py-1.5 rounded-lg border ${selectedOffice?._id === off._id ? "bg-white/10 border-white/20 text-white" : "bg-blue-50 border-blue-100 text-[#0038A8]"}`}
                          >
                            {off.defaultMaxSlots} / DAY
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <FiArrowRight
                            className={`text-xl ${selectedOffice?._id === off._id ? "text-[#FFD700]" : "text-slate-300 group-hover:text-[#0038A8]"}`}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ================= RIGHT: EDITING CONSOLE ================= */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:col-span-7 xl:col-span-8 h-auto lg:h-full flex flex-col mt-8 lg:mt-0"
              >
                <div className="bg-slate-50 border border-slate-200 rounded-4xl p-6 lg:p-10 shadow-inner flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                  <div className="flex justify-between items-center mb-8 shrink-0">
                    <div>
                      <h2 className="text-2xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
                        {selectedOffice
                          ? "Modify Parameters"
                          : "New Registration"}
                      </h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                        {selectedOffice
                          ? `Editing: ${selectedOffice.name}`
                          : "System Database Entry"}
                      </p>
                    </div>
                    <button
                      onClick={cancelEdit}
                      className="p-3 bg-white border border-slate-200 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  <div className="grid xl:grid-cols-2 gap-8 flex-1">
                    {/* LEFT COL: FORM */}
                    <div className="space-y-6">
                      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-blue-50 rounded-md text-[#0038A8]">
                            <FiBriefcase size={14} />
                          </div>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Core Settings
                          </h3>
                        </div>
                        <Input
                          label="Display Name"
                          value={formData.name}
                          onChange={(val: any) =>
                            setFormData({ ...formData, name: val })
                          }
                          placeholder="e.g. Registrar Office"
                        />
                        <Input
                          label="Global Daily Limit"
                          type="number"
                          value={formData.defaultMaxSlots}
                          onChange={(val: any) =>
                            setFormData({
                              ...formData,
                              defaultMaxSlots: Number(val),
                            })
                          }
                        />

                        <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                          <button
                            onClick={handleSaveOffice}
                            disabled={processing || !formData.name}
                            className="w-full py-4 bg-[#0038A8] hover:bg-[#002b82] text-[#FFD700] rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {processing ? (
                              <FiLoader className="animate-spin text-lg" />
                            ) : (
                              <FiCheck size={16} />
                            )}{" "}
                            {selectedOffice
                              ? "Update Registry"
                              : "Initialize Office"}
                          </button>
                          {selectedOffice && (
                            <button
                              onClick={() =>
                                setOfficeToDelete(selectedOffice._id)
                              }
                              className="w-full py-4 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <FiTrash2 size={16} /> Purge Office
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COL: OVERRIDES */}
                    <div
                      className={`space-y-6 ${!selectedOffice && "opacity-30 pointer-events-none grayscale"}`}
                    >
                      <div className="bg-white p-6 lg:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-50 rounded-md text-amber-500">
                              <FiCalendar size={14} />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Date Overrides
                            </h3>
                          </div>
                        </div>

                        {/* Add Rule Area */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6 shrink-0 space-y-3">
                          <input
                            type="date"
                            onClick={(e: any) => e.currentTarget.showPicker()}
                            className="w-full p-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 bg-white cursor-pointer outline-none focus:border-[#0038A8] focus:ring-2 focus:ring-blue-50"
                            value={newOverride.date}
                            onChange={(e) =>
                              setNewOverride({
                                ...newOverride,
                                date: e.target.value,
                              })
                            }
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Limit"
                              className="w-24 p-3.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 bg-white outline-none focus:border-[#0038A8] focus:ring-2 focus:ring-blue-50 text-center"
                              value={newOverride.limit}
                              onChange={(e) =>
                                setNewOverride({
                                  ...newOverride,
                                  limit: Number(e.target.value),
                                })
                              }
                            />
                            <button
                              onClick={() => handleAddOverride(false)}
                              className="flex-1 bg-slate-800 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-slate-900 transition-all shadow-sm"
                            >
                              Set
                            </button>
                            <button
                              onClick={() => handleAddOverride(true)}
                              className="flex-1 bg-red-100 text-red-600 border border-red-200 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1 shadow-sm"
                            >
                              <FiSlash /> Close
                            </button>
                          </div>
                        </div>

                        {/* Rule List */}
                        <div className="flex-1 max-h-75 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                          {selectedOffice?.customLimits.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
                              <FiCalendar className="text-4xl text-slate-300 mb-3" />
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                No Active Rules
                              </p>
                            </div>
                          ) : (
                            selectedOffice?.customLimits.map((cl, i) => (
                              <div
                                key={i}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${cl.limit === 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200 shadow-sm"}`}
                              >
                                <div>
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                                    Target Date
                                  </p>
                                  <p
                                    className={`text-xs font-black font-mono ${cl.limit === 0 ? "text-red-700" : "text-slate-700"}`}
                                  >
                                    {cl.date}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${cl.limit === 0 ? "bg-red-600 text-white shadow-md shadow-red-900/20" : "bg-slate-100 text-slate-600 border border-slate-200"}`}
                                  >
                                    {cl.limit === 0
                                      ? "CLOSED"
                                      : `${cl.limit} SLOTS`}
                                  </span>
                                  <button
                                    onClick={() => removeOverride(i)}
                                    className="p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                  >
                                    <FiTrash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <AnimatePresence>
        {officeToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-center"
            >
              <div className="bg-red-600 p-8 pb-10 relative">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl text-red-600 mb-4 relative z-10">
                  <FiAlertTriangle size={40} />
                </div>
                <h2 className="text-white font-black text-2xl uppercase tracking-wide relative z-10">
                  Purge Office
                </h2>
              </div>

              <div className="p-8 -mt-6 bg-white rounded-t-4xl relative z-20">
                <h3 className="text-2xl font-black text-slate-800 uppercase leading-none mb-6">
                  Are you sure?
                </h3>

                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl mb-8">
                  <p className="text-xs text-red-800 font-bold uppercase tracking-wide leading-relaxed">
                    Warning: Deleting this office will immediately remove it
                    from the public visitor registration form. This cannot be
                    undone.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setOfficeToDelete(null)}
                    disabled={processing}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-2xl uppercase text-xs tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={processing}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-900/20 active:scale-95 flex justify-center items-center gap-2"
                  >
                    {processing ? (
                      <FiLoader className="animate-spin" />
                    ) : (
                      "Confirm Purge"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- CUSTOM INPUT COMPONENT ---
const Input = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">
      {label}
    </label>
    <input
      type={type}
      required
      placeholder={placeholder}
      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-[#0038A8] focus:ring-4 focus:ring-blue-50 font-bold text-xs text-slate-700 transition-all placeholder:text-slate-300"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default OfficeManagement;
