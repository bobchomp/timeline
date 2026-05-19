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
  readOnly?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function EventCard({ event, onEdit, onDelete, readOnly = false }: EventCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = COLOR_MAP[event.color];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: event.id, disabled: readOnly });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, x: -20, scale: 0.97 }}
      animate={{ opacity: isDragging ? 0.45 : 1, x: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.97 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
    >
      <div
        className={`bg-white rounded-2xl p-5 border-l-4 ${colors.border} ${colors.bg} card-shadow`}
        style={isDragging ? { boxShadow: `0 16px 48px rgba(0,0,0,0.15), 0 0 0 2px ${colors.swatch}40` } : {}}
      >
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            {!readOnly && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-black/5 text-gray-300 hover:text-gray-400 transition-colors touch-none"
                title="Drag to reorder"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <circle cx="4" cy="3" r="1.5" /><circle cx="10" cy="3" r="1.5" />
                  <circle cx="4" cy="7" r="1.5" /><circle cx="10" cy="7" r="1.5" />
                  <circle cx="4" cy="11" r="1.5" /><circle cx="10" cy="11" r="1.5" />
                </svg>
              </div>
            )}
            <span className="text-4xl leading-none select-none">{event.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {formatDate(event.date)}
                </p>
                <h3 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h3>
              </div>

              {!readOnly && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onEdit(event)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
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
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="flex items-center gap-1"
                      >
                        <button
                          onClick={() => onDelete(event.id)}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-600 border border-red-200 transition-all"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmDelete(false)}
                          className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
                        >
                          Cancel
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="delete-btn"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        onClick={() => setConfirmDelete(true)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
              )}
            </div>

            {event.description && (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">{event.description}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
