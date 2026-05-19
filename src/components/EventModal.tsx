"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineEvent, ColorTheme, COLOR_MAP } from "@/types/timeline";
import EmojiPicker from "./EmojiPicker";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<TimelineEvent, "id" | "order" | "timelineId">) => void;
  editingEvent?: TimelineEvent | null;
}

const defaultForm = {
  title: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  emoji: "🎉",
  color: "purple" as ColorTheme,
};

export default function EventModal({ isOpen, onClose, onSave, editingEvent }: EventModalProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        date: editingEvent.date,
        description: editingEvent.description,
        emoji: editingEvent.emoji,
        color: editingEvent.color,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingEvent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-gray-100">
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingEvent ? "Edit Event" : "Add Event"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="What happened?"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell the story…"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Icon <span className="text-xl ml-1">{form.emoji}</span>
                  </label>
                  <EmojiPicker selected={form.emoji} onSelect={(e) => setForm({ ...form, emoji: e })} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(COLOR_MAP) as [ColorTheme, typeof COLOR_MAP[ColorTheme]][]).map(([c, cm]) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        title={cm.label}
                        className="w-8 h-8 rounded-full transition-all hover:scale-110"
                        style={{
                          backgroundColor: cm.swatch,
                          outline: form.color === c ? `3px solid ${cm.swatch}` : "none",
                          outlineOffset: "2px",
                          transform: form.color === c ? "scale(1.15)" : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl font-semibold btn-primary">
                    {editingEvent ? "Save Changes" : "Add to Timeline"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
