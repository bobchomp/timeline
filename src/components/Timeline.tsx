"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { TimelineEvent, STARTER_EVENTS, COLOR_MAP } from "@/types/timeline";
import EventCard from "./EventCard";
import EventModal from "./EventModal";

const STORAGE_KEY = "timeline-events";

function generateId(): string {
  return `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function Timeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as TimelineEvent[];
        setEvents(parsed);
      } else {
        setEvents(STARTER_EVENTS);
      }
    } catch {
      setEvents(STARTER_EVENTS);
    }
  }, []);

  // Save to localStorage whenever events change
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      } catch {
        // Ignore storage errors
      }
    }
  }, [events, mounted]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    setEvents((prev) => {
      const oldIndex = prev.findIndex((e) => e.id === active.id);
      const newIndex = prev.findIndex((e) => e.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((e, i) => ({ ...e, order: i }));
    });
  }, []);

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<TimelineEvent, "id" | "order">) => {
    if (editingEvent) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingEvent.id ? { ...e, ...eventData } : e
        )
      );
    } else {
      const newEvent: TimelineEvent = {
        ...eventData,
        id: generateId(),
        order: events.length,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      return filtered.map((e, i) => ({ ...e, order: i }));
    });
  };

  const activeEvent = activeId ? events.find((e) => e.id === activeId) : null;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-16">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl md:text-5xl font-black mb-3 tracking-tight"
            style={{
              background: "linear-gradient(135deg, #a78bfa, #ec4899, #f97316)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            My Timeline
          </h1>
          <p className="text-white/40 text-lg">
            Your story, beautifully told
          </p>
        </motion.div>

        {/* Add Event Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <button
            onClick={handleAddEvent}
            className="group flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-white text-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%)",
              boxShadow: "0 6px 30px rgba(124, 58, 237, 0.5), 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
            Add Event
          </button>
        </motion.div>

        {/* Timeline */}
        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-white/30"
          >
            <div className="text-6xl mb-4">✨</div>
            <p className="text-xl font-medium">Your timeline is empty</p>
            <p className="text-sm mt-2">Add your first event to get started!</p>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
          >
            <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
              <div className="relative">
                {/* Gradient timeline line */}
                <div
                  className="absolute left-[22px] md:left-[50%] md:-translate-x-[1px] top-0 bottom-0 w-0.5 timeline-line"
                  style={{ marginLeft: "2px" }}
                />

                <div className="space-y-6">
                  <AnimatePresence mode="popLayout">
                    {events.map((event, index) => (
                      <div key={event.id} className="relative flex items-start gap-4 md:gap-6">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex-shrink-0 mt-5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 border-[#0f0f1a] ${COLOR_MAP[event.color].dot} shadow-lg`}
                            style={{
                              boxShadow: `0 0 12px ${getColorGlow(event.color)}`,
                            }}
                          />
                        </div>

                        {/* Card */}
                        <div className="flex-1 min-w-0">
                          <EventCard
                            event={event}
                            onEdit={handleEditEvent}
                            onDelete={handleDeleteEvent}
                          />
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </SortableContext>

            {/* Drag overlay */}
            <DragOverlay>
              {activeEvent && (
                <div className="opacity-90 rotate-1">
                  <div
                    className={`
                      glass-card rounded-2xl p-5 border-l-4
                      ${COLOR_MAP[activeEvent.color].border} ${COLOR_MAP[activeEvent.color].bg}
                    `}
                    style={{
                      boxShadow: "0 25px 50px rgba(0,0,0,0.8), 0 0 40px rgba(124,58,237,0.4)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{activeEvent.emoji}</span>
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-wider">{activeEvent.date}</p>
                        <h3 className="text-lg font-bold text-white">{activeEvent.title}</h3>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* Footer hint */}
        {events.length > 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-white/20 text-sm mt-10"
          >
            Drag cards to reorder your timeline
          </motion.p>
        )}
      </div>

      {/* Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
      />
    </div>
  );
}

function getColorGlow(color: string): string {
  const glows: Record<string, string> = {
    red: "rgba(239,68,68,0.6)",
    orange: "rgba(249,115,22,0.6)",
    yellow: "rgba(234,179,8,0.6)",
    green: "rgba(34,197,94,0.6)",
    blue: "rgba(59,130,246,0.6)",
    purple: "rgba(168,85,247,0.6)",
    pink: "rgba(236,72,153,0.6)",
    cyan: "rgba(6,182,212,0.6)",
  };
  return glows[color] || "rgba(168,85,247,0.6)";
}
