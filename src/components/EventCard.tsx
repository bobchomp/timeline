"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TimelineEvent, COLOR_MAP } from "@/types/timeline";

interface EventCardProps {
  event: TimelineEvent;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (id: string) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = COLOR_MAP[event.color];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -30, scale: 0.96 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        x: 0,
        scale: isDragging ? 1.02 : 1,
        zIndex: isDragging ? 50 : "auto",
      }}
      exit={{ opacity: 0, x: 30, scale: 0.96 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="relative"
    >
      <div
        className={`
          glass-card card-glow rounded-2xl p-5 border-l-4
          ${colors.border} ${colors.bg}
          ${isDragging ? "shadow-2xl ring-2 ring-purple-400/50" : ""}
        `}
        style={{
          boxShadow: isDragging
            ? `0 25px 50px rgba(0,0,0,0.6), 0 0 30px ${colors.glow || "rgba(124,58,237,0.3)"}`
            : `0 4px 20px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)`,
        }}
      >
        <div className="flex items-start gap-4">
          {/* Drag handle + Emoji */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/60 transition-all duration-150 touch-none"
              title="Drag to reorder"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <circle cx="4" cy="3" r="1.5" />
                <circle cx="10" cy="3" r="1.5" />
                <circle cx="4" cy="7" r="1.5" />
                <circle cx="10" cy="7" r="1.5" />
                <circle cx="4" cy="11" r="1.5" />
                <circle cx="10" cy="11" r="1.5" />
              </svg>
            </div>
            <span className="text-4xl leading-none select-none">{event.emoji}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
                  {formatDate(event.date)}
                </p>
                <h3 className="text-lg font-bold text-white leading-tight truncate">
                  {event.title}
                </h3>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onEdit(event)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition-all duration-150"
                  title="Edit"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>

                <AnimatePresence mode="wait">
                  {confirmDelete ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1"
                    >
                      <button
                        onClick={() => onDelete(event.id)}
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 border border-red-500/30 transition-all duration-150"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-2 py-1 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/15 text-white/50 hover:text-white border border-white/10 transition-all duration-150"
                      >
                        Cancel
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="delete-btn"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setConfirmDelete(true)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all duration-150"
                      title="Delete"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {event.description && (
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
