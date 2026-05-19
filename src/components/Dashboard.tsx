"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Timeline, TimelineMeta, makeStarterEvents } from "@/types/timeline";

const LIST_KEY = "tl_list";
const DATA_PREFIX = "tl_";

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function saveTimelineLocally(timeline: Timeline) {
  localStorage.setItem(`${DATA_PREFIX}${timeline.id}`, JSON.stringify(timeline));
}

function loadList(): TimelineMeta[] {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveList(list: TimelineMeta[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

async function syncToSheets(timeline: Timeline) {
  try {
    await fetch("/api/timelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(timeline),
    });
  } catch {
    // fire-and-forget
  }
}

async function deleteFromSheets(id: string, editKey: string) {
  try {
    await fetch(`/api/timelines/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editKey }),
    });
  } catch {
    // fire-and-forget
  }
}

export default function Dashboard() {
  const [list, setList] = useState<TimelineMeta[]>([]);
  const [mounted, setMounted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setList(loadList());
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const id = genId();
    const editKey = genId() + genId();
    const createdAt = new Date().toISOString();

    const meta: TimelineMeta = { id, name: newName.trim(), description: newDesc.trim(), editKey, createdAt };
    const timeline: Timeline = { ...meta, layout: "vertical", events: makeStarterEvents(id) };

    saveTimelineLocally(timeline);
    const newList = [meta, ...list];
    setList(newList);
    saveList(newList);
    syncToSheets(timeline);

    setNewName("");
    setNewDesc("");
    setCreating(false);
  };

  const handleDelete = (id: string) => {
    const meta = list.find((t) => t.id === id);
    if (!meta) return;
    const newList = list.filter((t) => t.id !== id);
    setList(newList);
    saveList(newList);
    localStorage.removeItem(`${DATA_PREFIX}${id}`);
    deleteFromSheets(id, meta.editKey);
    setDeleteConfirm(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 md:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h1 className="text-5xl md:text-6xl font-black tracking-tight gradient-text mb-3">
            Timeline Studio
          </h1>
          <p className="text-lg text-gray-500">Build beautiful, shareable timelines — no account needed</p>
        </motion.div>

        {/* Create button or form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <AnimatePresence mode="wait">
            {creating ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                onSubmit={handleCreate}
                className="bg-white rounded-3xl border border-gray-200 shadow-lg p-6 max-w-lg mx-auto"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">New Timeline</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Timeline name *"
                    required
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  />
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Short description (optional)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                  />
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold btn-primary">
                    Create Timeline
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={() => setCreating(true)}
                  className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-white text-lg btn-primary"
                >
                  <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
                  New Timeline
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Timelines grid */}
        {list.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-20 text-gray-400"
          >
            <div className="text-6xl mb-4">📅</div>
            <p className="text-xl font-medium text-gray-500">No timelines yet</p>
            <p className="text-sm mt-2">Create your first one above!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {list.map((meta, i) => (
                <motion.div
                  key={meta.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-gray-200 card-shadow p-5 flex flex-col"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 truncate">{meta.name}</h3>
                    {meta.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">{meta.description}</p>
                    )}
                    <p className="text-xs text-gray-400">Created {formatDate(meta.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/t/${meta.id}`}
                      className="flex-1 text-center py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                      👁 View
                    </Link>
                    <Link
                      href={`/t/${meta.id}/edit?key=${meta.editKey}`}
                      className="flex-1 text-center py-2 rounded-xl text-sm font-semibold text-white btn-primary"
                    >
                      ✏️ Edit
                    </Link>
                    <AnimatePresence mode="wait">
                      {deleteConfirm === meta.id ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex gap-1"
                        >
                          <button
                            onClick={() => handleDelete(meta.id)}
                            className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="py-2 px-2.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                          >
                            No
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="del-btn"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setDeleteConfirm(meta.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          title="Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
