"use client";

import { EMOJI_LIST } from "@/types/timeline";

interface EmojiPickerProps {
  selected: string;
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`
            text-2xl h-10 w-full flex items-center justify-center rounded-lg
            transition-all duration-150 hover:scale-110 hover:bg-white/15
            ${selected === emoji
              ? "bg-white/20 ring-2 ring-purple-400 scale-110"
              : "bg-white/5"
            }
          `}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
