/* eslint-disable */
"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiLoader,
  FiPlus,
  FiTag,
  FiTrash2,
} from "react-icons/fi";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:9000/api",
  headers: { "ngrok-skip-browser-warning": "69420" },
});

interface Category {
  _id: string;
  name: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      setCategories(res.data);
    } catch (err) {
      setError("Failed to sync database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        "/categories",
        { name: newCategoryName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNewCategoryName("");
      fetchCategories();
    } catch (err) {
      setError("Failed to add category. It might already exist.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        "Delete this category? It will be removed from the public portal.",
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError("Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans text-slate-800 flex flex-col">
      <div className="max-w-4xl mx-auto w-full mb-6 shrink-0 flex items-center gap-4">
        <div className="p-3 bg-[#0038A8] text-[#FFD700] rounded-2xl shadow-lg shadow-blue-900/20">
          <FiTag className="text-2xl lg:text-3xl" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#0038A8] uppercase tracking-tighter leading-none">
            Category{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0038A8] to-blue-400">
              Settings
            </span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Visitor Classifications
          </p>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-4xl mx-auto w-full mb-4 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-200 text-xs font-bold flex items-center gap-2"
          >
            <FiAlertTriangle /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto w-full flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-6 lg:p-10 flex flex-col md:flex-row gap-8">
        {/* ADD NEW CATEGORY FORM */}
        <div className="flex-1 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-[#0038A8] font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
              <FiPlus /> Register New
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
                  Classification Name
                </label>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. VIP Guest"
                  className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-[#0038A8] font-bold text-xs mt-1"
                  required
                />
              </div>
              <button
                disabled={processing}
                type="submit"
                className="w-full py-4 bg-[#0038A8] text-[#FFD700] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20 hover:bg-[#002b82] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <>
                    <FiCheck size={16} /> Add Category
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* CATEGORY LIST */}
        <div className="flex-1 bg-white border border-slate-200 rounded-4xl shadow-sm flex flex-col overflow-hidden max-h-125">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Active Classifications
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {loading ? (
              <div className="flex justify-center p-10">
                <FiLoader className="animate-spin text-[#0038A8] text-2xl" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase py-10">
                No Categories Found
              </p>
            ) : (
              <div className="space-y-2 p-2">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-[#0038A8]/30 transition-all shadow-sm"
                  >
                    <span className="text-xs font-black uppercase text-slate-700">
                      {cat.name}
                    </span>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
