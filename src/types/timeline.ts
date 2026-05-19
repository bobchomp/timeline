export type ColorTheme =
  | "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "cyan";

export interface TimelineEvent {
  id: string;
  timelineId: string;
  title: string;
  date: string; // YYYY-MM-DD
  description: string;
  emoji: string;
  color: ColorTheme;
  order: number;
}

export type LayoutMode = "vertical" | "horizontal";

export interface Timeline {
  id: string;
  name: string;
  description: string;
  editKey: string;
  createdAt: string;
  layout: LayoutMode;
  events: TimelineEvent[];
}

/** Stored in the owner's local "my timelines" list (includes editKey) */
export interface TimelineMeta {
  id: string;
  name: string;
  description: string;
  editKey: string;
  createdAt: string;
}

export const COLOR_MAP: Record<
  ColorTheme,
  { border: string; bg: string; dot: string; label: string; glow: string; swatch: string }
> = {
  red:    { border: "border-red-400",    bg: "bg-red-50",    dot: "bg-red-400",    label: "Red",    glow: "rgba(239,68,68,0.35)",   swatch: "#f87171" },
  orange: { border: "border-orange-400", bg: "bg-orange-50", dot: "bg-orange-400", label: "Orange", glow: "rgba(249,115,22,0.35)",  swatch: "#fb923c" },
  yellow: { border: "border-yellow-400", bg: "bg-yellow-50", dot: "bg-yellow-400", label: "Yellow", glow: "rgba(234,179,8,0.35)",   swatch: "#facc15" },
  green:  { border: "border-green-400",  bg: "bg-green-50",  dot: "bg-green-400",  label: "Green",  glow: "rgba(34,197,94,0.35)",   swatch: "#4ade80" },
  blue:   { border: "border-blue-400",   bg: "bg-blue-50",   dot: "bg-blue-400",   label: "Blue",   glow: "rgba(59,130,246,0.35)",  swatch: "#60a5fa" },
  purple: { border: "border-purple-400", bg: "bg-purple-50", dot: "bg-purple-400", label: "Purple", glow: "rgba(168,85,247,0.35)",  swatch: "#c084fc" },
  pink:   { border: "border-pink-400",   bg: "bg-pink-50",   dot: "bg-pink-400",   label: "Pink",   glow: "rgba(236,72,153,0.35)",  swatch: "#f472b6" },
  cyan:   { border: "border-cyan-400",   bg: "bg-cyan-50",   dot: "bg-cyan-400",   label: "Cyan",   glow: "rgba(6,182,212,0.35)",   swatch: "#22d3ee" },
};

export const EMOJI_LIST = [
  "🎉", "🚀", "⭐", "🌟", "💫", "🎯",
  "🏆", "🎨", "🎭", "🎪", "🎢", "🌈",
  "🔥", "💎", "🌺", "🦋", "🐉", "🌙",
  "☀️", "⚡", "🎵", "🎸", "📚", "💡",
  "🏔️", "🌊", "🍕", "🎂", "🦄", "🤩",
];

export function makeStarterEvents(timelineId: string): TimelineEvent[] {
  return [
    { id: `${timelineId}-s1`, timelineId, title: "The Journey Begins",  date: "2020-01-01", description: "Started something amazing from scratch.",                  emoji: "🚀", color: "purple", order: 0 },
    { id: `${timelineId}-s2`, timelineId, title: "First Big Milestone", date: "2020-06-15", description: "Crossed 1,000 users in just 6 months!",                    emoji: "🔥", color: "orange", order: 1 },
    { id: `${timelineId}-s3`, timelineId, title: "Award Winning",       date: "2021-03-22", description: "Won the regional innovation award.",                        emoji: "🏆", color: "yellow", order: 2 },
    { id: `${timelineId}-s4`, timelineId, title: "Navigated the Storm", date: "2021-11-08", description: "Overcame the biggest challenge and came out stronger.",     emoji: "🌊", color: "blue",   order: 3 },
    { id: `${timelineId}-s5`, timelineId, title: "Celebration Time",    date: "2023-12-31", description: "Reached 1 million users. Dreams do come true!",             emoji: "🎉", color: "pink",   order: 4 },
  ];
}
