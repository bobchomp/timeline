"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Timeline, TimelineEvent, COLOR_MAP } from "@/types/timeline";

const DATA_PREFIX = "tl_";

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function TimelineViewer({ timelineId }: { timelineId: string }) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/timelines/${timelineId}`);
        const data = await res.json();
        if (data.timeline) {
          setTimeline(data.timeline);
          setLoading(false);
          return;
        }
      } catch { /* fall through */ }

      try {
        const raw = localStorage.getItem(`${DATA_PREFIX}${timelineId}`);
        if (raw) {
          setTimeline(JSON.parse(raw) as Timeline);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [timelineId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !timeline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Timeline not found</h1>
        <p className="text-gray-500 mb-6 max-w-sm">
          This timeline may be stored on another device, or the link may be incorrect.
        </p>
        <Link href="/" className="px-6 py-2.5 rounded-xl font-semibold btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const sorted = [...timeline.events].sort((a, b) => a.order - b.order);
  const isHorizontal = timeline.layout === "horizontal";

  return (
    <div className="min-h-screen px-4 py-10 md:py-16">
      <div className={isHorizontal ? "max-w-full" : "max-w-2xl mx-auto"}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-10 ${isHorizontal ? "max-w-2xl mx-auto" : ""}`}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All timelines
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black gradient-text">{timeline.name}</h1>
              {timeline.description && (
                <p className="text-gray-500 mt-1">{timeline.description}</p>
              )}
            </div>
            <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full mt-1">
              👁 View only
            </span>
          </div>
        </motion.div>

        {/* Timeline */}
        {sorted.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-lg font-medium text-gray-500">No events yet</p>
          </div>
        ) : isHorizontal ? (
          <HorizontalView events={sorted} />
        ) : (
          <VerticalView events={sorted} />
        )}
      </div>
    </div>
  );
}

function VerticalView({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative">
      <div className="timeline-line absolute left-[22px] top-0 bottom-0 w-0.5" />
      <div className="space-y-6">
        <AnimatePresence>
          {events.map((event, i) => {
            const colors = COLOR_MAP[event.color];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative flex items-start gap-5"
              >
                <div className="relative z-10 mt-5 flex-shrink-0">
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-white ${colors.dot}`}
                    style={{ boxShadow: `0 0 8px ${colors.glow}` }}
                  />
                </div>
                <div className={`flex-1 bg-white rounded-2xl p-5 border-l-4 ${colors.border} ${colors.bg} card-shadow`}>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl leading-none select-none shrink-0">{event.emoji}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        {formatDate(event.date)}
                      </p>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{event.title}</h3>
                      {event.description && (
                        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{event.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function HorizontalView({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="overflow-x-auto pb-6">
      <div className="relative inline-flex items-start gap-0 min-w-max px-4">
        {/* Horizontal gradient line */}
        <div
          className="timeline-line absolute top-[18px] h-0.5"
          style={{ left: "calc(2rem + 8px)", right: "calc(2rem + 8px)" }}
        />
        <AnimatePresence>
          {events.map((event, i) => {
            const colors = COLOR_MAP[event.color];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative flex flex-col items-center w-52 px-3"
              >
                {/* Dot */}
                <div
                  className={`relative z-10 w-4 h-4 rounded-full border-2 border-white ${colors.dot} mb-4 flex-shrink-0`}
                  style={{ boxShadow: `0 0 8px ${colors.glow}` }}
                />
                {/* Card */}
                <div
                  className={`w-full bg-white rounded-2xl ${colors.bg} card-shadow p-4`}
                  style={{ borderTop: `4px solid ${colors.swatch}` }}
                >
                  <div className="text-center mb-2">
                    <div className="text-3xl leading-none mb-2">{event.emoji}</div>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{event.title}</h3>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 text-center mb-2">{formatDateShort(event.date)}</p>
                  {event.description && (
                    <p className="text-xs text-gray-500 leading-relaxed text-center line-clamp-3">{event.description}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
