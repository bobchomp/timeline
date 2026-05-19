"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimelineEvent, ColorTheme, COLOR_MAP } from "@/types/timeline";
import EmojiPicker from "./EmojiPicker";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<TimelineEvent, "id" | "order">) => void;
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

  const colors = Object.entries(COLOR_MAP) as [ColorTheme, typeof COLOR_MAP[ColorTheme]][];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
                boxShadow: "0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  {editingEvent ? "✏️ Edit Event" : "✨ Add New Event"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all duration-150 text-lg"
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="What happened?"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all duration-150"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all duration-150 [color-scheme:dark]"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Tell the story..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-white/15 text-white placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/50 transition-all duration-150 resize-none"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  />
                </div>

                {/* Emoji */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Emoji Icon — selected: <span className="text-xl">{form.emoji}</span>
                  </label>
                  <EmojiPicker
                    selected={form.emoji}
                    onSelect={(emoji) => setForm({ ...form, emoji })}
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Color Theme</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setForm({ ...form, color: key })}
                        title={val.label}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                          ${form.color === key
                            ? `${val.border} ${val.bg} text-white scale-105 shadow-lg`
                            : "border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:text-white"
                          }
                        `}
                      >
                        <span className={`w-3 h-3 rounded-full ${val.dot}`} />
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-semibold text-white transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                      boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
                    }}
                  >
                    {editingEvent ? "Save Changes" : "Add Event"}
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
