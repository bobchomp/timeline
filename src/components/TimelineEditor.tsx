"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove,
  verticalListSortingStrategy, horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToHorizontalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Timeline, TimelineEvent, TimelineMeta, COLOR_MAP, makeStarterEvents } from "@/types/timeline";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import ShareModal from "./ShareModal";

const LIST_KEY = "tl_list";
const DATA_PREFIX = "tl_";

type LayoutMode = "vertical" | "horizontal";

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadTimelineLocally(id: string): Timeline | null {
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveTimelineLocally(timeline: Timeline) {
  localStorage.setItem(`${DATA_PREFIX}${timeline.id}`, JSON.stringify(timeline));
}

function getEditKeyFromList(id: string): string | null {
  try {
    const list: TimelineMeta[] = JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]");
    return list.find((m) => m.id === id)?.editKey ?? null;
  } catch { return null; }
}

async function syncEvents(timeline: Timeline) {
  try {
    await fetch(`/api/timelines/${timeline.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editKey: timeline.editKey, events: timeline.events }),
    });
  } catch { /* fire-and-forget */ }
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function TimelineEditor({
  timelineId,
  urlKey,
}: {
  timelineId: string;
  urlKey?: string;
}) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [layout, setLayout] = useState<LayoutMode>("vertical");

  useEffect(() => {
    async function load() {
      let editKey = urlKey ?? getEditKeyFromList(timelineId);

      if (!editKey) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      let tl = loadTimelineLocally(timelineId);

      if (!tl) {
        try {
          const res = await fetch(`/api/timelines/${timelineId}`);
          const data = await res.json();
          if (data.timeline) {
            tl = { ...data.timeline, editKey } as Timeline;
            saveTimelineLocally(tl);
          }
        } catch { /* ignore */ }
      }

      if (!tl) {
        tl = {
          id: timelineId, name: "My Timeline", description: "",
          editKey, createdAt: new Date().toISOString(),
          events: makeStarterEvents(timelineId),
        };
        saveTimelineLocally(tl);
      } else {
        tl = { ...tl, editKey };
        saveTimelineLocally(tl);
      }

      const list: TimelineMeta[] = JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]");
      if (!list.find((m) => m.id === timelineId)) {
        list.unshift({ id: tl.id, name: tl.name, description: tl.description, editKey, createdAt: tl.createdAt });
        localStorage.setItem(LIST_KEY, JSON.stringify(list));
      }

      // Restore saved layout preference
      const savedLayout = localStorage.getItem(`tl_layout_${timelineId}`) as LayoutMode | null;
      if (savedLayout) setLayout(savedLayout);

      setTimeline(tl);
      setLoading(false);
    }
    load();
  }, [timelineId, urlKey]);

  const toggleLayout = (mode: LayoutMode) => {
    setLayout(mode);
    localStorage.setItem(`tl_layout_${timelineId}`, mode);
  };

  const save = useCallback((updated: Timeline) => {
    saveTimelineLocally(updated);
    setTimeline(updated);
    setSyncing(true);
    syncEvents(updated).finally(() => setSyncing(false));
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id || !timeline) return;
    const oldIdx = timeline.events.findIndex((ev) => ev.id === active.id);
    const newIdx = timeline.events.findIndex((ev) => ev.id === over.id);
    const reordered = arrayMove(timeline.events, oldIdx, newIdx).map((ev, i) => ({ ...ev, order: i }));
    save({ ...timeline, events: reordered });
  }, [timeline, save]);

  const handleSaveEvent = useCallback((data: Omit<TimelineEvent, "id" | "order" | "timelineId">) => {
    if (!timeline) return;
    if (editingEvent) {
      const events = timeline.events.map((ev) =>
        ev.id === editingEvent.id ? { ...ev, ...data } : ev
      );
      save({ ...timeline, events });
    } else {
      const newEvent: TimelineEvent = {
        ...data,
        id: `${timelineId}-${genId()}`,
        timelineId,
        order: timeline.events.length,
      };
      save({ ...timeline, events: [...timeline.events, newEvent] });
    }
  }, [timeline, editingEvent, timelineId, save]);

  const handleDelete = useCallback((id: string) => {
    if (!timeline) return;
    const events = timeline.events.filter((ev) => ev.id !== id).map((ev, i) => ({ ...ev, order: i }));
    save({ ...timeline, events });
  }, [timeline, save]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit access required</h1>
        <p className="text-gray-500 mb-6 max-w-sm">
          You need the edit link to modify this timeline. Ask the owner for the edit link.
        </p>
        <Link href="/" className="px-6 py-2.5 rounded-xl font-semibold btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!timeline) return null;

  const sorted = [...timeline.events].sort((a, b) => a.order - b.order);
  const activeEvent = activeId ? timeline.events.find((e) => e.id === activeId) : null;

  return (
    <div className="min-h-screen px-4 py-10 md:py-16">
      <div className={layout === "horizontal" ? "max-w-full" : "max-w-2xl mx-auto"}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-10 ${layout === "horizontal" ? "max-w-2xl mx-auto" : ""}`}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All timelines
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-black gradient-text truncate">{timeline.name}</h1>
              {timeline.description && (
                <p className="text-gray-500 mt-1 text-sm">{timeline.description}</p>
              )}
              {syncing && <p className="text-xs text-purple-500 mt-1 animate-pulse">Syncing…</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Link
                href={`/t/${timelineId}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                👁 Preview
              </Link>
              <button
                onClick={() => setShareOpen(true)}
                className="px-4 py-2 rounded-xl text-sm font-semibold btn-primary"
              >
                🔗 Share
              </button>
            </div>
          </div>
        </motion.div>

        {/* Toolbar: Add Event + Layout Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className={`flex items-center justify-between gap-4 mb-10 flex-wrap ${layout === "horizontal" ? "max-w-2xl mx-auto" : ""}`}
        >
          <button
            onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}
            className="group flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-white text-lg btn-primary"
          >
            <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
            Add Event
          </button>

          {/* Layout toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => toggleLayout("vertical")}
              title="Vertical layout"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                layout === "vertical"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <VerticalIcon />
              Vertical
            </button>
            <button
              onClick={() => toggleLayout("horizontal")}
              title="Horizontal layout"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                layout === "horizontal"
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <HorizontalIcon />
              Horizontal
            </button>
          </div>
        </motion.div>

        {/* Timeline */}
        {sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">✨</div>
            <p className="text-xl font-medium text-gray-500">No events yet</p>
            <p className="text-sm mt-2 text-gray-400">Add your first milestone!</p>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={layout === "vertical"
              ? [restrictToVerticalAxis, restrictToWindowEdges]
              : [restrictToHorizontalAxis, restrictToWindowEdges]
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {layout === "vertical" ? (
                <motion.div
                  key="vertical"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <SortableContext items={sorted.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                    <div className="relative">
                      <div className="timeline-line absolute left-[22px] top-0 bottom-0 w-0.5" />
                      <div className="space-y-6">
                        <AnimatePresence mode="popLayout">
                          {sorted.map((event) => (
                            <div key={event.id} className="relative flex items-start gap-5">
                              <div className="relative z-10 mt-5 flex-shrink-0">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 border-white ${COLOR_MAP[event.color].dot}`}
                                  style={{ boxShadow: `0 0 8px ${COLOR_MAP[event.color].glow}` }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <EventCard
                                  event={event}
                                  onEdit={(ev) => { setEditingEvent(ev); setIsModalOpen(true); }}
                                  onDelete={handleDelete}
                                />
                              </div>
                            </div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  </SortableContext>
                </motion.div>
              ) : (
                <motion.div
                  key="horizontal"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-x-auto pb-6"
                  style={{ cursor: "default" }}
                >
                  <SortableContext items={sorted.map((e) => e.id)} strategy={horizontalListSortingStrategy}>
                    <div className="relative inline-flex items-start gap-0 min-w-max px-4">
                      {/* Horizontal gradient line */}
                      <div
                        className="timeline-line absolute top-[18px] h-0.5"
                        style={{ left: "calc(2rem + 8px)", right: "calc(2rem + 8px)" }}
                      />
                      <AnimatePresence mode="popLayout">
                        {sorted.map((event, i) => (
                          <HorizontalEventCard
                            key={event.id}
                            event={event}
                            index={i}
                            onEdit={(ev) => { setEditingEvent(ev); setIsModalOpen(true); }}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </SortableContext>
                </motion.div>
              )}
            </AnimatePresence>

            <DragOverlay>
              {activeEvent && (
                <div
                  className={`bg-white rounded-2xl p-4 border-l-4 ${COLOR_MAP[activeEvent.color].border} rotate-1 opacity-90 w-52`}
                  style={{ boxShadow: "0 20px 48px rgba(0,0,0,0.18)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{activeEvent.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{activeEvent.date}</p>
                      <p className="font-bold text-gray-900 truncate">{activeEvent.title}</p>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {sorted.length > 1 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className={`text-center text-gray-300 text-sm mt-10 ${layout === "horizontal" ? "max-w-2xl mx-auto" : ""}`}
          >
            {layout === "vertical" ? "Drag cards to reorder your timeline" : "Drag cards left or right to reorder"}
          </motion.p>
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingEvent(null); }}
        onSave={handleSaveEvent}
        editingEvent={editingEvent}
      />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        timelineId={timelineId}
        editKey={timeline.editKey}
        timelineName={timeline.name}
      />
    </div>
  );
}

// ── Horizontal card (sortable, compact) ──────────────────────────────────────

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function HorizontalEventCard({
  event,
  index,
  onEdit,
  onDelete,
}: {
  event: TimelineEvent;
  index: number;
  onEdit: (e: TimelineEvent) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colors = COLOR_MAP[event.color];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: event.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", damping: 28, stiffness: 320, delay: index * 0.05 }}
      className="relative flex flex-col items-center w-52 px-3"
    >
      {/* Dot on the line */}
      <div
        className={`relative z-10 w-4 h-4 rounded-full border-2 border-white ${colors.dot} mb-4 flex-shrink-0`}
        style={{ boxShadow: `0 0 8px ${colors.glow}` }}
      />

      {/* Card */}
      <div
        className={`w-full bg-white rounded-2xl ${colors.bg} card-shadow p-4`}
        style={{
          borderTop: `4px solid ${colors.swatch}`,
          ...(isDragging ? { boxShadow: "0 16px 48px rgba(0,0,0,0.15)" } : {}),
        }}
      >
        {/* Drag handle row */}
        <div className="flex items-center justify-between mb-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-black/5 text-gray-300 hover:text-gray-400 transition-colors touch-none"
            title="Drag to reorder"
          >
            <svg width="14" height="8" viewBox="0 0 14 8" fill="currentColor">
              <rect x="0" y="0" width="14" height="2" rx="1" />
              <rect x="0" y="6" width="14" height="2" rx="1" />
            </svg>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onEdit(event)}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all"
              title="Edit"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                    className="px-1.5 py-0.5 text-xs font-semibold rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                  >
                    Del
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                  >
                    No
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="del"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmDelete(true)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Delete"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Emoji + title */}
        <div className="text-center mb-2">
          <div className="text-3xl leading-none mb-2">{event.emoji}</div>
          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{event.title}</h3>
        </div>

        {/* Date */}
        <p className="text-xs font-semibold text-gray-400 text-center mb-2">{formatDate(event.date)}</p>

        {/* Description */}
        {event.description && (
          <p className="text-xs text-gray-500 leading-relaxed text-center line-clamp-3">{event.description}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Layout icons ──────────────────────────────────────────────────────────────

function VerticalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="1" x2="3" y2="13" />
      <line x1="1" y1="4" x2="13" y2="4" />
      <line x1="1" y1="8" x2="10" y2="8" />
      <line x1="1" y1="12" x2="11" y2="12" />
    </svg>
  );
}

function HorizontalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="1" y1="3" x2="13" y2="3" />
      <line x1="4" y1="1" x2="4" y2="13" />
      <line x1="8" y1="1" x2="8" y2="10" />
      <line x1="12" y1="1" x2="12" y2="11" />
    </svg>
  );
}
