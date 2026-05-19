"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Timeline, TimelineEvent, TimelineMeta, COLOR_MAP, makeStarterEvents } from "@/types/timeline";
import EventCard from "./EventCard";
import EventModal from "./EventModal";
import ShareModal from "./ShareModal";

const LIST_KEY = "tl_list";
const DATA_PREFIX = "tl_";

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

  useEffect(() => {
    async function load() {
      // 1. Determine editKey: URL param takes precedence, then localStorage
      let editKey = urlKey ?? getEditKeyFromList(timelineId);

      if (!editKey) {
        // Try fetching from API anyway (view), then block editing
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      // 2. Load timeline data from localStorage first (fastest)
      let tl = loadTimelineLocally(timelineId);

      // 3. If not in localStorage, try API
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

      // 4. If still nothing, create a brand-new timeline (user may be on a new device with edit link)
      if (!tl) {
        tl = {
          id: timelineId,
          name: "My Timeline",
          description: "",
          editKey,
          createdAt: new Date().toISOString(),
          events: makeStarterEvents(timelineId),
        };
        saveTimelineLocally(tl);
      } else {
        // Make sure editKey is stored (user arrived via share link)
        tl = { ...tl, editKey };
        saveTimelineLocally(tl);
      }

      // Persist to "my list" so it shows on dashboard
      const list: TimelineMeta[] = JSON.parse(localStorage.getItem(LIST_KEY) ?? "[]");
      if (!list.find((m) => m.id === timelineId)) {
        list.unshift({ id: tl.id, name: tl.name, description: tl.description, editKey, createdAt: tl.createdAt });
        localStorage.setItem(LIST_KEY, JSON.stringify(list));
      }

      setTimeline(tl);
      setLoading(false);
    }
    load();
  }, [timelineId, urlKey]);

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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
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
            <div className="flex items-center gap-2 shrink-0">
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

        {/* Add Event button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center mb-10"
        >
          <button
            onClick={() => { setEditingEvent(null); setIsModalOpen(true); }}
            className="group flex items-center gap-3 px-7 py-3.5 rounded-2xl font-bold text-white text-lg btn-primary"
          >
            <span className="text-2xl group-hover:rotate-90 transition-transform duration-200">+</span>
            Add Event
          </button>
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
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
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

            <DragOverlay>
              {activeEvent && (
                <div className={`bg-white rounded-2xl p-5 border-l-4 ${COLOR_MAP[activeEvent.color].border} rotate-1 opacity-90`}
                  style={{ boxShadow: "0 20px 48px rgba(0,0,0,0.18)" }}>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{activeEvent.emoji}</span>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{activeEvent.date}</p>
                      <p className="font-bold text-gray-900">{activeEvent.title}</p>
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
            className="text-center text-gray-300 text-sm mt-10"
          >
            Drag cards to reorder your timeline
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
