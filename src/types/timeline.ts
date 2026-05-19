export type ColorTheme =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "cyan";

export interface TimelineEvent {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  emoji: string;
  color: ColorTheme;
  order: number;
}

export const COLOR_MAP: Record<
  ColorTheme,
  { border: string; bg: string; glow: string; dot: string; label: string }
> = {
  red: {
    border: "border-red-500",
    bg: "bg-red-500/10",
    glow: "shadow-red-500/20",
    dot: "bg-red-500",
    label: "Red",
  },
  orange: {
    border: "border-orange-500",
    bg: "bg-orange-500/10",
    glow: "shadow-orange-500/20",
    dot: "bg-orange-500",
    label: "Orange",
  },
  yellow: {
    border: "border-yellow-500",
    bg: "bg-yellow-500/10",
    glow: "shadow-yellow-500/20",
    dot: "bg-yellow-500",
    label: "Yellow",
  },
  green: {
    border: "border-green-500",
    bg: "bg-green-500/10",
    glow: "shadow-green-500/20",
    dot: "bg-green-500",
    label: "Green",
  },
  blue: {
    border: "border-blue-500",
    bg: "bg-blue-500/10",
    glow: "shadow-blue-500/20",
    dot: "bg-blue-500",
    label: "Blue",
  },
  purple: {
    border: "border-purple-500",
    bg: "bg-purple-500/10",
    glow: "shadow-purple-500/20",
    dot: "bg-purple-500",
    label: "Purple",
  },
  pink: {
    border: "border-pink-500",
    bg: "bg-pink-500/10",
    glow: "shadow-pink-500/20",
    dot: "bg-pink-500",
    label: "Pink",
  },
  cyan: {
    border: "border-cyan-500",
    bg: "bg-cyan-500/10",
    glow: "shadow-cyan-500/20",
    dot: "bg-cyan-500",
    label: "Cyan",
  },
};

export const EMOJI_LIST = [
  "🎉", "🚀", "⭐", "🌟", "💫", "🎯",
  "🏆", "🎨", "🎭", "🎪", "🎢", "🌈",
  "🔥", "💎", "🌺", "🦋", "🐉", "🌙",
  "☀️", "⚡", "🎵", "🎸", "📚", "💡",
  "🏔️", "🌊", "🍕", "🎂", "🦄", "🤩",
];

export const STARTER_EVENTS: TimelineEvent[] = [
  {
    id: "starter-1",
    title: "The Journey Begins",
    date: "2020-01-01",
    description: "Started something amazing from scratch. The first step of a thousand-mile journey.",
    emoji: "🚀",
    color: "purple",
    order: 0,
  },
  {
    id: "starter-2",
    title: "First Big Milestone",
    date: "2020-06-15",
    description: "Crossed 1000 users in just 6 months! The momentum is building and there's no stopping now.",
    emoji: "🔥",
    color: "orange",
    order: 1,
  },
  {
    id: "starter-3",
    title: "Award Winning",
    date: "2021-03-22",
    description: "Won the regional innovation award. All the hard work and late nights finally paid off.",
    emoji: "🏆",
    color: "yellow",
    order: 2,
  },
  {
    id: "starter-4",
    title: "Navigated the Storm",
    date: "2021-11-08",
    description: "Overcame the biggest challenge yet and came out stronger. Resilience is the key to success.",
    emoji: "🌊",
    color: "blue",
    order: 3,
  },
  {
    id: "starter-5",
    title: "Celebration Time",
    date: "2023-12-31",
    description: "Reached 1 million users. Dreams do come true! This is just the beginning of the next chapter.",
    emoji: "🎉",
    color: "pink",
    order: 4,
  },
];
